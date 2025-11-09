const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pygely_game',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const algebraController = require('./algebraController');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// ==========================================================
// === LÓGICA DE EVALUACIÓN CENTRALIZADA (Escalabilidad) ===
// ==========================================================

/**
 * Evalúa si la respuesta de un intento es correcta basándose en el tipo de desafío.
 * @param {object} desafio - Objeto del desafío (incluye tipo, parametros, respuesta_correcta).
 * @param {object} body - Datos enviados por el usuario (incluye respuesta_dada, limite_izquierdo, limite_derecho).
 * @returns {boolean} True si la respuesta es correcta, false en caso contrario.
 */
const evaluateAttempt = (desafio, body) => {
    try {
        const { tipo, parametros: rawParams, respuesta_correcta } = desafio;
        const { respuesta_dada, limite_izquierdo, limite_derecho } = body;

        let parametros = {};
        try {
            // Asegúrate de que los parámetros sean parseados correctamente (ya vienen como string en la DB)
            parametros = rawParams ? JSON.parse(rawParams) : {};
        } catch (e) {
            console.error('Error al parsear parámetros del desafío:', e);
            parametros = {};
        }

        switch (tipo) {
            case 'aproximacion':
            case 'precision':
                // Lógica para Mundo 1: Comparación simple de la respuesta con tolerancia
                const tolerancia = parametros.tolerancia || 0.1;
                return Math.abs(respuesta_dada - respuesta_correcta) <= tolerancia;

            case 'limites_laterales':
                // Lógica para Mundo 2: Comparación de límites laterales
                if (limite_izquierdo === undefined || limite_derecho === undefined) return false;

                const limites_iguales = limite_izquierdo === limite_derecho;
                const limite_existe_esperado = respuesta_correcta === 1; // 1: Límite existe, 0: Límite NO existe

                // Es correcto si: (Limites son iguales Y se esperaba que existiera) O (Limites son diferentes Y se esperaba que NO existiera)
                return (limites_iguales && limite_existe_esperado) || (!limites_iguales && !limite_existe_esperado);

            case 'propiedades_limites':
            case 'operaciones_algebraicas':
                // Lógica para Mundo 3: Propiedades de límites (suma, resta, producto, división)
                // En este caso, la respuesta correcta se calcula dinámicamente en el frontend
                // y se envía en limite_izquierdo y limite_derecho

                // limite_izquierdo = valor de lim f(x)
                // limite_derecho = valor de lim g(x)
                // respuesta_dada = resultado que el usuario predijo

                if (limite_izquierdo === undefined || limite_derecho === undefined) {
                    console.warn('Mundo 3: Se esperaban limite_izquierdo y limite_derecho');
                    return false;
                }

                // Calcular la respuesta correcta según los límites individuales
                // El frontend ya calculó y envió estos valores
                const resultadoEsperado = respuesta_correcta; // Solo si existe un valor de referencia

                // Validar con tolerancia
                const toleranciaOps = parametros.tolerancia || 0.01;

                // Si hay respuesta_correcta definida, usarla (para casos específicos)
                if (resultadoEsperado !== null && resultadoEsperado !== undefined) {
                    return Math.abs(respuesta_dada - resultadoEsperado) <= toleranciaOps;
                }

                // Si no hay respuesta_correcta, el backend confía en que el frontend
                // calculó correctamente y solo verifica que sea un número válido
                return !isNaN(respuesta_dada);

            // Agrega aquí los casos para los próximos mundos (e.g., 'discontinuidad', 'asintota')

            default:
                console.warn(`Tipo de desafío desconocido: ${tipo}`);
                return false; // Por defecto, si el tipo es desconocido, es incorrecto.
        }
    } catch (e) {
        console.error('Error al evaluar intento:', e);
        return false;
    }
};

// ==========================================================
// === RUTAS DE AUTENTICACIÓN (sin cambios) ===
// ==========================================================

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, email, password, tipo } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, tipo) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, tipo || 'estudiante']
        );
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, tipo: user.tipo },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                tipo: user.tipo
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ==========================================================
// === RUTAS DE MUNDOS Y PROGRESO (sin cambios) ===
// ==========================================================

// Obtener todos los mundos
app.get('/api/mundos', authenticateToken, async (req, res) => {
    try {
        const [mundos] = await pool.query('SELECT * FROM mundos ORDER BY orden');
        const [progreso] = await pool.query(
            'SELECT id_mundo, estado, porcentaje_completado FROM progreso_estudiante WHERE id_estudiante = ?',
            [req.user.id]
        );
        const progresoMap = {};
        progreso.forEach(p => {
            progresoMap[p.id_mundo] = {
                estado: p.estado,
                porcentaje: p.porcentaje_completado
            };
        });

        // Determinar qué mundos están desbloqueados para este estudiante
        const mundosConProgreso = mundos.map((mundo, index) => {
            const progresoMundo = progresoMap[mundo.id] || { estado: 'no_iniciado', porcentaje: 0 };

            // El Mundo 1 siempre está desbloqueado
            let bloqueado = false;
            if (mundo.orden > 1) {
                // Los demás mundos están desbloqueados solo si el anterior está completado
                const mundoAnterior = mundos.find(m => m.orden === mundo.orden - 1);
                if (mundoAnterior) {
                    const progresoAnterior = progresoMap[mundoAnterior.id];
                    bloqueado = !progresoAnterior || progresoAnterior.estado !== 'completado';
                }
            }

            return {
                ...mundo,
                estado: bloqueado ? 'bloqueado' : 'activo',
                progreso: progresoMundo
            };
        });

        console.log('🌍 Mundos calculados para usuario', req.user.id, ':',
            mundosConProgreso.map(m => `${m.nombre}: ${m.estado}`).join(', ')
        );

        res.json(mundosConProgreso);
    } catch (error) {
        console.error('Error al obtener mundos:', error);
        res.status(500).json({ error: 'Error al obtener mundos' });
    }
});

// Obtener detalles de un mundo específico
app.get('/api/mundos/:id', authenticateToken, async (req, res) => {
    try {
        const [mundos] = await pool.query('SELECT * FROM mundos WHERE id = ?', [req.params.id]);
        if (mundos.length === 0) {
            return res.status(404).json({ error: 'Mundo no encontrado' });
        }
        const [desafios] = await pool.query(
            'SELECT * FROM desafios WHERE id_mundo = ?',
            [req.params.id]
        );
        res.json({
            mundo: mundos[0],
            desafios
        });
    } catch (error) {
        console.error('Error al obtener mundo:', error);
        res.status(500).json({ error: 'Error al obtener mundo' });
    }
});

// Iniciar un mundo
app.post('/api/progreso/iniciar', authenticateToken, async (req, res) => {
    try {
        const { id_mundo } = req.body;
        const [existing] = await pool.query(
            'SELECT * FROM progreso_estudiante WHERE id_estudiante = ? AND id_mundo = ?',
            [req.user.id, id_mundo]
        );
        if (existing.length > 0) {
            return res.json({ message: 'Mundo ya iniciado', progreso: existing[0] });
        }
        const [result] = await pool.query(
            'INSERT INTO progreso_estudiante (id_estudiante, id_mundo, estado, fecha_inicio) VALUES (?, ?, ?, NOW())',
            [req.user.id, id_mundo, 'en_progreso']
        );
        res.status(201).json({
            message: 'Mundo iniciado',
            progresoId: result.insertId
        });
    } catch (error) {
        console.error('Error al iniciar mundo:', error);
        res.status(500).json({ error: 'Error al iniciar mundo' });
    }
});

// ==========================================================
// === RUTAS DE PRÁCTICA LIBRE (ÁLGEBRA) ===
// ==========================================================

// Generar ejercicio (sin autenticación requerida)
app.get('/api/algebra/ejercicio', (req, res) => {
    // Crear un req.user vacío para la función si no hay token
    req.user = req.user || null;
    algebraController.generarEjercicio(req, res);
});

// Validar respuesta (autenticación opcional)
app.post('/api/algebra/validar', (req, res, next) => {
    // Intentar autenticar, pero no requerir
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
            if (!err) req.user = user;
            algebraController.validarRespuesta(req, res);
        });
    } else {
        req.user = null;
        algebraController.validarRespuesta(req, res);
    }
});

// Obtener estadísticas (requiere autenticación)
app.get('/api/algebra/estadisticas', authenticateToken, algebraController.obtenerEstadisticas);

// ==========================================================
// === RUTA DE REGISTRO DE INTENTO (MODIFICADA) ===
// ==========================================================

// Registrar intento de desafío
app.post('/api/intentos', authenticateToken, async (req, res) => {
    console.log('=== INICIANDO REGISTRO DE INTENTO ===');
    console.log('Usuario:', req.user.id);
    console.log('Body recibido:', req.body);

    try {
        const {
            id_desafio,
            respuesta_dada,
            distancia_al_punto,
            tiempo_respuesta,
            limite_izquierdo,
            limite_derecho
        } = req.body;

        // 1. Obtener el desafío para validar
        const [desafios] = await pool.query(
            'SELECT id, id_mundo, nombre, tipo, CAST(parametros AS CHAR) as parametros, respuesta_correcta FROM desafios WHERE id = ?',
            [id_desafio]
        );

        if (desafios.length === 0) {
            console.log('❌ Desafío no encontrado');
            return res.status(404).json({ error: 'Desafío no encontrado' });
        }

        const desafio = desafios[0];
        console.log('Desafío encontrado:', desafio);

        // 2. Lógica de Evaluación Centralizada
        const es_correcto = evaluateAttempt(desafio, req.body);

        console.log('Evaluación:', {
            es_correcto,
            tipo_desafio: desafio.tipo
        });

        // 3. Registrar el intento
        const [result] = await pool.query(
            `INSERT INTO intentos (id_estudiante, id_desafio, respuesta_dada, es_correcto, distancia_al_punto, tiempo_respuesta, limite_izquierdo, limite_derecho) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, id_desafio, respuesta_dada, es_correcto, distancia_al_punto, tiempo_respuesta, limite_izquierdo, limite_derecho]
        );

        console.log('✅ Intento registrado con ID:', result.insertId);

        // 4. Si es correcto, actualizar progreso, gamificación y desbloqueo
        if (es_correcto) {
            console.log('🎯 Respuesta correcta, actualizando progreso...');
            const id_mundo = desafio.id_mundo;
            console.log('📍 ID del mundo a actualizar:', id_mundo);

            // Buscar/Actualizar el registro de progreso del mundo
            const [progresoMundo] = await pool.query(
                'SELECT * FROM progreso_estudiante WHERE id_estudiante = ? AND id_mundo = ?',
                [req.user.id, id_mundo]
            );

            console.log('🔍 Progreso encontrado:', progresoMundo.length > 0 ? 'SÍ' : 'NO');

            if (progresoMundo.length > 0) {
                console.log('📝 Actualizando progreso existente...');
                const [updateResult] = await pool.query(
                    `UPDATE progreso_estudiante SET intentos = intentos + 1, tiempo_total = tiempo_total + ?, porcentaje_completado = 100, estado = 'completado', fecha_completado = NOW() WHERE id_estudiante = ? AND id_mundo = ?`,
                    [tiempo_respuesta, req.user.id, id_mundo]
                );
                console.log('✅ Progreso actualizado. Filas afectadas:', updateResult.affectedRows);
            } else {
                console.log('➕ Creando nuevo registro de progreso...');
                const [insertResult] = await pool.query(
                    `INSERT INTO progreso_estudiante (id_estudiante, id_mundo, estado, porcentaje_completado, intentos, tiempo_total, fecha_inicio, fecha_completado) VALUES (?, ?, 'completado', 100, 1, ?, NOW(), NOW())`,
                    [req.user.id, id_mundo, tiempo_respuesta]
                );
                console.log('✅ Progreso creado con ID:', insertResult.insertId);
            }

            // Otorgar puntos
            const [puntosResult] = await pool.query(
                `INSERT INTO gamificacion (id_estudiante, tipo_recompensa, valor, nombre, descripcion) VALUES (?, 'puntos', 100, 'Mundo completado', ?)`,
                [req.user.id, `Has completado el Mundo ${id_mundo}`]
            );

            // Otorgar insignia según el mundo completado
            const insigniasPorMundo = {
                1: { nombre: 'Explorador del Valle', descripcion: 'Completaste el Mundo 1: Valle del Límite' },
                2: { nombre: 'Maestro Lateral', descripcion: 'Completaste el Mundo 2: Desfiladero de Convergencia' },
                3: { nombre: 'Alquimista Matemático', descripcion: 'Completaste el Mundo 3: Taller de Alquimia' },
                4: { nombre: 'Cazador de Discontinuidades', descripcion: 'Completaste el Mundo 4: Puente Roto' },
                5: { nombre: 'Maestro de Asíntotas', descripcion: 'Completaste el Mundo 5: Torre Infinita' },
                6: { nombre: 'Explorador del Abismo', descripcion: 'Completaste el Mundo 6: Abismo Indeterminado' },
                7: { nombre: 'Señor de la Continuidad', descripcion: 'Completaste el Mundo 7: Castillo de Continuidad' },
                8: { nombre: 'Gran Maestro de Límites', descripcion: 'Completaste el Mundo 8: Templo del Teorema' }
            };

            const insignia = insigniasPorMundo[id_mundo];
            if (insignia) {
                const [insigniaResult] = await pool.query(
                    `INSERT INTO gamificacion (id_estudiante, tipo_recompensa, valor, nombre, descripcion) VALUES (?, 'insignia', 1, ?, ?)`,
                    [req.user.id, insignia.nombre, insignia.descripcion]
                );
                console.log(`🏅 Insignia otorgada: ${insignia.nombre}`);
            }
        } else {
            console.log('❌ Respuesta incorrecta, no se actualiza progreso');
        }

        console.log('=== FIN REGISTRO DE INTENTO ===');

        // Preparar la respuesta
        const respuesta = {
            success: true,
            es_correcto,
            mensaje: es_correcto ? '¡Correcto! Has completado el desafío' : 'Intenta nuevamente',
            intentoId: result.insertId
        };

        // Si completó el mundo, agregar información del desbloqueo
        if (es_correcto) {
            respuesta.mundo_completado = true;
            respuesta.id_mundo_completado = desafio.id_mundo;
            respuesta.siguiente_mundo_desbloqueado = desafio.id_mundo + 1 <= 8 ? desafio.id_mundo + 1 : null;
            console.log('🎉 Mundo completado:', respuesta.id_mundo_completado);
            if (respuesta.siguiente_mundo_desbloqueado) {
                console.log('🔓 Siguiente mundo desbloqueado:', respuesta.siguiente_mundo_desbloqueado);
            }
        }

        console.log('📤 Enviando respuesta:', respuesta);
        res.json(respuesta);
    } catch (error) {
        console.error('💥 ERROR al registrar intento:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Error al registrar intento' });
    }
});

// Obtener gamificación del estudiante
app.get('/api/gamificacion', authenticateToken, async (req, res) => {
    try {
        const [recompensas] = await pool.query(
            `SELECT tipo_recompensa, SUM(valor) as total, COUNT(*) as cantidad FROM gamificacion WHERE id_estudiante = ? GROUP BY tipo_recompensa`,
            [req.user.id]
        );

        const [insignias] = await pool.query(
            `SELECT nombre, descripcion, fecha_obtencion FROM gamificacion WHERE id_estudiante = ? AND tipo_recompensa = 'insignia' ORDER BY fecha_obtencion DESC`,
            [req.user.id]
        );

        const puntos = recompensas.find(r => r.tipo_recompensa === 'puntos')?.total || 0;
        const totalInsignias = insignias.length;

        res.json({
            puntos,
            totalInsignias,
            insignias
        });
    } catch (error) {
        console.error('Error al obtener gamificación:', error);
        res.status(500).json({ error: 'Error al obtener gamificación' });
    }
});

// Solicitar pista
app.post('/api/pistas', authenticateToken, async (req, res) => {
    try {
        const { id_desafio } = req.body;

        // Obtener intentos previos para determinar nivel de pista
        const [intentos] = await pool.query(
            'SELECT COUNT(*) as total FROM intentos WHERE id_estudiante = ? AND id_desafio = ? AND es_correcto = FALSE',
            [req.user.id, id_desafio]
        );

        const nivelPista = Math.min(intentos[0].total + 1, 3);

        // Obtener el desafío para dar pista específica
        const [desafios] = await pool.query(
            'SELECT tipo FROM desafios WHERE id = ?',
            [id_desafio]
        );

        let pistas = {};

        if (desafios.length > 0 && desafios[0].tipo === 'propiedades_limites') {
            // Pistas específicas para Mundo 3
            pistas = {
                1: {
                    personaje: 'Calcín',
                    texto: 'Recuerda: el límite de una suma es la suma de los límites. Calcula cada límite por separado primero.'
                },
                2: {
                    personaje: 'Profe Numix',
                    texto: 'Evalúa lim f(x) y lim g(x) en el punto dado, luego aplica la operación matemática a esos resultados.'
                },
                3: {
                    personaje: 'Calcín',
                    texto: 'Si tienes f(x)=x y g(x)=2x en x=2, entonces lim(f+g) = lim(f) + lim(g) = 2 + 4 = 6.'
                }
            };
        } else {
            // Pistas generales
            pistas = {
                1: {
                    personaje: 'Calcín',
                    texto: 'Recuerda: para encontrar el límite, debes acercarte cada vez más al punto objetivo.'
                },
                2: {
                    personaje: 'Profe Numix',
                    texto: 'Observa los valores de f(x) en las piedras cercanas al punto. ¿Hacia qué número se aproximan?'
                },
                3: {
                    personaje: 'Calcín',
                    texto: 'Intenta moverte en pequeños pasos. El límite está muy cerca del punto que buscas.'
                }
            };
        }

        const pista = pistas[nivelPista];

        await pool.query(
            `INSERT INTO pistas_utilizadas (id_estudiante, id_desafio, nivel_pista, texto_pista, personaje_guia) VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, id_desafio, nivelPista, pista.texto, pista.personaje]
        );

        res.json(pista);
    } catch (error) {
        console.error('Error al obtener pista:', error);
        res.status(500).json({ error: 'Error al obtener pista' });
    }
});

// Obtener progreso de todos los estudiantes
app.get('/api/estadisticas/estudiantes', authenticateToken, async (req, res) => {
    try {
        if (req.user.tipo !== 'docente') {
            return res.status(403).json({ error: 'Acceso no autorizado' });
        }

        const query = 'SELECT u.id, u.nombre, u.email, COALESCE(COUNT(DISTINCT pe.id_mundo), 0) as mundos_iniciados, COALESCE(AVG(pe.porcentaje_completado), 0) as promedio_completado, COALESCE(SUM(pe.tiempo_total), 0) as tiempo_total FROM usuarios u LEFT JOIN progreso_estudiante pe ON u.id = pe.id_estudiante WHERE u.tipo = ? GROUP BY u.id, u.nombre, u.email';

        const [estudiantes] = await pool.query(query, ['estudiante']);
        res.json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '¡Backend funcionando correctamente!' });
});

module.exports = { pool };

// Al final del archivo server.js, antes de app.listen()
const path = require('path');

if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, '../pygelycgame/dist')));
  
  // Manejar rutas de React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../pygelycgame/dist/index.html'));
  });
}

const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red

app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 API disponible en:`);
    console.log(`   Local:   http://localhost:${PORT}/api`);
    //console.log(`   Red:     http://172.27.20.185:${PORT}/api`);
});
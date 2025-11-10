-- CREATE DATABASE IF NOT EXISTS pygelyc_game;
-- USE pygelyc_game;

-- Tabla de usuarios (estudiantes y docentes)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    tipo ENUM('estudiante', 'docente') DEFAULT 'estudiante',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mundos/niveles
CREATE TABLE mundos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL,
    estado ENUM('activo', 'bloqueado') DEFAULT 'bloqueado'
);

-- Tabla de desafíos por mundo
CREATE TABLE desafios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mundo INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    parametros TEXT,
    respuesta_correcta FLOAT,
    FOREIGN KEY (id_mundo) REFERENCES mundos(id) ON DELETE CASCADE
);

-- Tabla de progreso del estudiante
CREATE TABLE progreso_estudiante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_mundo INT NOT NULL,
    id_desafio INT,
    estado ENUM('no_iniciado', 'en_progreso', 'completado') DEFAULT 'no_iniciado',
    porcentaje_completado FLOAT DEFAULT 0,
    intentos INT DEFAULT 0,
    tiempo_total INT DEFAULT 0, -- en segundos
    fecha_inicio TIMESTAMP NULL,
    fecha_completado TIMESTAMP NULL,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_mundo) REFERENCES mundos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_desafio) REFERENCES desafios(id) ON DELETE CASCADE
);

-- Tabla de intentos detallados
CREATE TABLE intentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_desafio INT NOT NULL,
    respuesta_dada FLOAT,
    es_correcto BOOLEAN,
    distancia_al_punto FLOAT,
    tiempo_respuesta INT, -- en segundos
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_desafio) REFERENCES desafios(id) ON DELETE CASCADE
);

-- Tabla de errores comunes
CREATE TABLE errores_comunes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_desafio INT NOT NULL,
    tipo_error VARCHAR(100),
    descripcion TEXT,
    frecuencia INT DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_desafio) REFERENCES desafios(id) ON DELETE CASCADE
);

-- Tabla de gamificación (puntos, insignias)
CREATE TABLE gamificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    tipo_recompensa ENUM('puntos', 'insignia', 'logro') NOT NULL,
    valor INT DEFAULT 0,
    nombre VARCHAR(100),
    descripcion TEXT,
    fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de pistas utilizadas
CREATE TABLE pistas_utilizadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_desafio INT NOT NULL,
    nivel_pista INT,
    texto_pista TEXT,
    personaje_guia VARCHAR(50),
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_desafio) REFERENCES desafios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intentos_algebra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_estudiante INT NULL,  -- NULL si no hay login
    tipo_ejercicio ENUM('factorizacion', 'racionalizacion') NOT NULL,
    nivel ENUM('basico', 'intermedio', 'avanzado') NOT NULL,
    expresion_original TEXT NOT NULL,
    respuesta_dada TEXT NOT NULL,
    es_correcto BOOLEAN NOT NULL,
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_intentos_estudiante (id_estudiante, tipo_ejercicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE intentos
ADD COLUMN limite_izquierdo FLOAT NULL,
ADD COLUMN limite_derecho FLOAT NULL;

-- Insertar datos iniciales
INSERT INTO mundos (nombre, descripcion, orden, estado) VALUES
('Mundo 1: Definición de Límite', 'Valle con río serpenteante. Mecánica: Plataformas móviles para aproximación sucesiva al valor límite.', 1, 'activo'),
('Mundo 2: Límites Laterales y Existencia', 'Torre mística y caminos izquierdo/derecho para comprobar si los límites laterales coinciden.', 2, 'bloqueado'),
('Mundo 3: Propiedades de Límites', 'Taller de alquimia matemática para combinar límites como ingredientes (suma, producto, cociente).', 3, 'bloqueado'),
('Mundo 4: Límites Trigonométricos', 'Observatorio astronómico místico para calcular límites notables y funciones trigonométricas.', 4, 'bloqueado'),
('Mundo 5: Continuidad Puntual', 'Puente colgante roto sobre un vórtice para clasificar discontinuidades (removible, de salto, infinita).', 5, 'bloqueado'),
('Mundo 6: Teoremas de Continuidad en un Punto', 'Laboratorio de verificación con terminales de prueba de los tres requisitos de continuidad.', 6, 'bloqueado'),
('Mundo 7: Continuidad en un Intervalo Abierto', 'Carretera flotante donde Límix viaja en ContiCar esquivando huecos de discontinuidad.', 7, 'bloqueado'),
('Mundo 8: Continuidad en un Intervalo Cerrado', 'Circuito de carreras final donde se verifica la continuidad, incluyendo los límites laterales en los extremos.', 8, 'bloqueado');

-- Insertar desafíos del Mundo 1
INSERT INTO desafios (id_mundo, nombre, descripcion, tipo, parametros, respuesta_correcta) VALUES
(1, 'Aproximación Inicial', 'Mover a Límix sobre las piedras para aproximarse al punto a=2', 'aproximacion', 
'{"punto_objetivo": 2, "tolerancia": 0.1, "funcion": "x^2"}', 4.0),
(1, 'Observar Valores', 'Identificar los valores de f(x) en diferentes piedras', 'observacion',
'{"valores_x": [1.5, 1.8, 1.9, 2.0, 2.1], "funcion": "x^2"}', 4.0),
(1, 'Desafío de Precisión', 'Alcanzar el punto más cercano a a dentro del rango de tolerancia', 'precision',
'{"punto_objetivo": 3, "tolerancia": 0.05, "funcion": "2x+1"}', 7.0);

-- Insertar desafío del Mundo 2
INSERT INTO desafios (id_mundo, nombre, descripcion, tipo, parametros, respuesta_correcta) VALUES
(2, 'El Caso Disperso', 'Determinar si existe el límite en a=0 para f(x) = |x|/x.', 'limites_laterales', 
'{"punto_objetivo": 0, "funcion": "|x|/x", "limite_izquierdo_esperado": -1, "limite_derecho_esperado": 1}', 0.0); -- 0.0 significa que el límite NO existe

INSERT INTO desafios (
    id_mundo, 
    nombre, 
    descripcion,
    tipo, 
    parametros, 
    respuesta_correcta
) VALUES (
    3,
    'Propiedades Algebraicas',
    'Combina funciones usando operaciones algebraicas (suma, resta, producto, división)',
    'propiedades_limites',
    '{"tolerancia": 0.01, "niveles": 3, "punto_inicial": 2}',
    NULL  -- NULL porque la respuesta se calcula dinámicamente en el juego
);

INSERT INTO usuarios (nombre, email, password, tipo) 
VALUES (
    'Profesor 1', 
    'docente@pygely.com', 
    '$2b$10$rN4.3ZxVzYBPz5XQEK6RVeF7dxWdAO5N5TLZ/YXQ4vP5zXQEK6RVe', 
    'docente'
);

UPDATE usuarios
  SET password = '$2b$10$Riw9ake0DR9I7iZXRBtUy.ukJhL6MnK2HIULMEJl6ITJ2jQU4DZaG'
  WHERE email = 'docente@pygely.com';

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_progreso_estudiante ON progreso_estudiante(id_estudiante, id_mundo);
CREATE INDEX idx_intentos_estudiante ON intentos(id_estudiante, id_desafio);
CREATE INDEX idx_gamificacion_estudiante ON gamificacion(id_estudiante);

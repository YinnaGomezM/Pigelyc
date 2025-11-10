import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpresionAlgebraica from '../components/ExpresionAlgebraica';
import TecladoMatematico from '../components/TecladoMatematico';
import PasoResolver from '../components/PasoResolver';
import Calcin from '../components/Calcin';

export default function EjerciciosFactorizacion() {
    const { user, isAuthenticated } = useAuth();
    const [ejercicioActual, setEjercicioActual] = useState<any>(null);
    const [respuestaUsuario, setRespuestaUsuario] = useState('');
    const [nivel, setNivel] = useState('basico');
    const [puntos, setPuntos] = useState(0);
    const [mostrarPistas, setMostrarPistas] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [ejerciciosCompletados, setEjerciciosCompletados] = useState(0);
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        cargarEjercicio();
        // Cargar puntos del localStorage si no está autenticado
        if (!isAuthenticated) {
            const puntosGuardados = localStorage.getItem('puntos_factorizacion');
            if (puntosGuardados) setPuntos(parseInt(puntosGuardados));
        }
    }, [nivel]);

    const cargarEjercicio = async () => {
        setLoading(true);
        setRespuestaUsuario('');
        setMostrarPistas(false);
        setResultado(null);

        try {
            const response = await fetch(`${API_URL}/api/algebra/ejercicio?tipo=factorizacion&nivel=${nivel}`);
            const data = await response.json();
            setEjercicioActual(data);
        } catch (error) {
            console.error('Error al cargar ejercicio:', error);
        } finally {
            setLoading(false);
        }
    };

    const validarRespuesta = async () => {
        if (!respuestaUsuario.trim()) {
            alert('Por favor ingresa una respuesta');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/api/algebra/validar`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ejercicio_id: ejercicioActual.id,
                    tipo: 'factorizacion',
                    nivel,
                    expresion_original: ejercicioActual.expresion_original,
                    respuesta: respuestaUsuario
                })
            });

            const data = await response.json();
            setResultado(data);

            if (data.correcto) {
                const nuevosPuntos = puntos + data.puntos_ganados;
                setPuntos(nuevosPuntos);
                setEjerciciosCompletados(ejerciciosCompletados + 1);

                // Guardar en localStorage si no está autenticado
                if (!isAuthenticated) {
                    localStorage.setItem('puntos_factorizacion', nuevosPuntos.toString());
                }

                setTimeout(() => cargarEjercicio(), 2000);
            } else {
                setMostrarPistas(true);
            }
        } catch (error) {
            console.error('Error al validar respuesta:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link to="/practica" className="text-white/80 hover:text-white">
                        ← Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Factorización</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-white bg-yellow-500/30 px-4 py-2 rounded-lg">
                            ⭐ {puntos} pts
                        </div>
                        <select
                            value={nivel}
                            onChange={(e) => setNivel(e.target.value)}
                            className="bg-white/10 text-white border border-white/30 rounded-lg px-4 py-2"
                        >
                            <option value="basico">Básico</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                        </select>
                    </div>
                </div>

                {/* Ejercicio */}
                {ejercicioActual && !loading && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 mb-6">
                        <div className="text-center mb-6">
                            <p className="text-white/70 mb-2">Factoriza la siguiente expresión:</p>
                            <ExpresionAlgebraica expresion={ejercicioActual.expresion_original} />
                        </div>

                        <TecladoMatematico
                            value={respuestaUsuario}
                            onChange={setRespuestaUsuario}
                            placeholder="Escribe tu respuesta aquí..."
                        />

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={validarRespuesta}
                                disabled={loading || !respuestaUsuario.trim()}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                            >
                                {loading ? 'Validando...' : 'Validar Respuesta'}
                            </button>

                            <button
                                onClick={() => setMostrarPistas(!mostrarPistas)}
                                className="px-6 bg-blue-500/50 hover:bg-blue-500/70 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                💡 Pista
                            </button>
                        </div>

                        {/* Resultado */}
                        {resultado && (
                            <div className={`mt-6 p-4 rounded-lg ${resultado.correcto ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'}`}>
                                <p className="text-white font-bold text-center text-xl">
                                    {resultado.correcto ? '✓ ¡Correcto! +' + resultado.puntos_ganados + ' puntos' : '✗ Incorrecto'}
                                </p>
                                {!resultado.correcto && resultado.solucion && (
                                    <p className="text-white/80 text-center mt-2">
                                        Respuesta correcta: <ExpresionAlgebraica expresion={resultado.solucion} />
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="text-center text-white text-xl">Cargando ejercicio...</div>
                )}

                {/* Pistas */}
                {mostrarPistas && resultado && !resultado.correcto && (
                    <>
                        <Calcin {...({ mensaje: resultado.pasos?.[0] || "Intenta nuevamente", onClose: () => setMostrarPistas(false) } as any)} />
                        <PasoResolver pasos={resultado.pasos || []} />
                    </>
                )}

                {/* Banner de registro */}
                {!isAuthenticated && ejerciciosCompletados >= 5 && (
                    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                        <span>🎉 ¡Has completado 5 ejercicios!</span>
                        <Link to="/login" className="underline font-bold">
                            Regístrate para guardar tu progreso
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
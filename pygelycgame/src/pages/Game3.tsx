import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import Limix from '../components/Limix';
import ProfeNumix from '../components/ProfeNumix';
import Calcin from '../components/Calcin';
import Senalin from '../components/Senalin';

// Configuración general del desafío para MUNDO 3
const ID_DESAFIO = 5; // ID del desafío en la base de datos (siguiente después de 4)

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

interface Funcion {
  id: number;
  nombre: string;
  expresion: string;
  expresionLatex: string;
  valorEnPunto: number;
  color: string;
}

interface Operacion {
  id: string;
  simbolo: string;
  nombre: string;
  simboloLatex: string;
}

type GamePhase = 'intro' | 'seleccionFrascos' | 'seleccionOperacion' | 'prediccion' | 'experimento' | 'resultado' | 'success' | 'fail';

export default function Game3() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Estados del juego
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [frasco1, setFrasco1] = useState<Funcion | null>(null);
  const [frasco2, setFrasco2] = useState<Funcion | null>(null);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<Operacion | null>(null);
  const [prediccionUsuario, setPrediccionUsuario] = useState<string>('');
  const [resultadoReal, setResultadoReal] = useState<number | null>(null);
  const [esCorrecto, setEsCorrecto] = useState<boolean>(false);
  
  // Estados de UI
  const [showDialog, setShowDialog] = useState(true);
  const [dialogText, setDialogText] = useState('');
  const [dialogCharacter, setDialogCharacter] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const [showCalderoAnimation, setShowCalderoAnimation] = useState(false);
  
  // Estadísticas
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [initialTime, setInitialTime] = useState(Date.now());
  const [nivelActual, setNivelActual] = useState(1);

  // Punto donde se evalúa el límite (puede variar según el nivel)
  const [puntoLimite, setPuntoLimite] = useState(2);

  // Funciones disponibles (frascos)
  const funciones: Funcion[] = useMemo(() => [
    {
      id: 1,
      nombre: 'f(x)',
      expresion: 'x',
      expresionLatex: 'f(x) = x',
      valorEnPunto: puntoLimite,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 2,
      nombre: 'g(x)',
      expresion: '2x',
      expresionLatex: 'g(x) = 2x',
      valorEnPunto: 2 * puntoLimite,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 3,
      nombre: 'h(x)',
      expresion: 'x + 1',
      expresionLatex: 'h(x) = x + 1',
      valorEnPunto: puntoLimite + 1,
      color: 'from-orange-400 to-orange-600'
    },
    {
      id: 4,
      nombre: 'p(x)',
      expresion: '3',
      expresionLatex: 'p(x) = 3',
      valorEnPunto: 3,
      color: 'from-pink-400 to-pink-600'
    }
  ], [puntoLimite]);

  // Operaciones disponibles
  const operaciones: Operacion[] = useMemo(() => [
    { id: 'suma', simbolo: '+', nombre: 'Suma', simboloLatex: '+' },
    { id: 'resta', simbolo: '−', nombre: 'Resta', simboloLatex: '-' },
    { id: 'producto', simbolo: '×', nombre: 'Producto', simboloLatex: '\\cdot' },
    { id: 'division', simbolo: '÷', nombre: 'División', simboloLatex: '\\div' }
  ], []);

  useEffect(() => {
    if (gamePhase === 'intro') {
      showIntroDialog();
    }
  }, [gamePhase]);

  const showIntroDialog = () => {
    setDialogCharacter('Profe Numix');
    setDialogText(`¡Bienvenido al Taller de Alquimia Matemática! Hoy aprenderás a combinar límites como si fueran ingredientes mágicos. Recuerda: **El límite de una operación es la operación de los límites individuales.**`);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    if (gamePhase === 'intro') {
      setGamePhase('seleccionFrascos');
    } else if (gamePhase === 'resultado') {
      if (esCorrecto) {
        // Siguiente nivel o completar mundo
        if (nivelActual < 3) {
          iniciarNuevoNivel();
        } else {
          setGamePhase('success');
          setDialogCharacter('Profe Numix');
          setDialogText(`🎉 ¡Felicidades! Has dominado las propiedades de los límites. Has completado el Taller de Alquimia con ${correctAnswers + 1} aciertos.`);
          setShowDialog(true);
          setTimeout(() => navigate('/mundos'), 4000);
        }
      } else {
        setGamePhase('seleccionFrascos');
        setFrasco1(null);
        setFrasco2(null);
        setOperacionSeleccionada(null);
        setPrediccionUsuario('');
      }
    }
  };

  const iniciarNuevoNivel = () => {
    setNivelActual(prev => prev + 1);
    setFrasco1(null);
    setFrasco2(null);
    setOperacionSeleccionada(null);
    setPrediccionUsuario('');
    setGamePhase('seleccionFrascos');
    
    // Cambiar el punto del límite para el siguiente nivel
    if (nivelActual === 1) setPuntoLimite(3);
    if (nivelActual === 2) setPuntoLimite(1);
    
    setDialogCharacter('Profe Numix');
    setDialogText(`¡Nivel ${nivelActual + 1}! Ahora evaluaremos el límite cuando x→${nivelActual === 1 ? 3 : 1}.`);
    setShowDialog(true);
  };

  const seleccionarFrasco = (funcion: Funcion) => {
    if (!frasco1) {
      setFrasco1(funcion);
      setDialogCharacter('Señalín');
      setDialogText(`Has seleccionado ${funcion.nombre}. Ahora elige el segundo frasco.`);
      setShowDialog(true);
      setTimeout(() => setShowDialog(false), 1500);
    } else if (!frasco2 && funcion.id !== frasco1.id) {
      setFrasco2(funcion);
      setGamePhase('seleccionOperacion');
      setDialogCharacter('Señalín');
      setDialogText(`Excelente. Ahora elige la operación para combinar ${frasco1.nombre} y ${funcion.nombre}.`);
      setShowDialog(true);
      setTimeout(() => setShowDialog(false), 2000);
    } else if (funcion.id === frasco1?.id) {
      setDialogCharacter('Calcín');
      setDialogText('⚠️ No puedes seleccionar el mismo frasco dos veces. Elige otro diferente.');
      setShowDialog(true);
      setTimeout(() => setShowDialog(false), 2000);
    }
  };

  const seleccionarOperacion = (operacion: Operacion) => {
    if (gamePhase !== 'seleccionOperacion' || !frasco1 || !frasco2) return;
    
    setOperacionSeleccionada(operacion);
    setGamePhase('prediccion');
    // No mostramos el diálogo aquí para evitar que tape el panel de predicción
  };

  const calcularResultado = useCallback(() => {
    if (!frasco1 || !frasco2 || !operacionSeleccionada) return null;

    const val1 = frasco1.valorEnPunto;
    const val2 = frasco2.valorEnPunto;

    switch (operacionSeleccionada.id) {
      case 'suma':
        return val1 + val2;
      case 'resta':
        return val1 - val2;
      case 'producto':
        return val1 * val2;
      case 'division':
        if (val2 === 0) return 'indefinido';
        return val1 / val2;
      default:
        return null;
    }
  }, [frasco1, frasco2, operacionSeleccionada]);

  const ejecutarExperimento = async () => {
    if (!prediccionUsuario) {
      setDialogCharacter('Calcín');
      setDialogText('⚠️ Debes ingresar tu predicción antes de continuar.');
      setShowDialog(true);
      setTimeout(() => setShowDialog(false), 2000);
      return;
    }

    setGamePhase('experimento');
    setShowCalderoAnimation(true);
    setAttempts(prev => prev + 1);

    const resultado = calcularResultado();
    setResultadoReal(typeof resultado === 'number' ? resultado : null);

    // Esperar animación del caldero
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowCalderoAnimation(false);

    const prediccionNum = parseFloat(prediccionUsuario);
    const correcto = typeof resultado === 'number' && Math.abs(prediccionNum - resultado) < 0.01;

    setEsCorrecto(correcto);
    setGamePhase('resultado');

    const timeSpent = Math.floor((Date.now() - initialTime) / 1000);

    if (correcto) {
      setCorrectAnswers(prev => prev + 1);
      setDialogCharacter('Profe Numix');
      setDialogText(`✨ ¡Correcto! lim(x→${puntoLimite}) [${frasco1?.nombre} ${operacionSeleccionada?.simbolo} ${frasco2?.nombre}] = ${resultado}. La propiedad se cumple: el límite de la ${operacionSeleccionada?.nombre.toLowerCase()} es la ${operacionSeleccionada?.nombre.toLowerCase()} de los límites.`);
      
      await registerAttempt(prediccionNum, resultado as number, timeSpent, true);
    } else {
      setDialogCharacter('Calcín');
      setDialogText(`❌ Incorrecto. Tu predicción fue ${prediccionUsuario}, pero el resultado correcto es ${resultado}. Veamos paso a paso: lim(${frasco1?.nombre})=${frasco1?.valorEnPunto}, lim(${frasco2?.nombre})=${frasco2?.valorEnPunto}. Entonces ${frasco1?.valorEnPunto} ${operacionSeleccionada?.simbolo} ${frasco2?.valorEnPunto} = ${resultado}.`);
      
      await registerAttempt(prediccionNum, resultado as number, timeSpent, false);
    }

    setShowDialog(true);
  };

  const registerAttempt = async (respuestaDada: number, resultadoReal: number, timeSpent: number, esCorrecto: boolean) => {
    console.log('🎯 Registrando intento Mundo 3:', {
      id_desafio: ID_DESAFIO,
      respuesta_dada: respuestaDada,
      resultado_real: resultadoReal,
      limite_izquierdo: frasco1?.valorEnPunto,  // Valor de lim f(x)
      limite_derecho: frasco2?.valorEnPunto,     // Valor de lim g(x)
      operacion: operacionSeleccionada?.nombre,
      tiempo_respuesta: timeSpent,
      es_correcto: esCorrecto
    });
    
    try {
      const response = await fetch(`${API_URL}/intentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_desafio: ID_DESAFIO,
          respuesta_dada: respuestaDada,
          limite_izquierdo: frasco1?.valorEnPunto,   // lim f(x)
          limite_derecho: frasco2?.valorEnPunto,      // lim g(x)
          distancia_al_punto: esCorrecto ? 0 : Math.abs(respuestaDada - resultadoReal),
          tiempo_respuesta: timeSpent
        })
      });
      
      const data = await response.json();
      console.log('✅ Respuesta del servidor:', data);
      return data;
    } catch (error) {
      console.error('❌ Error al registrar intento:', error);
      return null;
    }
  };

  const requestHint = async () => {
    try {
      const response = await fetch(`${API_URL}/pistas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_desafio: ID_DESAFIO })
      });

      const pista = await response.json();
      setDialogCharacter('Calcín');
      setHintText(pista.texto || `Recuerda: para calcular lim[f(x) ${operacionSeleccionada?.simbolo || '○'} g(x)], primero calcula lim f(x) y lim g(x), luego aplica la operación.`);
      setShowHint(true);
    } catch (error) {
      console.error('Error al solicitar pista:', error);
      setHintText('Calcula primero cada límite por separado, luego combínalos con la operación.');
      setShowHint(true);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="relative w-full aspect-[16/9] max-h-screen overflow-hidden"
        style={{ 
          backgroundImage: "url('/img/fondo3.PNG')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          maxWidth: '1200px'
        }}
      >
        
        {/* Título y nivel */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-900/80 to-pink-900/80 px-6 py-3 rounded-2xl shadow-2xl border-2 border-purple-400">
            Taller de Alquimia - Nivel {nivelActual}
          </h2>
          <div className="mt-2 text-lg font-semibold text-yellow-300 drop-shadow-lg">
            <InlineMath math={`\\lim_{x\\to${puntoLimite}}`} />
          </div>
        </div>

        {/* Caldero central */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/4 z-5">
          <div className={`w-32 h-32 transition-all duration-500 ${
            showCalderoAnimation 
              ? 'animate-pulse scale-110' 
              : ''
          }`}>
            <div className="relative">
              {/* Caldero base */}
              <div className="absolute w-32 h-32 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-full border-4 border-yellow-600 shadow-2xl">
                {/* Líquido burbujeante */}
                <div className={`absolute inset-4 bg-gradient-to-t ${
                  esCorrecto && gamePhase === 'resultado'
                    ? 'from-green-400 to-emerald-300'
                    : gamePhase === 'resultado' && !esCorrecto
                    ? 'from-red-400 to-orange-300'
                    : 'from-green-500 to-green-300'
                } rounded-full opacity-80 ${
                  showCalderoAnimation ? 'animate-bounce' : ''
                }`} />
                
                {/* Burbujas */}
                {showCalderoAnimation && (
                  <>
                    <div className="absolute w-3 h-3 bg-white rounded-full opacity-70 animate-ping" style={{ top: '30%', left: '20%' }} />
                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-ping" style={{ top: '40%', left: '70%', animationDelay: '0.3s' }} />
                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-ping" style={{ top: '50%', left: '45%', animationDelay: '0.6s' }} />
                  </>
                )}
              </div>

              {/* Fórmula sobre el caldero */}
              {frasco1 && frasco2 && operacionSeleccionada && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-xl border-2 border-purple-400 whitespace-nowrap">
                  <InlineMath math={`${frasco1.nombre} ${operacionSeleccionada.simboloLatex} ${frasco2.nombre}`} />
                </div>
              )}

              {/* Resultado */}
              {gamePhase === 'resultado' && resultadoReal !== null && (
                <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-xl border-2 font-bold text-xl ${
                  esCorrecto 
                    ? 'bg-green-400 border-green-600 text-green-900'
                    : 'bg-red-400 border-red-600 text-red-900'
                }`}>
                  = {resultadoReal}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Espacios para frascos seleccionados */}
        {frasco1 && (
          <div className="absolute left-[35%] top-[48%] transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-20 h-24 bg-gradient-to-b ${frasco1.color} rounded-t-full rounded-b-lg border-4 border-white shadow-2xl flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{frasco1.nombre}</span>
            </div>
            <div className="text-center mt-2 text-xs bg-white/80 px-2 py-1 rounded">
              <InlineMath math={`\\lim = ${frasco1.valorEnPunto}`} />
            </div>
          </div>
        )}

        {frasco2 && (
          <div className="absolute left-[65%] top-[48%] transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-20 h-24 bg-gradient-to-b ${frasco2.color} rounded-t-full rounded-b-lg border-4 border-white shadow-2xl flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{frasco2.nombre}</span>
            </div>
            <div className="text-center mt-2 text-xs bg-white/80 px-2 py-1 rounded">
              <InlineMath math={`\\lim = ${frasco2.valorEnPunto}`} />
            </div>
          </div>
        )}

        {/* Frascos disponibles (estantes) */}
        {gamePhase === 'seleccionFrascos' && (
          <div className="absolute top-[20%] left-[10%] flex flex-col gap-4">
            {funciones.slice(0, 2).map((funcion, idx) => (
              <div
                key={funcion.id}
                onClick={() => seleccionarFrasco(funcion)}
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${
                  frasco1?.id === funcion.id ? 'opacity-30' : 'hover:animate-bounce'
                }`}
              >
                <div className={`w-16 h-20 bg-gradient-to-b ${funcion.color} rounded-t-full rounded-b-lg border-4 border-white shadow-2xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{funcion.nombre}</span>
                </div>
                <div className="text-center mt-1 text-xs bg-white/80 px-1 py-0.5 rounded">
                  <InlineMath math={funcion.expresionLatex.split('=')[1]} />
                </div>
              </div>
            ))}
          </div>
        )}

        {gamePhase === 'seleccionFrascos' && (
          <div className="absolute top-[20%] right-[10%] flex flex-col gap-4">
            {funciones.slice(2, 4).map((funcion, idx) => (
              <div
                key={funcion.id}
                onClick={() => seleccionarFrasco(funcion)}
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${
                  frasco1?.id === funcion.id ? 'opacity-30' : 'hover:animate-bounce'
                }`}
              >
                <div className={`w-16 h-20 bg-gradient-to-b ${funcion.color} rounded-t-full rounded-b-lg border-4 border-white shadow-2xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{funcion.nombre}</span>
                </div>
                <div className="text-center mt-1 text-xs bg-white/80 px-1 py-0.5 rounded">
                  <InlineMath math={funcion.expresionLatex.split('=')[1]} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Símbolos de operaciones */}
        {gamePhase === 'seleccionOperacion' && (
          <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 flex gap-6">
            {operaciones.map((op) => (
              <div
                key={op.id}
                onClick={() => seleccionarOperacion(op)}
                className="cursor-pointer transition-all duration-300 hover:scale-125 hover:rotate-12"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-4 border-yellow-300 shadow-2xl flex items-center justify-center hover:shadow-yellow-500/50 animate-pulse">
                  <span className="text-white font-extrabold text-3xl">{op.simbolo}</span>
                </div>
                <div className="text-center mt-1 text-xs font-semibold text-yellow-300 drop-shadow-lg">
                  {op.nombre}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Panel de predicción - REPOSICIONADO EN LA PARTE SUPERIOR CENTRAL */}
        {gamePhase === 'prediccion' && (
          <div className="absolute top-[22%] left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-6 w-96 z-50 border-4 border-blue-400">
            <h3 className="text-xl font-bold text-blue-700 mb-3 text-center">¿Cuál es el límite?</h3>
            <div className="mb-4 text-center bg-purple-100 py-2 rounded-lg">
              <InlineMath math={`\\lim_{x\\to${puntoLimite}} [${frasco1?.nombre} ${operacionSeleccionada?.simboloLatex} ${frasco2?.nombre}] = ?`} />
            </div>
            <input
              type="number"
              step="0.01"
              value={prediccionUsuario}
              onChange={(e) => setPrediccionUsuario(e.target.value)}
              placeholder="Tu respuesta..."
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <button
              onClick={ejecutarExperimento}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all w-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🧪 ¡Mezclar!
            </button>
            {/* Instrucción pequeña de Calcín dentro del panel */}
            <div className="mt-3 text-xs text-gray-600 text-center italic">
              💡 Calcín dice: Calcula cada límite primero, luego aplica la operación
            </div>
          </div>
        )}

        {/* Personajes */}
        {/* Limix - Personaje principal más grande y centrado */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 hover:scale-110 z-20" style={{ transform: 'translateX(-50%) scale(1.5)' }}>
          <Limix />
        </div>

        {/* Calcin y ProfeNumix removidos del fondo - solo aparecen en diálogos */}

        {/* Diálogo - SOLO APARECE EN FASES ESPECÍFICAS, NO EN PREDICCIÓN */}
        {showDialog && gamePhase !== 'prediccion' && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-6 max-w-2xl z-50 border-4 border-blue-400 animate-fade-in">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 flex items-center justify-center scale-75">
                {dialogCharacter === 'Calcín' && <Calcin />}
                {dialogCharacter === 'Profe Numix' && <ProfeNumix />}
                {dialogCharacter === 'Señalín' && <Senalin direction="right" label="" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-blue-700 mb-2">{dialogCharacter}</h3>
                <div className="text-gray-800 text-base leading-relaxed">
                  {dialogText}
                </div>
              </div>
            </div>
            {(gamePhase === 'intro' || gamePhase === 'resultado' || gamePhase === 'success') && (
              <button
                onClick={closeDialog}
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all w-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* Pista */}
        {showHint && (
          <div className="absolute top-24 right-4 bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-yellow-400 rounded-2xl p-5 max-w-xs z-40 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="w-12 h-12 flex items-center justify-center scale-50">
                <Calcin />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 mb-1">Calcín</p>
                <p className="text-sm text-amber-900 leading-relaxed">{hintText}</p>
              </div>
            </div>
            <button
              onClick={() => setShowHint(false)}
              className="mt-3 text-xs text-amber-700 hover:text-amber-900 font-semibold hover:underline w-full text-center py-1"
            >
              Cerrar pista
            </button>
          </div>
        )}

        {/* HUD del jugador */}
        <div className="absolute top-4 left-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 shadow-2xl border-2 border-cyan-400 backdrop-blur-sm z-10">
          <div className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-2">
            <span className="text-lg">👤</span>
            <span>{user?.nombre || 'Estudiante'}</span>
          </div>
          <div className="text-xs text-gray-300 flex items-center gap-2 mb-1">
            <span className="text-base">🎯</span>
            <span>Intentos: <span className="font-bold text-white">{attempts}</span></span>
          </div>
          <div className="text-xs text-gray-300 flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>Correctos: <span className="font-bold text-green-400">{correctAnswers}</span></span>
          </div>
        </div>

        {/* Botón de pista */}
        <button
          onClick={requestHint}
          className="absolute top-4 right-4 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 hover:rotate-12 border-2 border-yellow-300 z-10"
          title="Solicitar pista"
        >
          <span className="text-2xl">💡</span>
        </button>

        {/* Botón salir */}
        <button
          onClick={() => navigate('/mundos')}
          className="absolute bottom-4 left-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl shadow-2xl transition-all font-semibold transform hover:scale-105 border-2 border-red-400 z-10"
        >
          ← Salir
        </button>
      </div>
    </div>
  );
}
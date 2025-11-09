import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex'
import Limix from '../components/Limix';
import ProfeNumix from '../components/ProfeNumix';
import Calcin from '../components/Calcin';
import Senalin from '../components/Senalin';

// Configuración general del desafío para MUNDO 2
const ID_DESAFIO = 4;
const A = 0;
const L_IZQUIERDA = -1;
const L_DERECHA = 1;

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Orbe {
  id: number;
  camino: 'izquierda' | 'derecha';
  x: number;
  y: number;
  valorX: number;
  valorFx: number;
  recolectado: boolean;
}

interface LimiteLateral {
  valor: number | null;
  alcanzado: boolean;
}

export default function Game2() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [limixPos, setLimixPos] = useState({ x: 520, y: 550 });
  const [currentPath, setCurrentPath] = useState<'ninguno' | 'izquierda' | 'derecha'>('ninguno');
  const [currentOrbeIndex, setCurrentOrbeIndex] = useState(-1);
  const [gamePhase, setGamePhase] = useState<'intro' | 'seleccion' | 'recorrido' | 'comparacion' | 'success' | 'fail'>('intro');

  const [limiteIzquierda, setLimiteIzquierda] = useState<LimiteLateral>({ valor: null, alcanzado: false });
  const [limiteDerecha, setLimiteDerecha] = useState<LimiteLateral>({ valor: null, alcanzado: false });
  
  const [showDialog, setShowDialog] = useState(true);
  const [dialogText, setDialogText] = useState('');
  const [dialogCharacter, setDialogCharacter] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [initialTime, setInitialTime] = useState(Date.now());

  // POSICIONES AJUSTADAS: Orbes más abajo (y mayor) y más a la derecha (x mayor)
  const orbes: Orbe[] = useMemo(() => [
    { id: 1, camino: 'izquierda', x: 300, y: 590, valorX: -0.2, valorFx: -1, recolectado: false },
    { id: 2, camino: 'izquierda', x: 370, y: 520, valorX: -0.1, valorFx: -1, recolectado: false },
    { id: 3, camino: 'izquierda', x: 440, y: 460, valorX: -0.01, valorFx: -1, recolectado: false },
    { id: 4, camino: 'izquierda', x: 510, y: 400, valorX: -0.001, valorFx: -1, recolectado: false },
    { id: 5, camino: 'izquierda', x: 580, y: 340, valorX: -0.0001, valorFx: -1, recolectado: false },
    { id: 6, camino: 'derecha', x: 860, y: 590, valorX: 0.2, valorFx: 1, recolectado: false },
    { id: 7, camino: 'derecha', x: 790, y: 520, valorX: 0.1, valorFx: 1, recolectado: false },
    { id: 8, camino: 'derecha', x: 720, y: 460, valorX: 0.01, valorFx: 1, recolectado: false },
    { id: 9, camino: 'derecha', x: 650, y: 400, valorX: 0.001, valorFx: 1, recolectado: false },
    { id: 10, camino: 'derecha', x: 580, y: 340, valorX: 0.0001, valorFx: 1, recolectado: false },
  ], []);

  const [orbesEstado, setOrbesEstado] = useState(orbes);

  useEffect(() => {
    if (gamePhase === 'intro') {
      showIntroDialog();
    } else if (gamePhase === 'comparacion') {
      if (limiteIzquierda.alcanzado && limiteDerecha.alcanzado) {
        handleComparison();
      }
    }
  }, [gamePhase, limiteIzquierda.alcanzado, limiteDerecha.alcanzado]);

  const showIntroDialog = () => {
    setDialogCharacter('Profe Numix');
    setDialogText(`¡Bienvenido al Desfiladero de Convergencia! Tu misión es comprobar si el límite de la función f(x)=|x|/x existe cuando x se aproxima a ${A}. Recuerda: **El límite existe solo si el Camino Izquierdo y el Camino Derecho llegan al mismo lugar.**`);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    if (gamePhase === 'intro') {
      setGamePhase('seleccion');
    }
  };
  
  const startPath = (camino: 'izquierda' | 'derecha') => {
    if (currentPath !== 'ninguno' || gamePhase !== 'seleccion') return;

    setCurrentPath(camino);
    setGamePhase('recorrido');
    setAttempts(prev => prev + 1);
    setStartTime(Date.now());
    
    const primerOrbe = orbesEstado.find(o => o.camino === camino && !o.recolectado);
    if (primerOrbe) {
      setLimixPos({ x: primerOrbe.x - 15, y: primerOrbe.y + 10 });
      setDialogCharacter('Señalín');
      setDialogText(`¡Comenzando el Camino ${camino === 'izquierda' ? 'Izquierdo' : 'Derecho'}! Recolecta los orbes para ver los valores de f(x).`);
      setShowDialog(true);
    }
  };

  const collectOrbe = useCallback((orbeIndex: number) => {
    const orbe = orbesEstado[orbeIndex];

    if (gamePhase !== 'recorrido' || orbe.camino !== currentPath || orbe.recolectado) return;

    const newOrbesEstado = [...orbesEstado];
    newOrbesEstado[orbeIndex] = { ...orbe, recolectado: true };
    setOrbesEstado(newOrbesEstado);
    setCurrentOrbeIndex(orbeIndex);
    setLimixPos({ x: orbe.x - 15, y: orbe.y + 10 });

    setDialogCharacter('Señalín');
    setDialogText(`x = ${orbe.valorX.toFixed(3)}, f(x) = ${orbe.valorFx.toFixed(2)}`);
    setShowDialog(true);

    const caminoOrbes = orbesEstado.filter(o => o.camino === currentPath);
    const orbesRecolectados = newOrbesEstado.filter(o => o.camino === currentPath && o.recolectado).length;

    if (orbesRecolectados === caminoOrbes.length) {
      handlePathEnd(orbe.camino, orbe.valorFx);
    }
  }, [gamePhase, currentPath, orbesEstado]);

  const handlePathEnd = (camino: 'izquierda' | 'derecha', valorLimiteLateral: number) => {
    setCurrentPath('ninguno');
    setCurrentOrbeIndex(-1);
    
    const valorL = camino === 'izquierda' ? L_IZQUIERDA : L_DERECHA;

    if (camino === 'izquierda') {
      setLimiteIzquierda({ valor: valorL, alcanzado: true });
      setDialogCharacter('Profe Numix');
      setDialogText(`Camino Izquierdo completado. Cuando x→${A}⁻, f(x)→${valorL}. Ahora, ve por el Camino Derecho.`);
      setShowDialog(true);
      setTimeout(() => {
        setLimixPos({ x: 520, y: 550 });
        setGamePhase('seleccion');
        setShowDialog(false);
      }, 3000);
    } else {
      setLimiteDerecha({ valor: valorL, alcanzado: true });
      setDialogCharacter('Profe Numix');
      setDialogText(`Camino Derecho completado. Cuando x→${A}⁺, f(x)→${valorL}. ¡Es hora de la comparación!`);
      setShowDialog(true);
      setTimeout(() => {
        setLimixPos({ x: 520, y: 550 });
        setGamePhase('comparacion');
      }, 3000);
    }
  };
  
  const handleComparison = async () => {
    setShowDialog(false);
    
    const timeSpent = Math.floor((Date.now() - initialTime) / 1000);
    const limitesCoinciden = limiteIzquierda.valor === limiteDerecha.valor;
    const respuestaCorrecta = !limitesCoinciden;

    if (!respuestaCorrecta) {
        setGamePhase('fail');
        setDialogCharacter('Calcín');
        setDialogText('❌ ¡Los límites coinciden! Pero para f(x)=|x|/x, los límites laterales deberían ser diferentes. ¡Revisa los valores!');
        
        await registerAttempt(
            limitesCoinciden ? 1 : 0,
            L_IZQUIERDA, 
            L_DERECHA, 
            timeSpent, 
            false
        );
        
        setTimeout(() => {
          setOrbesEstado(orbes);
          setLimiteIzquierda({ valor: null, alcanzado: false });
          setLimiteDerecha({ valor: null, alcanzado: false });
          setGamePhase('seleccion');
          setInitialTime(Date.now());
          setLimixPos({ x: 520, y: 550 });
          setDialogCharacter('Profe Numix');
          setDialogText('Revisa la función. **Si el límite lateral izquierdo y el derecho son diferentes, el límite NO existe.** ¡Intenta de nuevo!');
          setShowDialog(true);
        }, 5000);

    } else {
        setGamePhase('success');
        setDialogCharacter('Profe Numix');
        setDialogText(`✔️ ¡Correcto! El camino izquierdo llega a **${limiteIzquierda.valor}** y el derecho a **${limiteDerecha.valor}**. Como son diferentes, el límite cuando x→${A} **NO EXISTE**.`);
        
        const resultado = await registerAttempt(
            limitesCoinciden ? 1 : 0,
            L_IZQUIERDA, 
            L_DERECHA, 
            timeSpent, 
            true
        );
        
        setShowDialog(true);
        
        // CRÍTICO: Navegar después de mostrar el mensaje
        setTimeout(() => {
          console.log('🚀 Navegando a mundos...');
          navigate('/mundos');
        }, 4000); // 4 segundos para leer el mensaje
    }
  };
  
  const registerAttempt = async (respuestaDada: number, limIzquierda: number, limDerecha: number, timeSpent: number, esCorrecto: boolean) => {
    console.log('🎯 Registrando intento:', {
      id_desafio: ID_DESAFIO,
      respuesta_dada: respuestaDada,
      limite_izquierdo: limIzquierda,
      limite_derecho: limDerecha,
      distancia_al_punto: esCorrecto ? 0 : 1,
      tiempo_respuesta: timeSpent,
      es_correcto: esCorrecto
    });
    
    try {
      const response = await fetch(`${API_URL}/api/intentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_desafio: ID_DESAFIO,
          respuesta_dada: respuestaDada,
          limite_izquierdo: limIzquierda,
          limite_derecho: limDerecha,
          distancia_al_punto: esCorrecto ? 0 : 1,
          tiempo_respuesta: timeSpent
        })
      });
      
      const data = await response.json();
      console.log('✅ Respuesta del servidor:', data);
      
      if (data.mundo_completado) {
        console.log('🎉 Mundo completado:', data.id_mundo_completado);
        if (data.siguiente_mundo_desbloqueado) {
          console.log('🔓 Siguiente mundo desbloqueado:', data.siguiente_mundo_desbloqueado);
        }
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error al registrar intento:', error);
      return null;
    }
  };

  const requestHint = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pistas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_desafio: ID_DESAFIO })
      });

      const pista = await response.json();
      setDialogCharacter('Calcín');
      setHintText(pista.texto);
      setShowHint(true);
    } catch (error) {
      console.error('Error al solicitar pista:', error);
    }
  };

  const orbesVisibles = orbesEstado.filter(o => !o.recolectado);
  const calcinPos = { x: 800, y: 20 };
  const profeNumixPos = { x: 400, y: 330 };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="relative w-full aspect-[16/9] max-h-screen overflow-hidden"
        style={{ 
          backgroundImage: "url('/img/fondo2.PNG')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          maxWidth: '1200px'
        }}
      >
        
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-900/80 to-purple-900/80 px-6 py-3 rounded-2xl shadow-2xl border-2 border-cyan-400">
                <InlineMath math={`\\lim_{x\\to${A}} f(x) = ?`} />
            </h2>
            <div className={`mt-3 w-20 h-20 rounded-full mx-auto transition-all duration-500 ${
                gamePhase === 'success' 
                  ? 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_0_40px_rgba(252,211,77,1)] animate-pulse scale-110' 
                  : gamePhase === 'fail'
                  ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_30px_rgba(239,68,68,1)]'
                  : 'bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]'
            } flex items-center justify-center text-4xl`}>
                {gamePhase === 'success' && <span className="animate-bounce">✨</span>}
                {gamePhase === 'fail' && <span className="text-white font-extrabold">❌</span>}
                {gamePhase !== 'success' && gamePhase !== 'fail' && <span className="text-white opacity-50">🎯</span>}
            </div>
        </div>

        <div className="absolute top-1/3 left-4 bg-gradient-to-r from-purple-700/90 to-blue-700/90 text-white p-4 rounded-r-2xl shadow-2xl border-l-4 border-purple-400 max-w-[200px]">
            <p className="font-bold text-sm mb-1">Camino Izquierdo</p>
            <p className="text-xs text-purple-200 mb-2">
                <InlineMath math={`x \\to ${A}^-`} />
            </p>
            <p className="text-3xl font-extrabold">
                {limiteIzquierda.alcanzado ? limiteIzquierda.valor : '?'}
            </p>
            {limiteIzquierda.alcanzado && (
                <div className="mt-2 text-xs text-green-300 flex items-center gap-1">
                    <span>✓</span> <span>Completado</span>
                </div>
            )}
        </div>
        
        <div className="absolute top-1/3 right-4 bg-gradient-to-l from-pink-700/90 to-blue-700/90 text-white p-4 rounded-l-2xl shadow-2xl border-r-4 border-pink-400 text-right max-w-[200px]">
            <p className="font-bold text-sm mb-1">Camino Derecho</p>
            <p className="text-xs text-pink-200 mb-2">
                <InlineMath math={`x \\to ${A}^+`} />
            </p>
            <p className="text-3xl font-extrabold">
                {limiteDerecha.alcanzado ? limiteDerecha.valor : '?'}
            </p>
            {limiteDerecha.alcanzado && (
                <div className="mt-2 text-xs text-green-300 flex items-center gap-1 justify-end">
                    <span>Completado</span> <span>✓</span>
                </div>
            )}
        </div>

        {orbesEstado.map((orbe, index) => (
            <div
                key={orbe.id}
                onClick={() => collectOrbe(index)}
                className={`absolute cursor-pointer transition-all duration-300 ${
                    orbe.recolectado ? 'opacity-0 scale-0' : 'hover:scale-125 hover:z-20'
                } ${orbe.camino === currentPath && !orbe.recolectado ? 'animate-bounce' : ''}`}
                style={{ left: orbe.x, top: orbe.y }}
            >
                <div className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center border-3 ${
                    orbe.camino === 'izquierda' 
                      ? 'bg-gradient-to-br from-purple-300 to-purple-500 border-purple-600 shadow-purple-400/70' 
                      : 'bg-gradient-to-br from-pink-300 to-pink-500 border-pink-600 shadow-pink-400/70'
                } ${!orbe.recolectado && 'animate-pulse'}`}>
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                        {orbe.valorX.toFixed(2)}
                    </span>
                </div>
                
                {currentOrbeIndex === index && (
                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-2xl border-2 border-green-300 animate-bounce z-30">
                        <InlineMath math={`f(x)=${orbe.valorFx.toFixed(2)}`} />
                    </div>
                )}
            </div>
        ))}

        <div
            style={{
                left: limixPos.x,
                top: limixPos.y,
                transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="absolute z-10 drop-shadow-2xl"
        >
            <Limix />
        </div>

        <div className="absolute transition-all duration-300 hover:scale-110" style={{ left: calcinPos.x, top: calcinPos.y }}>
            <Calcin />
        </div>
        <div className="absolute transition-all duration-300 hover:scale-110" style={{ left: profeNumixPos.x, top: profeNumixPos.y }}>
            <ProfeNumix />
        </div>
        
        {gamePhase === 'seleccion' && (
            <>
                {!limiteIzquierda.alcanzado && (
                    <div 
                        className="absolute cursor-pointer transition-transform hover:scale-110 animate-pulse"
                        style={{ left: 260, top: 420, transform: 'scaleX(-1)' }}
                        onClick={() => startPath('izquierda')}
                    >
                        <Senalin direction="left" label="← Izquierda" />
                    </div>
                )}
                {!limiteDerecha.alcanzado && (
                    <div 
                        className="absolute cursor-pointer transition-transform hover:scale-110 animate-pulse"
                        style={{ left: 980, top: 420 }}
                        onClick={() => startPath('derecha')}
                    >
                        <Senalin direction="right" label="Derecha →" />
                    </div>
                )}
            </>
        )}
        
        {showDialog && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-6 max-w-2xl z-30 border-4 border-blue-400 animate-fade-in">
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
                {(gamePhase === 'intro' || gamePhase === 'comparacion' || gamePhase === 'fail') && (
                    <button
                        onClick={closeDialog}
                        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all w-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Continuar →
                    </button>
                )}
            </div>
        )}

        {showHint && (
            <div className="absolute top-20 right-4 bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-yellow-400 rounded-2xl p-5 max-w-xs z-30 shadow-2xl animate-fade-in">
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

        <div className="absolute top-4 left-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 shadow-2xl border-2 border-cyan-400 backdrop-blur-sm">
            <div className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-2">
                <span className="text-lg">👤</span>
                <span>{user?.nombre || 'Estudiante'}</span>
            </div>
            <div className="text-xs text-gray-300 flex items-center gap-2">
                <span className="text-base">🎯</span>
                <span>Intentos: <span className="font-bold text-white">{attempts}</span></span>
            </div>
        </div>
        
        <button
            onClick={requestHint}
            className="absolute top-4 right-4 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 hover:rotate-12 border-2 border-yellow-300"
            title="Solicitar pista"
        >
            <span className="text-2xl">💡</span>
        </button>
        
        <button
            onClick={() => navigate('/mundos')}
            className="absolute bottom-4 left-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl shadow-2xl transition-all font-semibold transform hover:scale-105 border-2 border-red-400"
        >
            ← Salir
        </button>
      </div>
    </div>
  );
}
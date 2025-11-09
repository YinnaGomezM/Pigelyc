import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Limix from '../components/Limix';
import ProfeNumix from '../components/ProfeNumix';
import Calcin from '../components/Calcin';

interface Piedra {
  id: number;
  x: number;
  y: number;
  valorX: number;
  valorFx: number;
}

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Game1() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [limixPos, setLimixPos] = useState({ x: 50, y: 350 });
  const [currentStone, setCurrentStone] = useState(0);
  const [showDialog, setShowDialog] = useState(true);
  const [dialogText, setDialogText] = useState('');
  const [dialogCharacter, setDialogCharacter] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gamePhase, setGamePhase] = useState<'intro' | 'playing' | 'success' | 'formal'>('intro');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const puntoObjetivo = 2;
  const tolerancia = 0.1;
  
  const piedras: Piedra[] = [
    { id: 1, x: 100, y: 400, valorX: 1.0, valorFx: 1.0 },
    { id: 2, x: 200, y: 380, valorX: 1.5, valorFx: 2.25 },
    { id: 3, x: 300, y: 360, valorX: 1.8, valorFx: 3.24 },
    { id: 4, x: 400, y: 340, valorX: 1.9, valorFx: 3.61 },
    { id: 5, x: 500, y: 320, valorX: 2.0, valorFx: 4.0 },
    { id: 6, x: 600, y: 340, valorX: 2.1, valorFx: 4.41 },
    { id: 7, x: 700, y: 360, valorX: 2.2, valorFx: 4.84 },
    { id: 8, x: 800, y: 380, valorX: 2.5, valorFx: 6.25 },
  ];

  useEffect(() => {
    if (gamePhase === 'intro') {
      showIntroDialog();
    }
  }, [gamePhase]);

  const showIntroDialog = () => {
    setDialogCharacter('Profe Numix');
    setDialogText('¡Bienvenido al Valle del Límite, Límix! Tu misión es cruzar el río saltando sobre las piedras y descubrir el valor del límite cuando x se aproxima a 2.');
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    if (gamePhase === 'intro') {
      setGamePhase('playing');
      setStartTime(Date.now());
    }
  };

  const moveLimix = (stoneIndex: number) => {
    if (gamePhase !== 'playing') return;

    const stone = piedras[stoneIndex];
    setLimixPos({ x: stone.x, y: stone.y - 80 });
    setCurrentStone(stoneIndex);
    setAttempts(prev => prev + 1);

    setDialogCharacter('Sistema');
    setDialogText(`Estás en x = ${stone.valorX.toFixed(2)}, el valor de f(x) = ${stone.valorFx.toFixed(2)}`);
    setShowDialog(true);

    setTimeout(() => setShowDialog(false), 2000);

    if (Math.abs(stone.valorX - puntoObjetivo) <= tolerancia) {
      handleSuccess(stone.valorFx);
    } else if (attempts >= 5 && !showHint) {
      requestHint();
    }
  };

  const handleSuccess = async (respuesta: number) => {
    setGamePhase('success');
    setDialogCharacter('Calcín');
    setDialogText('¡Excelente! Has descubierto que cuando x se aproxima a 2, f(x) se aproxima a 4. ¡Has comprendido el límite!');
    setShowDialog(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await fetch(`${API_URL}/api/intentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_desafio: 1,
          respuesta_dada: respuesta,
          distancia_al_punto: Math.abs(respuesta - 4.0),
          tiempo_respuesta: timeSpent
        })
      });
    } catch (error) {
      console.error('Error al registrar intento:', error);
    }

    setTimeout(() => {
      setGamePhase('formal');
      showFormalDefinition();
    }, 3000);
  };

  const showFormalDefinition = () => {
    setDialogCharacter('Calcín');
    setDialogText('Ahora veamos la definición formal: lim(x→2) x² = 4. Esto significa que cuando x se acerca a 2, el valor de x² se acerca a 4.');
    setShowDialog(true);
  };

  const requestHint = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pistas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_desafio: 1 })
      });

      const pista = await response.json();
      setDialogCharacter(pista.personaje);
      setHintText(pista.texto);
      setShowHint(true);
    } catch (error) {
      console.error('Error al solicitar pista:', error);
    }
  };

  const handleQuizAnswer = async (answer: number) => {
    setSelectedAnswer(answer);
    const correct = Math.abs(answer - 4.0) <= 0.1;
    setIsCorrect(correct);
    setFeedbackMessage(correct 
      ? '¡Correcto! El límite de x² cuando x→2 es 4' 
      : 'Intenta nuevamente. Observa los valores de f(x) cerca de x=2'
    );
    setShowFeedback(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await fetch(`${API_URL}/api/intentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_desafio: 1,
          respuesta_dada: answer,
          distancia_al_punto: Math.abs(answer - 4.0),
          tiempo_respuesta: timeSpent
        })
      });

      if (correct) {
      setTimeout(() => {
        navigate('/mundos');
      }, 3000);
    } else {
      //Permitir reintentar después de 1 segundos
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
      }, 1000);
    }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-800">
      <div className="relative w-full aspect-[4/3] p-4 overflow-hidden bg-sky-200 rounded-2xl max-w-4xl">
        <div
          style={{ backgroundImage: "url('img/fondo1.jpg')" }}
          className="absolute inset-0 bg-cover bg-center"
        >
          {piedras.map((piedra, index) => (
            <div
              key={piedra.id}
              onClick={() => moveLimix(index)}
              className="absolute cursor-pointer hover:scale-110 transition-transform"
              style={{ left: piedra.x, top: piedra.y }}
            >
              <div className="w-16 h-16 bg-gray-600 rounded-full shadow-lg flex items-center justify-center border-4 border-gray-700">
                <span className="text-white text-xs font-bold">
                  {piedra.valorX.toFixed(1)}
                </span>
              </div>
              {currentStone === index && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  f(x)={piedra.valorFx.toFixed(2)}
                </div>
              )}
            </div>
          ))}

          <div
            style={{
              left: limixPos.x,
              top: limixPos.y,
              transition: 'all 0.5s ease-in-out'
            }}
            className="absolute"
          >
            <Limix />
          </div>

          {/* Personajes guía */}  
          <div className="absolute bottom-100 left-30">
            <ProfeNumix />
          </div>
          <div className="absolute bottom-110 right-12">
            <Calcin />
          </div>

          {showDialog && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md z-10">
              <h3 className="font-bold text-lg mb-2 text-blue-600">{dialogCharacter}</h3>
              <p className="text-gray-700 mb-4">{dialogText}</p>
              <button
                onClick={closeDialog}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full"
              >
                Continuar
              </button>
            </div>
          )}

          {showHint && (
            <div className="absolute top-4 right-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 max-w-xs z-20">
              <div className="flex items-start">
                <span className="text-2xl mr-2">💡</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">{dialogCharacter}</p>
                  <p className="text-sm text-yellow-900">{hintText}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHint(false)}
                className="mt-2 text-xs text-yellow-700 hover:underline"
              >
                Cerrar
              </button>
            </div>
          )}

          {gamePhase === 'formal' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="bg-white rounded-xl p-8 max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">¿Cuál es el límite?</h2>
                <p className="text-center mb-6 text-lg">
                  lim(x→2) x² = ?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[2, 3, 4, 5].map(answer => (
                    <button
                      key={answer}
                      onClick={() => handleQuizAnswer(answer)}
                      disabled={showFeedback}
                      className={`p-4 rounded-lg font-bold text-xl transition ${
                        selectedAnswer === answer
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-blue-100 hover:bg-blue-200'
                      } disabled:cursor-not-allowed`}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
                {showFeedback && (
                  <div className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                    isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {feedbackMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
            <div className="text-sm font-semibold text-gray-700">
              👤 {user?.nombre}
            </div>
            <div className="text-xs text-gray-600">
              🎯 Intentos: {attempts}
            </div>
          </div>

          <button
            onClick={requestHint}
            className="absolute top-20 right-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition"
            title="Solicitar pista"
          >
            💡
          </button>

          <button
            onClick={() => navigate('/mundos')}
            className="absolute bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
          >
            ← Salir
          </button>
        </div>
      </div>
    </div>
  );
}
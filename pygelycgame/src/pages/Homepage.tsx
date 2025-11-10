import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Homepage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/mundos');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-auto">
      
      <div className="container mx-auto px-4 py-8">
        {/* Layout con proporción 35-65 para dar más espacio al contenedor principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 items-stretch">
          
          {/* SECCIÓN: Práctica Libre - MÁS COMPACTA */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-5 border-2 border-white/20 shadow-2xl h-full flex flex-col">
              
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="text-3xl">🎓</span>
                  <h2 className="text-xl lg:text-2xl font-bold text-white">Práctica Libre</h2>
                </div>
                <p className="text-white/80 text-xs lg:text-sm">
                  Refuerza conceptos básicos antes de iniciar tu aventura
                </p>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 mb-4">
                {/* Card Factorización - CONTENIDO CENTRADO */}
                <Link to="/practica/factorizacion" className="flex-1">
                  <div className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all transform hover:scale-105 border-2 border-white/30 cursor-pointer group h-full flex items-center justify-center">
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-3xl lg:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">📐</div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base lg:text-lg mb-1">Factorización</h3>
                        <p className="text-white/80 text-xs mb-2">
                          Aprende a factorizar expresiones algebraicas paso a paso
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-green-500/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            ✓ Sin registro
                          </span>
                          <span className="text-white/60 text-xs">
                            • 3 niveles
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Card Racionalización - CONTENIDO CENTRADO */}
                <Link to="/practica/racionalizacion" className="flex-1">
                  <div className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all transform hover:scale-105 border-2 border-white/30 cursor-pointer group h-full flex items-center justify-center">
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-3xl lg:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">√</div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base lg:text-lg mb-1">Racionalización</h3>
                        <p className="text-white/80 text-xs mb-2">
                          Domina las raíces y fracciones con ejercicios interactivos
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-green-500/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            ✓ Sin registro
                          </span>
                          <span className="text-white/60 text-xs">
                            • 3 niveles
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {!isAuthenticated && (
                <div className="text-center mt-auto pt-2 border-t border-white/10">
                  <p className="text-white/90 text-xs mb-1">
                    💾 <strong>Inicia sesión</strong> para guardar tu progreso
                  </p>
                  <Link 
                    to="/login"
                    className="inline-block text-blue-300 hover:text-blue-200 underline text-xs"
                  >
                    Crear cuenta o iniciar sesión →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN: Contenedor principal con imagen - MÁS ESPACIO */}
          <div className="flex flex-col">
            <div className="relative w-full aspect-[13/11] overflow-hidden bg-sky-200 rounded-2xl shadow-2xl">
              <div
                style={{ backgroundImage: "url('img/home.PNG')" }}
                className="absolute inset-0 bg-cover bg-center"
              >
                <div className="absolute inset-0 bg-black/20" />

                {/* Badges de Límites y Continuidad */}
                <div className="absolute top-[60%] left-[8%] bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-lg shadow-xl border-2 border-green-400">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Límites</h2>
                </div>
                
                <div className="absolute top-[60%] right-[4%] bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-lg shadow-xl border-2 border-blue-400">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Continuidad</h2>
                </div>

                <div className="relative h-full flex flex-col items-center justify-end pb-6 text-center px-6">

                  <button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-xl lg:text-2xl px-10 lg:px-12 py-3 lg:py-4 rounded-full shadow-2xl transform transition duration-300 hover:scale-110 active:scale-95 mb-6"
                  >
                    {isAuthenticated ? 'Continuar Aventura' : 'Iniciar Sesión'}
                  </button>

                  <div className="grid grid-cols-3 gap-4 lg:gap-6 text-white w-full max-w-2xl mx-auto">
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 lg:p-4 hover:bg-white/30 transition-all">
                      <div className="text-3xl lg:text-4xl mb-2">🎮</div>
                      <div className="font-semibold text-sm lg:text-base">Juega y Aprende</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 lg:p-4 hover:bg-white/30 transition-all">
                      <div className="text-3xl lg:text-4xl mb-2">📊</div>
                      <div className="font-semibold text-sm lg:text-base">Rastrea tu Progreso</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 lg:p-4 hover:bg-white/30 transition-all">
                      <div className="text-3xl lg:text-4xl mb-2">🏆</div>
                      <div className="font-semibold text-sm lg:text-base">Gana Recompensas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
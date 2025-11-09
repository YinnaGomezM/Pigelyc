import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface Mundo {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  estado: 'activo' | 'bloqueado';
  progreso: {
    estado: 'no_iniciado' | 'en_progreso' | 'completado';
    porcentaje: number;
  };
}

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function Mundos() {
  const [mundos, setMundos] = useState<Mundo[]>([]);
  const [loading, setLoading] = useState(true);
  const [insignias, setInsignias] = useState<any[]>([]);
  const [puntos, setPuntos] = useState(0);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Recargar datos
    fetchMundos();
    fetchGamificacion();

    // Agregar listener para cuando la ventana gana foco
    const handleFocus = () => {
      fetchMundos();
      fetchGamificacion();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [location]); // Se recarga cada vez que cambia la ruta

  const fetchMundos = async () => {
    try {
      console.log('📡 Cargando mundos...');
      const response = await fetch(`${API_URL}/mundos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar mundos');

      const data = await response.json();
      console.log('✅ Mundos cargados:', data);
      setMundos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamificacion = async () => {
    try {
      const response = await fetch(`${API_URL}/gamificacion`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInsignias(data.insignias || []);
        setPuntos(data.puntos || 0);
      }
    } catch (error) {
      console.error('Error al obtener gamificación:', error);
    }
  };

  const handleMundoClick = async (mundo: Mundo) => {
    // CRÍTICO: No permitir acceso a mundos bloqueados
    if (mundo.estado === 'bloqueado') {
      alert('¡Debes completar el mundo anterior para desbloquear este!');
      return; // SALIR INMEDIATAMENTE - No crear registro
    }

    // Si el mundo no está iniciado Y está desbloqueado, iniciarlo
    if (mundo.progreso.estado === 'no_iniciado') {
      try {
        console.log('🎮 Iniciando mundo:', mundo.id);
        await fetch(`${API_URL}/progreso/iniciar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id_mundo: mundo.id })
        });
      } catch (error) {
        console.error('Error al iniciar mundo:', error);
        return; // Si hay error, no navegar
      }
    }

    // Navegar al mundo correspondiente
    console.log('🚀 Navegando a game' + mundo.orden);
    navigate(`/game${mundo.orden}`);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-500';
      case 'en_progreso': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-800">
        <div className="text-white text-2xl">Cargando mundos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-800 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              ¡Bienvenido, {user?.nombre}!
            </h1>
            <p className="text-gray-300">Selecciona un mundo para comenzar tu aventura</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Grid de Mundos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mundos.map((mundo) => (
            <div
              key={mundo.id}
              onClick={() => handleMundoClick(mundo)}
              className={`
                bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300
                ${mundo.estado === 'bloqueado'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 hover:shadow-2xl cursor-pointer'}
              `}
            >
              {/* Imagen del mundo */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                <div className="text-6xl">
                  {mundo.orden === 1 && '🏔️'}
                  {mundo.orden === 2 && '🌲'}
                  {mundo.orden === 3 && '⛰️'}
                  {mundo.orden === 4 && '🏜️'}
                  {mundo.orden === 5 && '🌊'}
                  {mundo.orden === 6 && '🕳️'}
                  {mundo.orden === 7 && '🏰'}
                  {mundo.orden === 8 && '🏛️'}
                </div>

                {/* Badge de estado */}
                {mundo.estado === 'bloqueado' && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    🔒 Bloqueado
                  </div>
                )}

                {mundo.progreso.estado === 'completado' && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Completado
                  </div>
                )}
              </div>

              {/* Información del mundo */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {mundo.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {mundo.descripcion}
                </p>

                {/* Barra de progreso */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{Math.round(mundo.progreso.porcentaje)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getEstadoColor(mundo.progreso.estado)}`}
                      style={{ width: `${mundo.progreso.porcentaje}%` }}
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="text-center">
                  {mundo.estado === 'activo' && mundo.progreso.estado === 'no_iniciado' && (
                    <span className="text-blue-600 font-semibold text-sm">¡Comienza ahora!</span>
                  )}
                  {mundo.progreso.estado === 'en_progreso' && (
                    <span className="text-yellow-600 font-semibold text-sm">Continuar...</span>
                  )}
                  {mundo.progreso.estado === 'completado' && (
                    <span className="text-green-600 font-semibold text-sm">¡Mundo completado! 🎉</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info adicional */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">📚 Tu progreso general</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">
                {mundos.filter(m => m.progreso.estado === 'completado').length}/8
              </div>
              <div className="text-sm">Mundos completados</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">
                {mundos.filter(m => m.progreso.estado === 'en_progreso').length}
              </div>
              <div className="text-sm">Mundos en progreso</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-3xl font-bold">
                {Math.round(mundos.reduce((acc, m) => acc + m.progreso.porcentaje, 0) / mundos.length)}%
              </div>
              <div className="text-sm">Progreso total</div>
            </div>
          </div>
        </div>

        {/* Sección de Insignias y Puntos */}
        {insignias.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">🏆 Tus Logros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
                <div className="text-4xl font-bold mb-2">⭐ {puntos}</div>
                <div className="text-sm">Puntos totales</div>
              </div>
              <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
                <div className="text-4xl font-bold mb-2">🏅 {insignias.length}</div>
                <div className="text-sm">Insignias obtenidas</div>
              </div>
            </div>

            {/* Lista de insignias */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {insignias.map((insignia, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">🏅</span>
                    <div>
                      <div className="font-bold">{insignia.nombre}</div>
                      <div className="text-xs opacity-90">{insignia.descripcion}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
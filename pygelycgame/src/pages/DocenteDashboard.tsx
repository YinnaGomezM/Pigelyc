import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Estudiante {
  id: number;
  nombre: string;
  email: string;
  mundos_iniciados: number;
  promedio_completado: number;
  tiempo_total: number;
}

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function DocenteDashboard() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstudiante, setSelectedEstudiante] = useState<number | null>(null);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.tipo !== 'docente') {
      navigate('/mundos');
      return;
    }
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    try {
      const response = await fetch(`${API_URL}/estadisticas/estudiantes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstudiantes(data);
      }
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${horas}h ${minutos}m`;
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-800">
        <div className="text-white text-2xl">Cargando...</div>
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
              Panel del Docente 👨‍🏫
            </h1>
            <p className="text-gray-300">Bienvenido, {user?.nombre}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="flex space-x-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold">
              📊 Estadísticas
            </button>
            <button 
              onClick={() => navigate('/docente/gamificacion')}
              className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
            >
              🎮 Gamificación
            </button>
            <button 
              onClick={() => navigate('/docente/ejercicios')}
              className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
            >
              📝 Ejercicios
            </button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2">{estudiantes.length}</div>
            <div className="text-sm opacity-90">Estudiantes registrados</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {Math.round(estudiantes.reduce((acc, e) => acc + (e.promedio_completado || 0), 0) / (estudiantes.length || 1))}%
            </div>
            <div className="text-sm opacity-90">Promedio de avance</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {estudiantes.filter(e => e.promedio_completado >= 50).length}
            </div>
            <div className="text-sm opacity-90">Con más del 50%</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {estudiantes.filter(e => e.mundos_iniciados > 0).length}
            </div>
            <div className="text-sm opacity-90">Estudiantes activos</div>
          </div>
        </div>

        {/* Tabla de estudiantes */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white">Lista de Estudiantes</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Mundos Iniciados
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Progreso Promedio
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Tiempo Total
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estudiantes.map((estudiante) => (
                  <tr 
                    key={estudiante.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {estudiante.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {estudiante.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {estudiante.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {estudiante.mundos_iniciados || 0} / 8
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${estudiante.promedio_completado || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(estudiante.promedio_completado || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {formatTiempo(estudiante.tiempo_total || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/docente/estudiante/${estudiante.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {estudiantes.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay estudiantes registrados
              </h3>
              <p className="text-gray-500">
                Los estudiantes aparecerán aquí cuando se registren en la plataforma.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
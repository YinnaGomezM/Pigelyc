import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

//const API_URL = 'http://localhost:3001/api';
//const API_URL = 'http://172.27.20.185:3001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DocenteGamificacion() {
  const [puntosPorMundo, setPuntosPorMundo] = useState(100);
  const [puntosBonus, setPuntosBonus] = useState(50);
  const [mensaje, setMensaje] = useState('');
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.tipo !== 'docente') {
      navigate('/mundos');
    }
  }, []);

  const handleGuardar = () => {
    setMensaje('✅ Configuración guardada exitosamente');
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-800 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/docente')}
              className="text-white hover:text-gray-300 mb-4 flex items-center"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              Configuración de Gamificación 🎮
            </h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {mensaje && (
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg mb-6 animate-pulse">
            {mensaje}
          </div>
        )}

        {/* Configuración de Puntos */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">⭐ Configuración de Puntos</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Puntos por Mundo Completado
              </label>
              <input
                type="number"
                value={puntosPorMundo}
                onChange={(e) => setPuntosPorMundo(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Puntos que recibe el estudiante al completar un mundo
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Puntos Bonus por Tiempo
              </label>
              <input
                type="number"
                value={puntosBonus}
                onChange={(e) => setPuntosBonus(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Puntos extra por completar rápidamente (menos de 5 minutos)
              </p>
            </div>
          </div>
        </div>

        {/* Configuración de Insignias */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🏅 Insignias Disponibles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { nombre: 'Explorador del Valle', descripcion: 'Completa el Mundo 1', emoji: '🏔️' },
              { nombre: 'Maestro Lateral', descripcion: 'Completa el Mundo 2', emoji: '🌲' },
              { nombre: 'Rey de Propiedades', descripcion: 'Completa el Mundo 3', emoji: '⛰️' },
              { nombre: 'Sabio Trigonométrico', descripcion: 'Completa el Mundo 4', emoji: '🏜️' },
              { nombre: 'Domador de Asíntotas', descripcion: 'Completa el Mundo 5', emoji: '🌊' },
              { nombre: 'Experto de L\'Hôpital', descripcion: 'Completa el Mundo 6', emoji: '🕳️' },
              { nombre: 'Guardián de Continuidad', descripcion: 'Completa el Mundo 7', emoji: '🏰' },
              { nombre: 'Campeón del TVI', descripcion: 'Completa el Mundo 8', emoji: '🏛️' },
            ].map((insignia, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{insignia.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{insignia.nombre}</h3>
                    <p className="text-sm text-gray-600">{insignia.descripcion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleGuardar}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
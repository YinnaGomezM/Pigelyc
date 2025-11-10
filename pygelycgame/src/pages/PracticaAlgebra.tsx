import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PracticaAlgebra() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6 text-white/80 hover:text-white">
            ← Volver al inicio
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">
            🎓 Práctica Libre de Álgebra
          </h1>
          <p className="text-xl text-white/80">
            Refuerza tus conocimientos básicos para dominar límites y continuidad
          </p>
        </div>

        {/* Cards de práctica */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Factorización */}
          <Link to="/practica/factorizacion">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 hover:border-white/40 transition-all transform hover:scale-105 cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📐</div>
              <h2 className="text-3xl font-bold text-white mb-3">Factorización</h2>
              <p className="text-white/80 mb-4">
                Domina las técnicas de factorización algebraica necesarias para resolver límites indeterminados
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Factor común
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Diferencia de cuadrados
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Trinomios
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Agrupación
                </div>
              </div>

              <div className="flex gap-2">
                <span className="bg-blue-500/80 text-white text-sm px-3 py-1 rounded-full">
                  3 niveles
                </span>
                <span className="bg-green-500/80 text-white text-sm px-3 py-1 rounded-full">
                  Sin registro
                </span>
              </div>
            </div>
          </Link>

          {/* Racionalización */}
          <Link to="/practica/racionalizacion">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 hover:border-white/40 transition-all transform hover:scale-105 cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">√</div>
              <h2 className="text-3xl font-bold text-white mb-3">Racionalización</h2>
              <p className="text-white/80 mb-4">
                Aprende a eliminar radicales del denominador, técnica esencial para simplificar límites
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Raíces simples
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Conjugados
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Raíces cúbicas
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-green-400">✓</span> Casos complejos
                </div>
              </div>

              <div className="flex gap-2">
                <span className="bg-blue-500/80 text-white text-sm px-3 py-1 rounded-full">
                  3 niveles
                </span>
                <span className="bg-green-500/80 text-white text-sm px-3 py-1 rounded-full">
                  Sin registro
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Beneficios de registrarse */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-yellow-500/30">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                💾 ¿Quieres guardar tu progreso?
              </h3>
              <p className="text-white/80 mb-4">
                Crea una cuenta gratuita y obtén:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-white">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-semibold">Estadísticas detalladas</div>
                </div>
                <div className="text-white">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-semibold">Logros y puntos</div>
                </div>
                <div className="text-white">
                  <div className="text-3xl mb-2">🎮</div>
                  <div className="font-semibold">Acceso a mundos</div>
                </div>
              </div>
              <Link 
                to="/login"
                className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg px-8 py-3 rounded-full transform transition hover:scale-105"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
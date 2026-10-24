import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Shield, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();


  if (location.pathname.startsWith('/i/') || location.pathname.startsWith('/asistencia/')) {
    return null;
  }
   const isAdminPath = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('admin_authenticated');
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-elegant text-xl font-bold tracking-tight text-stone-900 block leading-tight">
                Votos & Momentos
              </span>
              <span className="text-[10px] tracking-wider uppercase text-amber-700 font-semibold block">
                Invitaciones Digitales
              </span>
            </div>
          </Link>

          {isAdminPath ? (
            <nav className="flex items-center gap-1 sm:gap-4">
              <Link
                to="/admin/eventos"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/eventos')
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Eventos</span>
              </Link>

              <Link
                to="/admin/clientes"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/clientes')
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Clientes</span>
              </Link>

              <Link
                to="/admin/mantenimiento"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin/mantenimiento')
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Caducidad & Logs</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Acceso Admin
              </Link>
            </div>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Demostración Activo:</strong> Base de datos simulada en memoria. Para conectar Supabase en vivo, define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
          </span>
        </div>
      )}
    </header>
  );
}

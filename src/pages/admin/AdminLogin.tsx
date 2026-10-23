import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, isConfigured } from '../../lib/supabase';

export function AdminLogin() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      if (isConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: correo,
          password: password,
        });

        if (authError) {
          throw authError;
        }

        // Verificar que el usuario tenga perfil admin
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('rol, activo')
          .eq('id', data.user.id)
          .single();

        if (perfilError || !perfil || perfil.rol !== 'admin' || !perfil.activo) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta no tiene privilegios de administrador autorizados.');
        }

        localStorage.setItem('admin_authenticated', 'true');
        navigate('/admin/eventos');
      } else {
        // En modo demostración / local si Supabase no está enlazado a producción
        if (correo && password.length >= 6) {
          localStorage.setItem('admin_authenticated', 'true');
          navigate('/admin/eventos');
        } else {
          throw new Error('Ingrese un correo válido y una contraseña de al menos 6 caracteres para acceder al entorno de demostración.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
            Panel de Administración
          </h1>
          <p className="text-stone-500 text-xs mt-1">
            Acceso exclusivo y seguro para la gestión de invitaciones
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isConfigured && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              Entorno Demostración Local
            </p>
            <p className="text-[11px] mt-0.5 text-stone-600">
              Puedes ingresar con cualquier correo y clave (mínimo 6 caracteres).
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {cargando ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400 leading-tight">
            Por directiva de seguridad, el registro de nuevas cuentas de administrador está restringido y no se admiten altas públicas abiertas.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Clock, 
  Smartphone, 
  ExternalLink, 
  Lock
} from 'lucide-react';

export function Landing() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-white py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Plataforma de Invitaciones Digitales
          </div>

          <h1 className="font-serif-elegant text-4xl sm:text-6xl font-light tracking-tight text-stone-50 leading-tight">
            Experiencias Memorables, Enlaces Individuales & Gestión RSVP
          </h1>

          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Crea eventos inolvidables, envía enlaces personalizados a cada invitado por WhatsApp, recibe confirmaciones en tiempo real y brinda a los anfitriones un panel privado y seguro.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link
              to="/admin/login"
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-900/30 transition-all"
            >
              Acceso al Panel Administrador
            </Link>

            <a
              href="/i/demoinvitado123456"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-100 font-semibold text-sm backdrop-blur transition-all border border-white/20"
            >
              <span>Ver Invitación de Ejemplo</span>
              <ExternalLink className="w-4 h-4 text-amber-300" />
            </a>

            <a
              href="/asistencia/demoorganizador123"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 font-semibold text-sm backdrop-blur transition-all border border-purple-500/30"
            >
              <span>Ver Panel Organizador Demo</span>
              <ExternalLink className="w-4 h-4 text-purple-300" />
            </a>
          </div>
        </div>
      </section>

      {/* Características Clave */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif-elegant text-3xl font-bold text-stone-900">
            Diseñada con los más altos estándares de privacidad y elegancia
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Cada módulo cumple con estrictas reglas de retención de datos y seguridad criptográfica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-serif-elegant text-xl font-bold text-stone-900">
              Invitación Individual & WhatsApp
            </h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Cada invitado recibe su enlace individual con su nombre exacto y número autorizado de acompañantes. Integración con WhatsApp sin servicios de pago adicionales.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif-elegant text-xl font-bold text-stone-900">
              Panel Privado del Organizador
            </h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Enlace de solo lectura para los anfitriones con estadísticas en vivo, lista de confirmados y exportación CSV, con revocación automática a los 30 días posteriores al evento.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-serif-elegant text-xl font-bold text-stone-900">
              Ciclo de Vida y Caducidad
            </h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Cálculo estricto de las 3 fechas: caducidad de invitaciones (+7d), expiración del panel (+30d) y eliminación segura de datos personales (+90d) con soporte para retención excepcional.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

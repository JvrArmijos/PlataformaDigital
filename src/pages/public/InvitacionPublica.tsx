import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Sparkles, 
  Heart, 
  AlertCircle,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calcularSha256 } from '../../lib/crypto';
import { formatearFechaHora } from '../../lib/dates';
import { obtenerInvitacionPorHash, registrarRsvpPorHash } from '../../lib/supabase';
import type { InvitacionPublicaData } from '../../types/database';
import { Countdown } from '../../components/Countdown';

export function InvitacionPublica() {
  const { token } = useParams<{ token: string }>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<InvitacionPublicaData | null>(null);
  const [tokenHash, setTokenHash] = useState<string>('');

  // Formulario RSVP
  const [seleccionRsvp, setSeleccionRsvp] = useState<'confirmado' | 'rechazado'>('confirmado');
  const [acompanantes, setAcompanantes] = useState<number>(0);
  const [enviandoRsvp, setEnviandoRsvp] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      if (!token) {
        setError('Enlace de invitación no proporcionado.');
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        // Calcular SHA-256 en el cliente para nunca enviar el token en texto plano a búsquedas vulnerables
        const hash = await calcularSha256(token);
        setTokenHash(hash);

        const res = await obtenerInvitacionPorHash(hash);
        setDatos(res);
        if (!res.valido && !res.caducado) {
          setError(res.error || 'Invitación no válida.');
        } else if (res.invitado) {
          setSeleccionRsvp(res.invitado.estado_rsvp === 'rechazado' ? 'rechazado' : 'confirmado');
          setAcompanantes(res.invitado.numero_acompanantes || 0);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al procesar la invitación');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [token]);

  const handleEnviarRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenHash) return;

    try {
      setEnviandoRsvp(true);
      const res = await registrarRsvpPorHash(
        tokenHash, 
        seleccionRsvp, 
        seleccionRsvp === 'confirmado' ? acompanantes : 0
      );

      if (res && res.success) {
        setMensajeExito('¡Tu respuesta ha sido registrada exitosamente!');
        if (seleccionRsvp === 'confirmado') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
        // Actualizar datos locales
        if (datos?.invitado) {
          setDatos({
            ...datos,
            invitado: {
              ...datos.invitado,
              estado_rsvp: seleccionRsvp,
              numero_acompanantes: seleccionRsvp === 'confirmado' ? acompanantes : 0,
              respondido_at: new Date().toISOString()
            }
          });
        }
      } else {
        alert(res?.error || 'No se pudo guardar la respuesta.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al enviar respuesta');
    } finally {
      setEnviandoRsvp(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif-elegant text-stone-600 text-lg">Cargando tu invitación personal...</p>
        </div>
      </div>
    );
  }

  // REGLA OBLIGATORIA DE CADUCIDAD (+7 DÍAS TRAS EL EVENTO)
  if (datos?.caducado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-200">
          <div className="w-16 h-16 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="font-serif-elegant text-2xl font-bold text-stone-800 mb-2">
            Este evento ha finalizado
          </h1>
          <p className="text-stone-500 text-sm">
            La invitación ya no se encuentra disponible debido a que el plazo de acceso ha concluido.
          </p>
        </div>
      </div>
    );
  }

  if (error || !datos?.valido || !datos?.evento || !datos?.invitado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-900 mb-2">Invitación no encontrada</h1>
          <p className="text-stone-600 text-sm mb-6">
            {error || 'El enlace utilizado es inválido o no existe en nuestros registros.'}
          </p>
        </div>
      </div>
    );
  }

  const { evento, invitado } = datos;
  const diseno = evento.configuracion_diseno || {};
  const colorPrimario = diseno.color_primario || '#9f1239';

  return (
    <div className="min-h-screen bg-stone-100/60 pb-16">
      {/* Portada Superior Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-white text-center pt-20 pb-24 px-4 sm:px-6 shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-2xl mx-auto space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs tracking-widest uppercase text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Invitación de Honor
          </div>

          <h1 className="font-serif-elegant text-4xl sm:text-6xl font-light tracking-wide text-stone-50 leading-tight">
            {evento.titulo}
          </h1>

          <div className="pt-4 pb-2">
            <p className="text-stone-300 text-xs tracking-widest uppercase mb-1">
              Reservado especialmente para:
            </p>
            <p className="font-script text-3xl sm:text-4xl text-amber-300 font-normal">
              {invitado.nombre}
            </p>
          </div>

          {invitado.max_acompanantes_permitidos > 0 && (
            <p className="text-xs text-stone-300">
              Válido para ti y hasta {invitado.max_acompanantes_permitidos} acompañante(s)
            </p>
          )}
        </div>
      </div>

      {/* Contenido Principal Tarjeta Central */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {/* Contador */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 border border-stone-200/80">
          <p className="text-center text-xs uppercase tracking-widest text-stone-400 font-semibold mb-2">
            Faltan para este momento
          </p>
          <Countdown fechaIso={evento.fecha_evento} colorPrimario={colorPrimario} />

          {/* Datos Básicos de Fecha y Lugar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-stone-100">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500">Fecha y Hora</h3>
                <p className="text-sm font-semibold text-stone-900 capitalize mt-0.5">
                  {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500">Lugar</h3>
                <p className="text-sm font-semibold text-stone-900 mt-0.5">
                  {evento.ubicacion_nombre}
                </p>
                {evento.ubicacion_url && (
                  <a
                    href={evento.ubicacion_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium mt-1 underline"
                  >
                    Ver en mapa <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicaciones Especiales y Código de Vestimenta */}
        {(evento.indicaciones || diseno.codigo_vestimenta) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
            <h2 className="font-serif-elegant text-2xl font-semibold text-stone-900 mb-3 text-center">
              Detalles Importantes
            </h2>
            {diseno.codigo_vestimenta && (
              <div className="text-center mb-4">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block">
                  Código de Vestimenta
                </span>
                <span className="text-stone-800 font-medium text-sm">
                  {diseno.codigo_vestimenta}
                </span>
              </div>
            )}
            {evento.indicaciones && (
              <p className="text-stone-600 text-sm text-center leading-relaxed whitespace-pre-line">
                {evento.indicaciones}
              </p>
            )}
          </div>
        )}

        {/* Cuenta Bancaria de Regalos (si aplica) */}
        {diseno.cuenta_bancaria_regalo?.numero && (
          <div className="bg-amber-50/60 rounded-3xl p-6 text-center border border-amber-200/60">
            <Heart className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <h3 className="font-serif-elegant text-lg font-semibold text-amber-950">
              Lluvia de Sobres / Regalos
            </h3>
            <p className="text-xs text-stone-600 mt-1 mb-3">
              Su presencia es nuestro mayor regalo. Si desea tener un detalle:
            </p>
            <div className="inline-block bg-white px-4 py-2 rounded-xl text-xs text-stone-700 border border-amber-200/80 shadow-xs">
              <p><strong>{diseno.cuenta_bancaria_regalo.banco}</strong> ({diseno.cuenta_bancaria_regalo.tipo})</p>
              <p>N°: <code className="font-mono font-semibold">{diseno.cuenta_bancaria_regalo.numero}</code></p>
              <p>A nombre de: {diseno.cuenta_bancaria_regalo.titular}</p>
            </div>
          </div>
        )}

        {/* Sección de Confirmación de Asistencia (RSVP) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/60 border border-stone-200" id="rsvp">
          <div className="text-center mb-6">
            <h2 className="font-serif-elegant text-3xl font-bold text-stone-900">
              Confirmación de Asistencia
            </h2>
            <p className="text-xs uppercase tracking-wider text-stone-400 font-medium mt-1">
              Fecha límite: {formatearFechaHora(evento.fecha_limite_rsvp, evento.zona_horaria)}
            </p>
          </div>

          {mensajeExito && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {datos.rsvp_cerrado ? (
            <div className="p-6 rounded-2xl bg-stone-100 text-center border border-stone-200">
              <p className="text-stone-700 font-medium text-sm">
                El plazo para confirmar asistencia ha concluido.
              </p>
              <p className="text-stone-500 text-xs mt-1">
                Tu respuesta registrada actual es:{' '}
                <strong className="uppercase">{invitado.estado_rsvp}</strong>
                {invitado.estado_rsvp === 'confirmado' && invitado.numero_acompanantes > 0 && (
                  <span> con {invitado.numero_acompanantes} acompañante(s)</span>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnviarRsvp} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSeleccionRsvp('confirmado')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    seleccionRsvp === 'confirmado'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <CheckCircle className={`w-6 h-6 mb-1 ${seleccionRsvp === 'confirmado' ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span className="text-sm font-semibold">Sí, asistiré</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeleccionRsvp('rechazado')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    seleccionRsvp === 'rechazado'
                      ? 'border-rose-600 bg-rose-50/60 text-rose-900 shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <XCircle className={`w-6 h-6 mb-1 ${seleccionRsvp === 'rechazado' ? 'text-rose-600' : 'text-stone-400'}`} />
                  <span className="text-sm font-semibold">No podré asistir</span>
                </button>
              </div>

              {/* Selector de acompañantes si confirma y tiene permitidos */}
              {seleccionRsvp === 'confirmado' && invitado.max_acompanantes_permitidos > 0 && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <label className="flex items-center justify-between text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-700" />
                      Número de acompañantes
                    </span>
                    <span className="text-stone-400 text-[11px] normal-case">
                      (Máx. {invitado.max_acompanantes_permitidos})
                    </span>
                  </label>
                  <select
                    value={acompanantes}
                    onChange={(e) => setAcompanantes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    {Array.from({ length: invitado.max_acompanantes_permitidos + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? 'Sin acompañantes adicionales (Solo yo)' : `${i} acompañante${i > 1 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={enviandoRsvp}
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {enviandoRsvp ? 'Guardando respuesta...' : 'Confirmar Mi Respuesta'}
              </button>

              {invitado.respondido_at && (
                <p className="text-center text-xs text-stone-400">
                  Última respuesta registrada: {new Date(invitado.respondido_at).toLocaleString()}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Mensaje de Cierre */}
        <div className="text-center py-6 text-stone-400 text-xs">
          <p className="font-serif-elegant text-base italic text-stone-600 mb-1">
            {diseno.mensaje_cierre || '¡Esperamos celebrar juntos este momento tan especial!'}
          </p>
          <p>© {new Date().getFullYear()} Plataforma de Invitaciones Digitales</p>
        </div>
      </div>
    </div>
  );
}

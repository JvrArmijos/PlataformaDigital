import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Search,
  UserCheck
} from 'lucide-react';
import { calcularSha256 } from '../../lib/crypto';
import { formatearFechaHora, formatearFechaCorta } from '../../lib/dates';
import { exportarAsistenciaOrganizadorCSV } from '../../lib/csv';
import { obtenerPanelOrganizadorPorHash } from '../../lib/supabase';
import type { PanelOrganizadorData } from '../../types/database';
import { StatusBadge } from '../../components/StatusBadge';

export function PanelOrganizador() {
  const { token } = useParams<{ token: string }>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<PanelOrganizadorData | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    async function cargar() {
      if (!token) {
        setError('Enlace privado no proporcionado.');
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        // Hashear el token antes de consultar
        const hash = await calcularSha256(token);
        const res = await obtenerPanelOrganizadorPorHash(hash);
        setDatos(res);
        if (!res.valido) {
          setError(res.error || 'Acceso no autorizado o enlace no válido.');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al consultar panel');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [token]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif-elegant text-stone-600 text-lg">Cargando panel de asistencia...</p>
        </div>
      </div>
    );
  }

  // Verificación de expiración o revocación (Sección 7)
  if (datos?.revocado || datos?.expirado || error || !datos?.valido || !datos?.evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif-elegant text-2xl font-bold text-stone-900 mb-2">
            Acceso No Disponible
          </h1>
          <p className="text-stone-600 text-sm mb-4">
            {error || 'El enlace privado ha sido revocado o ha expirado (plazo máximo de 30 días posteriores al evento).'}
          </p>
          <p className="text-stone-400 text-xs">
            Si considera que se trata de un error o requiere una consulta posterior, contacte al administrador.
          </p>
        </div>
      </div>
    );
  }

  const { evento, metricas, invitados = [] } = datos;

  // Filtrado de invitados para búsqueda en la vista
  const invitadosFiltrados = invitados.filter(inv => {
    const coincideNombre = inv.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || inv.estado_rsvp === filtroEstado;
    return coincideNombre && coincideEstado;
  });

  const handleDescargarCSV = () => {
    exportarAsistenciaOrganizadorCSV(evento.titulo, invitados);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Cabecera del Panel */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-1">
              Panel Privado del Organizador (Solo Lectura)
            </div>
            <h1 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-stone-900">
              {evento.titulo}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {evento.ubicacion_nombre}
              </span>
            </div>
          </div>

          <button
            onClick={handleDescargarCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte CSV
          </button>
        </div>
      </header>

      {/* Métricas Agregadas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Asistentes Confirmados */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Total Personas</span>
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-stone-900 font-cinzel">
              {metricas?.total_asistentes ?? 0}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {metricas?.confirmados ?? 0} titulares + {metricas?.total_acompanantes_confirmados ?? 0} acompañantes
            </p>
          </div>

          {/* Confirmaciones Titulares */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Confirmados</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-700 font-cinzel">
              {metricas?.confirmados ?? 0}
            </div>
            <p className="text-xs text-stone-500 mt-1">Invitaciones confirmadas</p>
          </div>

          {/* Rechazos */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Rechazados</span>
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-rose-600 font-cinzel">
              {metricas?.rechazados ?? 0}
            </div>
            <p className="text-xs text-stone-500 mt-1">No podrán asistir</p>
          </div>

          {/* Pendientes */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Pendientes</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-600 font-cinzel">
              {metricas?.pendientes ?? 0}
            </div>
            <p className="text-xs text-stone-500 mt-1">De {metricas?.total_invitados ?? 0} invitados totales</p>
          </div>
        </div>

        {/* Listado de Asistencia */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Lista Detallada de Asistencia
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Muestra {invitadosFiltrados.length} de {invitados.length} invitados
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Buscador */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar invitado..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Filtro estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="todos">Todos los estados</option>
                <option value="confirmado">Confirmados</option>
                <option value="rechazado">Rechazados</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
          </div>

          {/* Tabla de Invitados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Invitado</th>
                  <th className="py-3 px-4">Estado RSVP</th>
                  <th className="py-3 px-4 text-center">Acompañantes</th>
                  <th className="py-3 px-4 text-center">Total Personas</th>
                  <th className="py-3 px-6">Última Respuesta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {invitadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-stone-400 text-xs">
                      No se encontraron invitados con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  invitadosFiltrados.map((inv) => {
                    const totalPersonas = inv.estado_rsvp === 'confirmado' ? (1 + (inv.numero_acompanantes || 0)) : 0;
                    return (
                      <tr key={inv.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-stone-900">
                          {inv.nombre}
                          {inv.telefono && (
                            <span className="block text-xs text-stone-400 font-normal">
                              Tel: {inv.telefono}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.estado_rsvp} type="rsvp" />
                        </td>
                        <td className="py-3.5 px-4 text-center text-stone-700">
                          {inv.estado_rsvp === 'confirmado' ? inv.numero_acompanantes : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-900">
                          {inv.estado_rsvp === 'confirmado' ? totalPersonas : 0}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-stone-500">
                          {inv.respondido_at ? new Date(inv.respondido_at).toLocaleString() : 'Pendiente'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota de caducidad del panel */}
        <div className="text-center text-xs text-stone-400 pt-4">
          Este panel de organizador estará vigente hasta el{' '}
          <strong>{formatearFechaCorta(evento.expira_panel_at)}</strong> (30 días posteriores al evento).
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Users, 
  MapPin, 
  Clock, 
  ChevronRight,
  Shield,
  Search
} from 'lucide-react';
import { adminListarEventos } from '../../lib/supabase';
import { formatearFechaCorta, formatearFechaHora } from '../../lib/dates';
import type { Evento } from '../../types/database';
import { StatusBadge } from '../../components/StatusBadge';

export function EventosList() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const data = await adminListarEventos();
      setEventos(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar eventos');
    } finally {
      setCargando(false);
    }
  };

  const eventosFiltrados = eventos.filter(ev => {
    const coincideTexto = ev.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                          ev.ubicacion_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          ev.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || ev.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
            Eventos e Invitaciones
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Administra eventos, diseño de invitaciones, invitados y enlaces privados
          </p>
        </div>

        <Link
          to="/admin/eventos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo Evento
        </Link>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, lugar o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="todos">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="borrador">Borradores</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Eventos */}
      {cargando ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Cargando eventos...</p>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif-elegant text-xl font-bold text-stone-700">No se encontraron eventos</h3>
          <p className="text-stone-500 text-xs mt-1 mb-4">
            Comienza creando el primer evento para generar invitaciones.
          </p>
          <Link
            to="/admin/eventos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Crear Evento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={ev.estado} type="evento" />
                  <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">
                    {ev.tipo}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif-elegant text-xl font-bold text-stone-900 leading-snug">
                    {ev.titulo}
                  </h3>
                  {ev.cliente && (
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      Cliente: {ev.cliente.nombre}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{formatearFechaHora(ev.fecha_evento, ev.zona_horaria)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{ev.ubicacion_nombre}</span>
                  </div>
                </div>

                {/* Plazos de Caducidad (Sección 7 y 8) */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1 text-[11px] text-stone-500">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Caducidad (+7d):
                    </span>
                    <strong className="text-stone-700">{formatearFechaCorta(ev.fecha_caducidad_invitaciones)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-600" /> Panel Org (+30d):
                    </span>
                    <strong className="text-stone-700">{formatearFechaCorta(ev.fecha_caducidad_panel)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-stone-400">
                      Eliminación (+90d):
                    </span>
                    <span className="text-stone-500">{formatearFechaCorta(ev.fecha_eliminacion_datos)}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="px-6 py-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-2">
                <Link
                  to={`/admin/eventos/${ev.id}/invitaciones`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Invitados & Enlaces
                </Link>

                <Link
                  to={`/admin/eventos/${ev.id}`}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  Configurar <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

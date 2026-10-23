import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Save, 
  ArrowLeft, 
  Palette, 
  Clock, 
  ShieldAlert
} from 'lucide-react';
import { adminGuardarEvento, adminObtenerEvento, adminListarClientes } from '../../lib/supabase';
import { calcularPlazosDesdeEvento, formatearFechaCorta } from '../../lib/dates';
import type { Cliente, DisenoConfig, EstadoEvento, EstadoRetencion } from '../../types/database';

export function EventoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(id && id !== 'nuevo');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos principales
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('boda');
  const [fechaEvento, setFechaEvento] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [zonaHoraria, setZonaHoraria] = useState('America/Guayaquil');
  const [fechaLimiteRsvp, setFechaLimiteRsvp] = useState(() => {
    const d = new Date(Date.now() + 20 * 86400000);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [ubicacionNombre, setUbicacionNombre] = useState('');
  const [ubicacionUrl, setUbicacionUrl] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [estado, setEstado] = useState<EstadoEvento>('borrador');

  // Retención excepcional
  const [estadoRetencion, setEstadoRetencion] = useState<EstadoRetencion>('activa');
  const [motivoRetencion, setMotivoRetencion] = useState('');

  // Configuración de diseño
  const [diseno, setDiseno] = useState<DisenoConfig>({
    tema: 'clasico_elegante',
    color_primario: '#9f1239',
    color_secundario: '#fff1f2',
    color_acento: '#fb7185',
    fuente_titulo: 'serif',
    codigo_vestimenta: 'Formal / Rigurosa Etiqueta',
    permitir_ninos: true,
    mensaje_bienvenida: 'Tenemos el honor de invitarte a celebrar con nosotros este día tan esperado.',
    mensaje_cierre: '¡Esperamos contar con tu grata presencia!',
    cuenta_bancaria_regalo: {
      banco: 'Banco Pichincha',
      titular: '',
      numero: '',
      tipo: 'Ahorros'
    }
  });

  useEffect(() => {
    async function inicializar() {
      setCargando(true);
      try {
        const cls = await adminListarClientes();
        setClientes(cls);
        if (cls.length > 0 && !clienteId) {
          setClienteId(cls[0].id);
        }

        if (esEdicion && id) {
          const ev = await adminObtenerEvento(id);
          if (ev) {
            setClienteId(ev.cliente_id);
            setTitulo(ev.titulo);
            setTipo(ev.tipo);
            setFechaEvento(new Date(ev.fecha_evento).toISOString().slice(0, 16));
            setZonaHoraria(ev.zona_horaria || 'America/Guayaquil');
            setFechaLimiteRsvp(new Date(ev.fecha_limite_rsvp).toISOString().slice(0, 16));
            setUbicacionNombre(ev.ubicacion_nombre);
            setUbicacionUrl(ev.ubicacion_url || '');
            setIndicaciones(ev.indicaciones || '');
            setEstado(ev.estado);
            setEstadoRetencion(ev.estado_retencion);
            setMotivoRetencion(ev.motivo_retencion || '');
            if (ev.configuracion_diseno) {
              setDiseno({ ...diseno, ...ev.configuracion_diseno });
            }
          }
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Error al inicializar');
      } finally {
        setCargando(false);
      }
    }

    inicializar();
  }, [id, esEdicion]);

  // Cálculo en vivo de los plazos a partir de la fecha seleccionada
  let plazosCalculados = null;
  try {
    const fechaCompletaIso = new Date(fechaEvento).toISOString();
    plazosCalculados = calcularPlazosDesdeEvento(fechaCompletaIso);
  } catch {
    // fecha en proceso de edición
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !titulo || !fechaEvento || !ubicacionNombre) {
      alert('Por favor complete los campos obligatorios: Cliente, Título, Fecha y Lugar.');
      return;
    }

    try {
      setGuardando(true);
      const fechaEventoIso = new Date(fechaEvento).toISOString();
      const fechaLimiteIso = new Date(fechaLimiteRsvp).toISOString();

      const resultado = await adminGuardarEvento({
        id: esEdicion ? id : undefined,
        cliente_id: clienteId,
        titulo,
        tipo,
        fecha_evento: fechaEventoIso,
        zona_horaria: zonaHoraria,
        fecha_limite_rsvp: fechaLimiteIso,
        ubicacion_nombre: ubicacionNombre,
        ubicacion_url: ubicacionUrl || null,
        indicaciones: indicaciones || null,
        configuracion_diseno: diseno,
        estado,
        estado_retencion: estadoRetencion,
        motivo_retencion: estadoRetencion === 'retencion_excepcional' ? motivoRetencion : null,
      });

      navigate(`/admin/eventos/${resultado.id}/invitaciones`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar evento');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-sm">Cargando datos del evento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Botón Atrás */}
      <Link
        to="/admin/eventos"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a eventos
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
            {esEdicion ? 'Configuración del Evento' : 'Crear Nuevo Evento'}
          </h1>
          <p className="text-stone-500 text-xs mt-0.5">
            Define la logística, el diseño de la plantilla y los plazos de retención
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardar} className="space-y-8">
        {/* SECCIÓN 1: DATOS GENERALES */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            1. Datos Generales de la Celebración
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Cliente Contratante *
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tipo de Evento *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="boda">Boda / Matrimonio</option>
                <option value="xv_anos">XV Años</option>
                <option value="cumpleanos">Cumpleaños</option>
                <option value="bautizo">Bautizo / Primera Comunión</option>
                <option value="corporativo">Evento Corporativo</option>
                <option value="aniversario">Aniversario</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Título de la Invitación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Boda Sofía & Mateo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Fecha y Hora Oficial del Evento *
              </label>
              <input
                type="datetime-local"
                required
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Fecha Límite de Confirmación (RSVP) *
              </label>
              <input
                type="datetime-local"
                required
                value={fechaLimiteRsvp}
                onChange={(e) => setFechaLimiteRsvp(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Lugar / Salón de Recepción *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Quinta Los Cipreses, Valle de los Chillos"
                value={ubicacionNombre}
                onChange={(e) => setUbicacionNombre(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Enlace a Google Maps / Waze (opcional)
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={ubicacionUrl}
                onChange={(e) => setUbicacionUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Indicaciones Especiales para los Invitados
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Agradecemos su puntualidad. El parqueadero cuenta con seguridad privada..."
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Estado del Evento
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoEvento)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="borrador">Borrador (Configuración interna)</option>
                <option value="publicado">Publicado (Invitaciones y RSVP activos)</option>
                <option value="finalizado">Finalizado (Celebración concluida)</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Zona Horaria
              </label>
              <input
                type="text"
                disabled
                value={zonaHoraria}
                className="w-full px-3 py-2 text-sm bg-stone-100 text-stone-500 rounded-xl border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PLAZOS Y RETENCIÓN DE DATOS (Sección 7, 8 y 10) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            2. Cálculo Automático de Plazos y Privacidad
          </h2>

          <p className="text-xs text-stone-500">
            Los plazos se calculan estrictamente a partir de la fecha y hora oficial del evento en la zona horaria indicada:
          </p>

          {plazosCalculados && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-900 block">
                  Invitaciones (+7 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_caducidad_invitaciones)}
                </span>
                <span className="text-[10px] text-stone-500">Luego muestra página de evento finalizado.</span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-900 block">
                  Panel Organizador (+30 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_caducidad_panel)}
                </span>
                <span className="text-[10px] text-stone-500">Revocación automática del enlace privado.</span>
              </div>

              <div className="p-3 bg-stone-100 border border-stone-200 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-700 block">
                  Eliminación de Datos (+90 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_eliminacion_datos)}
                </span>
                <span className="text-[10px] text-stone-500">Borrado seguro de datos personales y dependencias.</span>
              </div>
            </div>
          )}

          {/* Opción de Excepción de Retención Autorizada */}
          <div className="pt-4 border-t border-stone-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={estadoRetencion === 'retencion_excepcional'}
                onChange={(e) => setEstadoRetencion(e.target.checked ? 'retencion_excepcional' : 'activa')}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Aplicar Excepción Documentada de Retención (Impide eliminación automática a los 90 días)</span>
            </label>

            {estadoRetencion === 'retencion_excepcional' && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs text-purple-900 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span>Motivo u Obligación Legal de Conservación:</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: Requerimiento contable o autorización expresa del cliente..."
                  value={motivoRetencion}
                  onChange={(e) => setMotivoRetencion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-purple-300 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: DISEÑO DE LA PLANTILLA */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-600" />
            3. Configuración y Personalización del Diseño
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tema Visual
              </label>
              <select
                value={diseno.tema}
                onChange={(e) => setDiseno({ ...diseno, tema: e.target.value as DisenoConfig['tema'] })}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none"
              >
                <option value="clasico_elegante">Clásico Elegante</option>
                <option value="romantico_floral">Romántico Floral</option>
                <option value="moderno_minimal">Moderno Minimalista</option>
                <option value="dorado_luxury">Dorado Luxury</option>
                <option value="nocturno_estelar">Nocturno Estelar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Color Primario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={diseno.color_primario}
                  onChange={(e) => setDiseno({ ...diseno, color_primario: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-stone-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={diseno.color_primario}
                  onChange={(e) => setDiseno({ ...diseno, color_primario: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 text-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Código de Vestimenta
              </label>
              <input
                type="text"
                placeholder="Ej: Formal / Etiqueta"
                value={diseno.codigo_vestimenta}
                onChange={(e) => setDiseno({ ...diseno, codigo_vestimenta: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Mensaje de Cierre
              </label>
              <input
                type="text"
                placeholder="Ej: ¡Tu presencia es nuestro mejor regalo!"
                value={diseno.mensaje_cierre}
                onChange={(e) => setDiseno({ ...diseno, mensaje_cierre: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Cuenta Bancaria (Regalos / Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Banco Pichincha - Ahorros 2200..."
                value={diseno.cuenta_bancaria_regalo?.numero ? `${diseno.cuenta_bancaria_regalo.banco} | ${diseno.cuenta_bancaria_regalo.numero} | ${diseno.cuenta_bancaria_regalo.titular}` : ''}
                onChange={(e) => {
                  const partes = e.target.value.split('|').map(p => p.trim());
                  setDiseno({
                    ...diseno,
                    cuenta_bancaria_regalo: {
                      banco: partes[0] || 'Banco',
                      numero: partes[1] || '',
                      titular: partes[2] || '',
                      tipo: 'Ahorros'
                    }
                  });
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/admin/eventos"
            className="px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 text-sm font-semibold transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando evento...' : (esEdicion ? 'Guardar Cambios' : 'Crear y Pasar a Invitados')}
          </button>
        </div>
      </form>
    </div>
  );
}

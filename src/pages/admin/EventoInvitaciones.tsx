import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Shield, 
  RefreshCw, 
  MessageSquare,
  ArrowLeft,
  Info
} from 'lucide-react';
import { 
  adminObtenerEvento, 
  adminListarInvitados, 
  adminGuardarInvitado, 
  adminEliminarInvitado,
  adminObtenerAccesoOrganizador,
  adminCrearAccesoOrganizador,
  adminRevocarAccesoOrganizador
} from '../../lib/supabase';
import { 
  generarTokenSeguro, 
  calcularSha256, 
  construirEnlaceInvitacion, 
  construirEnlaceOrganizador 
} from '../../lib/crypto';
import { parsearCSVInvitados, exportarEnlacesInvitacionesAdminCSV } from '../../lib/csv';
import { generarMensajeWhatsApp } from '../../lib/whatsapp';
import { formatearFechaHora, formatearFechaCorta } from '../../lib/dates';
import type { Evento, Invitado, AccesoCliente } from '../../types/database';
import { StatusBadge } from '../../components/StatusBadge';

export function EventoInvitaciones() {
  const { id: eventoId } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [accesoOrganizador, setAccesoOrganizador] = useState<AccesoCliente | null>(null);
  const [cargando, setCargando] = useState(true);

  // Mapa local de tokens en claro generados en esta sesión de trabajo para copiar o enviar
  const [tokensSesion, setTokensSesion] = useState<Record<string, string>>({});
  const [tokenOrganizadorSesion, setTokenOrganizadorSesion] = useState<string>('');

  // Formulario nuevo invitado
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [maxAcompanantes, setMaxAcompanantes] = useState(0);
  const [guardando, setGuardando] = useState(false);

  // Importación CSV
  const [mostrarModalCSV, setMostrarModalCSV] = useState(false);
  const [textoCSV, setTextoCSV] = useState('');
  const [importando, setImportando] = useState(false);

  // Copiado
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [eventoId]);

  const cargarDatos = async () => {
    if (!eventoId) return;
    try {
      setCargando(true);
      const [ev, invs, acc] = await Promise.all([
        adminObtenerEvento(eventoId),
        adminListarInvitados(eventoId),
        adminObtenerAccesoOrganizador(eventoId),
      ]);
      setEvento(ev);
      setInvitados(invs);
      if (acc) {
        setAccesoOrganizador(acc);
        if (acc.token_plano) setTokenOrganizadorSesion(acc.token_plano);
      } else if (ev) {
        // Generar enlace organizador automáticamente para pruebas del admin
        const tokenPlano = generarTokenSeguro();
        const tokenHash = await calcularSha256(tokenPlano);
        const nuevoAcc = await adminCrearAccesoOrganizador(eventoId, tokenHash, ev.fecha_caducidad_panel, tokenPlano);
        setAccesoOrganizador(nuevoAcc);
        setTokenOrganizadorSesion(tokenPlano);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  // Crear invitado manual
  const handleCrearInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId || !nombre.trim()) return;

    try {
      setGuardando(true);
      // Generar token criptográficamente seguro
      const tokenPlano = generarTokenSeguro();
      const tokenHash = await calcularSha256(tokenPlano);

      const nuevo = await adminGuardarInvitado({
        evento_id: eventoId,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        token_hash: tokenHash,
        max_acompanantes_permitidos: maxAcompanantes,
        token_plano: tokenPlano,
      });

      // Guardar token plano en mapa temporal de sesión para poder copiar el enlace
      setTokensSesion(prev => ({ ...prev, [nuevo.id]: tokenPlano }));
      setInvitados(prev => [...prev, { ...nuevo, token_plano: tokenPlano }]);

      setNombre('');
      setTelefono('');
      setMaxAcompanantes(0);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear invitado');
    } finally {
      setGuardando(false);
    }
  };

  // Importación masiva CSV
  const handleImportarCSV = async () => {
    if (!eventoId || !textoCSV.trim()) return;

    try {
      setImportando(true);
      const lista = parsearCSVInvitados(textoCSV);
      if (lista.length === 0) {
        alert('No se detectaron filas válidas en el texto CSV.');
        return;
      }

      const nuevosTokens: Record<string, string> = {};
      const nuevosInvitados: Invitado[] = [];

      for (const item of lista) {
        const tokenPlano = generarTokenSeguro();
        const tokenHash = await calcularSha256(tokenPlano);

        const inv = await adminGuardarInvitado({
          evento_id: eventoId,
          nombre: item.nombre,
          telefono: item.telefono || null,
          token_hash: tokenHash,
          max_acompanantes_permitidos: item.max_acompanantes,
          token_plano: tokenPlano,
        });

        nuevosTokens[inv.id] = tokenPlano;
        nuevosInvitados.push({ ...inv, token_plano: tokenPlano });
      }

      setTokensSesion(prev => ({ ...prev, ...nuevosTokens }));
      setInvitados(prev => [...prev, ...nuevosInvitados]);
      setMostrarModalCSV(false);
      setTextoCSV('');
      alert(`Se importaron ${lista.length} invitados exitosamente.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al importar CSV');
    } finally {
      setImportando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este invitado? Su enlace dejará de funcionar.')) return;
    try {
      await adminEliminarInvitado(id);
      setInvitados(prev => prev.filter(i => i.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  // Generar o renovar enlace privado del organizador
  const handleGenerarEnlaceOrganizador = async () => {
    if (!eventoId || !evento) return;
    try {
      const tokenPlano = generarTokenSeguro();
      const tokenHash = await calcularSha256(tokenPlano);
      const expiraAt = evento.fecha_caducidad_panel; // 30 días tras el evento

      const acc = await adminCrearAccesoOrganizador(eventoId, tokenHash, expiraAt, tokenPlano);
      setAccesoOrganizador(acc);
      setTokenOrganizadorSesion(tokenPlano);
      alert('Se ha generado un nuevo enlace privado para el organizador. Cópialo y compártelo.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al generar enlace organizador');
    }
  };

  const handleRevocarEnlaceOrganizador = async () => {
    if (!accesoOrganizador) return;
    if (!confirm('¿Deseas revocar inmediatamente este enlace privado? El organizador perderá el acceso a la lista.')) return;

    try {
      await adminRevocarAccesoOrganizador(accesoOrganizador.id);
      setAccesoOrganizador(null);
      setTokenOrganizadorSesion('');
      alert('Enlace del organizador revocado con éxito.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al revocar enlace');
    }
  };

  const copiarAlPortapapeles = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Exportar CSV administrativo
  const handleExportarEnlacesCSV = () => {
    if (!evento) return;
    const datosExport = invitados.map(inv => {
      const token = tokensSesion[inv.id] || inv.token_plano || 'token-generado-en-sesion-previa';
      return {
        nombre: inv.nombre,
        telefono: inv.telefono,
        estado_rsvp: inv.estado_rsvp,
        max_acompanantes: inv.max_acompanantes_permitidos,
        enlace: token.startsWith('token-') ? 'Generado previamente (re-emitir si es necesario)' : construirEnlaceInvitacion(token)
      };
    });
    exportarEnlacesInvitacionesAdminCSV(evento.titulo, datosExport);
  };

  if (cargando || !evento) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-sm">Cargando invitados del evento...</p>
      </div>
    );
  }

  const enlaceOrgCompleto = tokenOrganizadorSesion
    ? construirEnlaceOrganizador(tokenOrganizadorSesion)
    : (accesoOrganizador?.token_plano ? construirEnlaceOrganizador(accesoOrganizador.token_plano) : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera */}
      <div>
        <Link
          to="/admin/eventos"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a eventos
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-700 block">
              Gestión de Invitados & Enlaces
            </span>
            <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
              {evento.titulo}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {enlaceOrgCompleto && (
              <a
                href={enlaceOrgCompleto}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Ver como Organizador
              </a>
            )}

            <button
              onClick={() => setMostrarModalCSV(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              Importar CSV
            </button>

            <button
              onClick={handleExportarEnlacesCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              Exportar Enlaces CSV
            </button>
          </div>
        </div>
      </div>

      {/* Aviso informativo de red local Wi-Fi para pruebas en celular */}
      {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="p-4 bg-amber-50 rounded-3xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">
              💡 ¿Cómo probar los enlaces de invitación desde tu celular en la misma red Wi-Fi?
            </p>
            <p className="text-stone-600 leading-relaxed text-[11px]">
              Actualmente tienes abierto el panel con <strong className="font-mono text-amber-800">localhost:5173</strong>. Para que los enlaces que copies o envíes a WhatsApp puedan abrirse desde tu teléfono u otro dispositivo conectado a tu Wi-Fi, abre la plataforma en tu navegador usando la IP de tu computador (por ejemplo: <code className="bg-amber-100/70 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">http://192.168.1.XX:5173/admin/eventos</code>). De esa forma, todos los enlaces generados usarán esa dirección accesible para tu móvil.
            </p>
          </div>
        </div>
      )}

      {/* BLOQUE ENLACE PRIVADO DEL ORGANIZADOR (Sección 4.3 y 9) */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-sm uppercase tracking-wider font-bold text-stone-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Enlace Privado del Organizador (Panel de Asistencia)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Acceso seguro de solo lectura para el cliente/organizador. Válido hasta 30 días después del evento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerarEnlaceOrganizador}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-semibold transition-colors border border-purple-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {accesoOrganizador ? 'Regenerar Enlace' : 'Generar Enlace Privado'}
            </button>

            {accesoOrganizador && (
              <button
                onClick={handleRevocarEnlaceOrganizador}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors border border-rose-200"
              >
                Revocar
              </button>
            )}
          </div>
        </div>

        {enlaceOrgCompleto ? (
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="truncate text-xs font-mono text-stone-700">
              {enlaceOrgCompleto}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copiarAlPortapapeles(enlaceOrgCompleto, 'enlace_org')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-xs font-medium text-stone-700"
              >
                {copiadoId === 'enlace_org' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                {copiadoId === 'enlace_org' ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={enlaceOrgCompleto}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium"
              >
                Abrir Panel <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : accesoOrganizador ? (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>
              El enlace privado está activo (Expira: {formatearFechaCorta(accesoOrganizador.expira_at)}). Por seguridad, el token en texto plano no se guarda en el servidor. Presiona <strong>Regenerar Enlace</strong> si necesitas emitirlo nuevamente.
            </span>
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">
            No se ha emitido ningún enlace de organizador para este evento todavía.
          </p>
        )}
      </div>

      {/* FORMULARIO AGREGAR INVITADO */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <h2 className="text-sm uppercase tracking-wider font-bold text-stone-800 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-amber-600" />
          Registrar Nuevo Invitado
        </h2>

        <form onSubmit={handleCrearInvitado} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Nombre Completo / Familia *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lic. Marcelo Herrera y Acompañante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Teléfono Celular (10 dígitos)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="0991234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Acompañantes Permitidos
            </label>
            <select
              value={maxAcompanantes}
              onChange={(e) => setMaxAcompanantes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Sin acompañantes (1 persona)' : `+${n} acompañante${n > 1 ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex flex-wrap justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => copiarAlPortapapeles(`${window.location.origin}/i/general-${evento.id}`, 'enlace_general')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all border border-amber-200"
            >
              {copiadoId === 'enlace_general' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
              {copiadoId === 'enlace_general' ? '¡Enlace General Copiado!' : 'Copiar Enlace General'}
            </button>

            <a
              href={`${window.location.origin}/i/general-${evento.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all border border-stone-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              Ver Invitación General (Para todos)
            </a>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {guardando ? 'Generando token seguro...' : 'Generar Invitación Individual'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE INVITADOS CON ACCIONES DE ENTREGA */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Invitados Registrados ({invitados.length})
            </h3>
            <p className="text-xs text-stone-500">
              Cada invitado dispone de un token individual único para responder su asistencia.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-6">Invitado</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-center">Permitidos</th>
                <th className="py-3 px-4 text-center">RSVP</th>
                <th className="py-3 px-4 text-center">Confirmados</th>
                <th className="py-3 px-6 text-right">Métodos de Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {invitados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No hay invitados registrados para este evento.
                  </td>
                </tr>
              ) : (
                invitados.map((inv) => {
                  const tokenActual = tokensSesion[inv.id] || inv.token_plano;
                  const enlaceInvitacion = tokenActual ? construirEnlaceInvitacion(tokenActual) : null;
                  
                  // Preparar datos para WhatsApp
                  const mensajeWa = enlaceInvitacion ? generarMensajeWhatsApp({
                    nombreInvitado: inv.nombre,
                    tituloEvento: evento.titulo,
                    fechaEventoLegible: formatearFechaHora(evento.fecha_evento, evento.zona_horaria),
                    ubicacionNombre: evento.ubicacion_nombre,
                    enlaceInvitacion: enlaceInvitacion,
                    telefonoDestino: inv.telefono
                  }) : null;

                  return (
                    <tr key={inv.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-stone-900">
                        {inv.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {inv.telefono || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-600">
                        {inv.max_acompanantes_permitidos > 0 ? `+${inv.max_acompanantes_permitidos}` : '1'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.estado_rsvp} type="rsvp" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800">
                        {inv.estado_rsvp === 'confirmado' ? (1 + inv.numero_acompanantes) : 0}
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        {enlaceInvitacion ? (
                          <>
                            {/* Método A: Copiar enlace */}
                            <button
                              onClick={() => copiarAlPortapapeles(enlaceInvitacion, inv.id)}
                              title="Copiar enlace individual"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                            >
                              {copiadoId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                              <span className="hidden md:inline">{copiadoId === inv.id ? 'Copiado' : 'Copiar'}</span>
                            </button>

                            {/* Método B: WhatsApp manual */}
                            {mensajeWa && (
                              <a
                                href={mensajeWa.enlaceWhatsApp}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp con mensaje personalizado"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors border border-emerald-200"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden md:inline">WhatsApp</span>
                              </a>
                            )}

                            {/* Probar vista invitado */}
                            <a
                              href={enlaceInvitacion}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir invitación como invitado"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ver Invitación</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">
                            Hash en BD (Re-emitir)
                          </span>
                        )}

                        <button
                          onClick={() => handleEliminar(inv.id)}
                          title="Eliminar invitado"
                          className="inline-flex items-center p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORTACIÓN CSV */}
      {mostrarModalCSV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif-elegant text-xl font-bold text-stone-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              Importar Invitados desde CSV
            </h3>

            <p className="text-xs text-stone-500">
              Pega el contenido de tu archivo CSV o lista de invitados con el formato:<br />
              <code className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] text-stone-700 font-mono">
                Nombre, Teléfono (opcional), Acompañantes Permitidos (opcional)
              </code>
            </p>

            <textarea
              rows={8}
              placeholder="Ejemplo:
Carlos Valencia, 0991234567, 1
Dra. Elena Paredes, 0987654321, 0
Familia Gómez, 0998877665, 3"
              value={textoCSV}
              onChange={(e) => setTextoCSV(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalCSV(false)}
                className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportarCSV}
                disabled={importando}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                {importando ? 'Procesando...' : 'Importar y Generar Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

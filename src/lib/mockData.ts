import type { Cliente, Evento, Invitado, AccesoCliente, LogMantenimiento, InvitacionPublicaData, PanelOrganizadorData } from '../types/database';
import { calcularPlazosDesdeEvento, estaInvitacionCaducada, estaRsvpCerrado, estaPanelOrganizadorExpirado } from './dates';

// Almacenamiento en memoria para demostración y testing cuando Supabase no está configurado externamente
export interface MockStore {
  clientes: Cliente[];
  eventos: Evento[];
  invitados: Invitado[];
  accesos_cliente: AccesoCliente[];
  historial_rsvp: Array<{
    id: string;
    invitado_id: string;
    estado_anterior: string | null;
    estado_nuevo: string;
    numero_acompanantes: number;
    created_at: string;
  }>;
  logs_mantenimiento: LogMantenimiento[];
}

const fechaFutura = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
const plazosFuturos = calcularPlazosDesdeEvento(fechaFutura);

export const mockStore: MockStore = {
  clientes: [
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      nombre: 'Familia Mendoza Alarcón',
      correo: 'mendoza.alarcon@ejemplo.com',
      telefono: '+593 99 123 4567',
      notas: 'Boda en Quinta Los Cipreses',
      activo: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'c2222222-2222-4222-8222-222222222222',
      nombre: 'Corporación Andina',
      correo: 'eventos@corp-andina.com',
      telefono: '+593 98 765 4321',
      notas: 'Cena de Gala Anual',
      activo: true,
      created_at: new Date().toISOString(),
    }
  ],
  eventos: [
    {
      id: 'e1111111-1111-4111-8111-111111111111',
      cliente_id: 'c1111111-1111-4111-8111-111111111111',
      titulo: 'Boda Sofía & Mateo',
      tipo: 'boda',
      fecha_evento: fechaFutura,
      zona_horaria: 'America/Guayaquil',
      fecha_limite_rsvp: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      ubicacion_nombre: 'Quinta Los Cipreses, Valle de los Chillos',
      ubicacion_url: 'https://maps.google.com/?q=Quinta+Los+Cipreses',
      indicaciones: 'Código de vestimenta Formal / Guayabera o Traje. Agradecemos su puntualidad.',
      configuracion_diseno: {
        tema: 'romantico_floral',
        estilo_tarjeta: 'arco_moderno',
        color_primario: '#9f1239',
        color_secundario: '#fff1f2',
        color_acento: '#fb7185',
        fuente_titulo: 'serif',
        codigo_vestimenta: 'Formal / Rigurosa Etiqueta',
        permitir_ninos: false,
        mensaje_bienvenida: 'Con inmensa alegría queremos compartir este día inolvidable junto a ti.',
        mensaje_cierre: 'Tu presencia es nuestro mejor regalo.',
        cuenta_bancaria_regalo: {
          banco: 'Banco Pichincha',
          titular: 'Sofía & Mateo',
          numero: '2200112233',
          tipo: 'Ahorros'
        }
      },
      estado: 'publicado',
      fecha_caducidad_invitaciones: plazosFuturos.fecha_caducidad_invitaciones,
      fecha_caducidad_panel: plazosFuturos.fecha_caducidad_panel,
      fecha_eliminacion_datos: plazosFuturos.fecha_eliminacion_datos,
      datos_eliminados_at: null,
      estado_retencion: 'activa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  invitados: [
    {
      id: 'i1111111-1111-4111-8111-111111111111',
      evento_id: 'e1111111-1111-4111-8111-111111111111',
      nombre: 'Ing. Carlos Valencia y Acompañante',
      telefono: '0998877665',
      token_hash: 'mocktokeninvitado123456hash',
      estado_rsvp: 'pendiente',
      numero_acompanantes: 0,
      max_acompanantes_permitidos: 1,
      respondido_at: null,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      token_plano: 'demoinvitado123456',
    },
    {
      id: 'i2222222-2222-4222-8222-222222222222',
      evento_id: 'e1111111-1111-4111-8111-111111111111',
      nombre: 'Dra. Elena Paredes',
      telefono: '0981122334',
      token_hash: 'mocktokeninvitadoelena',
      estado_rsvp: 'confirmado',
      numero_acompanantes: 0,
      max_acompanantes_permitidos: 0,
      respondido_at: new Date(Date.now() - 3600000).toISOString(),
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      token_plano: 'demoinvitadoelena',
    }
  ],
  accesos_cliente: [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      evento_id: 'e1111111-1111-4111-8111-111111111111',
      token_hash: 'mocktokenorganizador123hash',
      permiso: 'solo_lectura',
      expira_at: plazosFuturos.fecha_caducidad_panel,
      revocado_at: null,
      ultimo_acceso_at: null,
      created_at: new Date().toISOString(),
      token_plano: 'demoorganizador123',
    }
  ],
  historial_rsvp: [],
  logs_mantenimiento: [
    {
      id: 'l1111111-1111-4111-8111-111111111111',
      tipo_tarea: 'mantenimiento_diario_caducidad_eliminacion',
      eventos_finalizados: 0,
      accesos_revocados: 0,
      eventos_eliminados: 0,
      eventos_retenidos: 0,
      detalles_tecnicos: { estado: 'Todo al día', verificado: true },
      error_mensaje: null,
      created_at: new Date().toISOString(),
    }
  ]
};

const STORAGE_KEY = 'plataforma_digital_mock_store_v1';

export function guardarMockStore(): void {
  if (typeof window !== 'undefined') {
    const jsonStr = JSON.stringify(mockStore);
    if (window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, jsonStr);
      } catch {}
    }
    // Sincronizar hacia el servidor Vite local para que cualquier celular en la red Wi-Fi lo reciba
    try {
      fetch('/api/mock-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr
      }).catch(() => {});
    } catch {}
  }
}

export function sincronizarMockStore(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed.clientes)) mockStore.clientes = parsed.clientes;
        if (Array.isArray(parsed.eventos)) mockStore.eventos = parsed.eventos;
        if (Array.isArray(parsed.invitados)) mockStore.invitados = parsed.invitados;
        if (Array.isArray(parsed.accesos_cliente)) mockStore.accesos_cliente = parsed.accesos_cliente;
        if (Array.isArray(parsed.historial_rsvp)) mockStore.historial_rsvp = parsed.historial_rsvp;
        if (Array.isArray(parsed.logs_mantenimiento)) mockStore.logs_mantenimiento = parsed.logs_mantenimiento;
      }
    } catch {}
  }
}

// Sincronización bidireccional con el servidor local para móviles
export async function sincronizarMockStoreServidor(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/mock-store');
    if (res.ok) {
      const parsed = await res.json();
      const localRaw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
      let localEventosCount = 0;
      if (localRaw) {
        try { localEventosCount = JSON.parse(localRaw).eventos?.length || 0; } catch {}
      }

      // Si el servidor tiene datos y no son menores que los de la PC local, los adoptamos
      if (parsed && Array.isArray(parsed.eventos) && parsed.eventos.length >= localEventosCount && parsed.eventos.length > 0) {
        if (Array.isArray(parsed.clientes)) mockStore.clientes = parsed.clientes;
        if (Array.isArray(parsed.eventos)) mockStore.eventos = parsed.eventos;
        if (Array.isArray(parsed.invitados)) mockStore.invitados = parsed.invitados;
        if (Array.isArray(parsed.accesos_cliente)) mockStore.accesos_cliente = parsed.accesos_cliente;
        if (Array.isArray(parsed.historial_rsvp)) mockStore.historial_rsvp = parsed.historial_rsvp;
        if (Array.isArray(parsed.logs_mantenimiento)) mockStore.logs_mantenimiento = parsed.logs_mantenimiento;
        if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStore));
        }
        return;
      }
    }
  } catch {}

  // Si la PC local tiene datos que el servidor no tiene aún, sincronizarlos al archivo del servidor
  try {
    const guardado = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (guardado) {
      await fetch('/api/mock-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: guardado
      });
    }
  } catch {}
}

// Inicializar sincronización
sincronizarMockStore();
if (typeof window !== 'undefined') {
  sincronizarMockStoreServidor();
}

// Funciones para mock de RPC
export function mockObtenerInvitacion(tokenHash: string): InvitacionPublicaData {
  sincronizarMockStore();

  // 1. Invitación General para todo el evento
  if (tokenHash.startsWith('general-') || tokenHash.startsWith('gen-')) {
    const eventoId = tokenHash.replace(/^general-|^gen-/, '');
    const evento = mockStore.eventos.find(e => e.id === eventoId);
    if (evento) {
      if (estaInvitacionCaducada(evento.fecha_caducidad_invitaciones)) {
        return { valido: false, caducado: true, mensaje: 'Este evento ha finalizado' };
      }

      // Verificar si este navegador/dispositivo ya registró asistencia en esta invitación general
      let rsvpPrevio: { nombre?: string; estado?: 'confirmado' | 'rechazado'; acompanantes?: number; respondido_at?: string } | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem('rsvp_completado_' + tokenHash);
          if (raw) rsvpPrevio = JSON.parse(raw);
        } catch {}
      }

      return {
        valido: true,
        caducado: false,
        rsvp_cerrado: estaRsvpCerrado(evento.fecha_limite_rsvp),
        es_general: true,
        invitado: {
          id: 'general-' + evento.id,
          nombre: rsvpPrevio?.nombre || 'Invitado(a) Especial',
          estado_rsvp: rsvpPrevio?.estado || 'pendiente',
          numero_acompanantes: rsvpPrevio?.acompanantes || 0,
          max_acompanantes_permitidos: 4,
          respondido_at: rsvpPrevio?.respondido_at || null,
        },
        evento: {
          id: evento.id,
          titulo: evento.titulo,
          tipo: evento.tipo,
          fecha_evento: evento.fecha_evento,
          zona_horaria: evento.zona_horaria,
          fecha_limite_rsvp: evento.fecha_limite_rsvp,
          ubicacion_nombre: evento.ubicacion_nombre,
          ubicacion_url: evento.ubicacion_url,
          indicaciones: evento.indicaciones,
          configuracion_diseno: evento.configuracion_diseno,
          estado: evento.estado,
        }
      };
    }
  }

  // 2. Invitación Individual con nombre específico
  const esDemo = tokenHash.includes('demoinvitado') || tokenHash === 'mocktokeninvitado123456hash';
  const invitado = mockStore.invitados.find(i => 
    i.activo && (
      i.token_hash === tokenHash || 
      i.token_plano === tokenHash ||
      (esDemo && i.token_plano === 'demoinvitado123456')
    )
  );

  if (!invitado) {
    return { valido: false, error: 'Invitación no válida o no encontrada' };
  }

  const evento = mockStore.eventos.find(e => e.id === invitado.evento_id);
  if (!evento || evento.estado === 'cancelado') {
    return { valido: false, error: 'El evento no se encuentra disponible' };
  }

  if (estaInvitacionCaducada(evento.fecha_caducidad_invitaciones)) {
    return {
      valido: false,
      caducado: true,
      mensaje: 'Este evento ha finalizado'
    };
  }

  return {
    valido: true,
    caducado: false,
    es_general: false,
    rsvp_cerrado: estaRsvpCerrado(evento.fecha_limite_rsvp),
    invitado: {
      id: invitado.id,
      nombre: invitado.nombre,
      estado_rsvp: invitado.estado_rsvp,
      numero_acompanantes: invitado.numero_acompanantes,
      max_acompanantes_permitidos: 4,
      respondido_at: invitado.respondido_at,
    },
    evento: {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      fecha_evento: evento.fecha_evento,
      zona_horaria: evento.zona_horaria,
      fecha_limite_rsvp: evento.fecha_limite_rsvp,
      ubicacion_nombre: evento.ubicacion_nombre,
      ubicacion_url: evento.ubicacion_url,
      indicaciones: evento.indicaciones,
      configuracion_diseno: evento.configuracion_diseno,
      estado: evento.estado,
    }
  };
}

export function mockRegistrarRsvp(
  tokenHash: string, 
  estado: 'confirmado' | 'rechazado', 
  acompanantes: number,
  nombreOpcional?: string
) {
  sincronizarMockStore();

  // Caso: Invitación General (crea el invitado en la lista de asistencia)
  if (tokenHash.startsWith('general-') || tokenHash.startsWith('gen-')) {
    const eventoId = tokenHash.replace(/^general-|^gen-/, '');
    const evento = mockStore.eventos.find(e => e.id === eventoId);
    if (!evento || estaInvitacionCaducada(evento.fecha_caducidad_invitaciones)) {
      return { success: false, error: 'El evento ha finalizado' };
    }
    if (estaRsvpCerrado(evento.fecha_limite_rsvp)) {
      return { success: false, error: 'El plazo para confirmar asistencia ha expirado' };
    }

    const finalAcomp = estado === 'rechazado' ? 0 : Math.min(Math.max(0, acompanantes), 4);
    const nuevo: Invitado = {
      id: 'i-gen-' + Date.now(),
      evento_id: evento.id,
      nombre: nombreOpcional?.trim() || 'Invitado(a) General',
      token_hash: 'hash-' + Date.now(),
      estado_rsvp: estado,
      numero_acompanantes: finalAcomp,
      max_acompanantes_permitidos: 4,
      respondido_at: new Date().toISOString(),
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockStore.invitados.push(nuevo);
    guardarMockStore();

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('rsvp_completado_' + tokenHash, JSON.stringify({
          nombre: nuevo.nombre,
          estado: nuevo.estado_rsvp,
          acompanantes: finalAcomp,
          respondido_at: nuevo.respondido_at
        }));
      } catch {}
    }

    return { success: true, estado_rsvp: estado, numero_acompanantes: finalAcomp, respondido_at: nuevo.respondido_at };
  }

  // Caso: Invitado Individual
  const esDemo = tokenHash.includes('demoinvitado') || tokenHash === 'mocktokeninvitado123456hash';
  const invitado = mockStore.invitados.find(i => 
    i.activo && (
      i.token_hash === tokenHash || 
      i.token_plano === tokenHash ||
      (esDemo && i.token_plano === 'demoinvitado123456')
    )
  );
  if (!invitado) return { success: false, error: 'Invitación no válida' };

  // Evitar duplicados: Si ya respondió, mantener su respuesta definitiva
  if (invitado.respondido_at) {
    return { 
      success: true, 
      estado_rsvp: invitado.estado_rsvp, 
      numero_acompanantes: invitado.numero_acompanantes, 
      respondido_at: invitado.respondido_at,
      ya_respondio: true 
    };
  }

  const evento = mockStore.eventos.find(e => e.id === invitado.evento_id);
  if (!evento || estaInvitacionCaducada(evento.fecha_caducidad_invitaciones)) {
    return { success: false, error: 'El evento ha finalizado' };
  }

  if (estaRsvpCerrado(evento.fecha_limite_rsvp)) {
    return { success: false, error: 'El plazo para confirmar asistencia ha expirado' };
  }

  const finalAcomp = estado === 'rechazado' ? 0 : Math.min(Math.max(0, acompanantes), 4);
  
  mockStore.historial_rsvp.push({
    id: 'h-' + Date.now(),
    invitado_id: invitado.id,
    estado_anterior: invitado.estado_rsvp,
    estado_nuevo: estado,
    numero_acompanantes: finalAcomp,
    created_at: new Date().toISOString()
  });

  invitado.estado_rsvp = estado;
  invitado.numero_acompanantes = finalAcomp;
  invitado.respondido_at = new Date().toISOString();
  invitado.updated_at = new Date().toISOString();
  guardarMockStore();

  return { success: true, estado_rsvp: estado, numero_acompanantes: finalAcomp, respondido_at: invitado.respondido_at };
}

export function mockObtenerPanelOrganizador(tokenHash: string): PanelOrganizadorData {
  sincronizarMockStore();
  const esDemo = tokenHash.includes('demoorganizador') || tokenHash === 'mocktokenorganizador123hash';
  const acceso = mockStore.accesos_cliente.find(a => 
    a.token_hash === tokenHash || 
    a.token_plano === tokenHash ||
    (esDemo && a.token_plano === 'demoorganizador123')
  );
  if (!acceso) {
    return { valido: false, error: 'Enlace privado no encontrado' };
  }

  if (acceso.revocado_at) {
    return { valido: false, revocado: true, error: 'Este enlace ha sido revocado' };
  }

  if (estaPanelOrganizadorExpirado(acceso.expira_at)) {
    return { valido: false, expirado: true, error: 'El enlace privado ha expirado (más de 30 días posteriores al evento)' };
  }

  acceso.ultimo_acceso_at = new Date().toISOString();
  const evento = mockStore.eventos.find(e => e.id === acceso.evento_id);
  if (!evento) return { valido: false, error: 'Evento no encontrado' };

  const invitadosEvento = mockStore.invitados.filter(i => i.evento_id === evento.id && i.activo);
  const confirmados = invitadosEvento.filter(i => i.estado_rsvp === 'confirmado');
  const totalAcomp = confirmados.reduce((acc, curr) => acc + (curr.numero_acompanantes || 0), 0);

  return {
    valido: true,
    evento: {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      fecha_evento: evento.fecha_evento,
      zona_horaria: evento.zona_horaria,
      fecha_limite_rsvp: evento.fecha_limite_rsvp,
      ubicacion_nombre: evento.ubicacion_nombre,
      ubicacion_url: evento.ubicacion_url,
      estado: evento.estado,
      expira_panel_at: acceso.expira_at,
    },
    metricas: {
      total_invitados: invitadosEvento.length,
      confirmados: confirmados.length,
      rechazados: invitadosEvento.filter(i => i.estado_rsvp === 'rechazado').length,
      pendientes: invitadosEvento.filter(i => i.estado_rsvp === 'pendiente').length,
      total_asistentes: confirmados.length + totalAcomp,
      total_acompanantes_confirmados: totalAcomp,
    },
    invitados: invitadosEvento.map(i => ({
      id: i.id,
      nombre: i.nombre,
      telefono: i.telefono,
      estado_rsvp: i.estado_rsvp,
      numero_acompanantes: i.numero_acompanantes,
      max_acompanantes_permitidos: i.max_acompanantes_permitidos,
      respondido_at: i.respondido_at,
    }))
  };
}

export function mockEjecutarMantenimiento() {
  const ahora = Date.now();
  let finalizados = 0;
  let revocados = 0;
  let eliminados = 0;
  let retenidos = 0;

  mockStore.eventos.forEach(e => {
    if (new Date(e.fecha_caducidad_invitaciones).getTime() < ahora && e.estado === 'publicado') {
      e.estado = 'finalizado';
      finalizados++;
    }

    if (new Date(e.fecha_eliminacion_datos).getTime() < ahora && e.estado_retencion !== 'eliminada') {
      if (e.estado_retencion === 'retencion_excepcional') {
        retenidos++;
      } else {
        // Eliminar datos
        mockStore.invitados = mockStore.invitados.filter(i => i.evento_id !== e.id);
        mockStore.accesos_cliente = mockStore.accesos_cliente.filter(a => a.evento_id !== e.id);
        e.estado_retencion = 'eliminada';
        e.datos_eliminados_at = new Date().toISOString();
        e.indicaciones = '[DATOS PERSONALES ELIMINADOS SEGÚN POLÍTICA DE PRIVACIDAD]';
        eliminados++;
      }
    }
  });

  mockStore.accesos_cliente.forEach(a => {
    if (new Date(a.expira_at).getTime() < ahora && !a.revocado_at) {
      a.revocado_at = new Date().toISOString();
      revocados++;
    }
  });

  const nuevoLog: LogMantenimiento = {
    id: 'log-' + Date.now(),
    tipo_tarea: 'mantenimiento_diario_caducidad_eliminacion',
    eventos_finalizados: finalizados,
    accesos_revocados: revocados,
    eventos_eliminados: eliminados,
    eventos_retenidos: retenidos,
    detalles_tecnicos: { motor: 'mock_simulator' },
    error_mensaje: null,
    created_at: new Date().toISOString()
  };

  mockStore.logs_mantenimiento.unshift(nuevoLog);
  return nuevoLog;
}

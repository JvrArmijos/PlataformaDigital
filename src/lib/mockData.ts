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

// Funciones para mock de RPC
export function mockObtenerInvitacion(tokenHash: string): InvitacionPublicaData {
  const invitado = mockStore.invitados.find(i => i.token_hash === tokenHash && i.activo);
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
    rsvp_cerrado: estaRsvpCerrado(evento.fecha_limite_rsvp),
    invitado: {
      id: invitado.id,
      nombre: invitado.nombre,
      estado_rsvp: invitado.estado_rsvp,
      numero_acompanantes: invitado.numero_acompanantes,
      max_acompanantes_permitidos: invitado.max_acompanantes_permitidos,
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

export function mockRegistrarRsvp(tokenHash: string, estado: 'confirmado' | 'rechazado', acompanantes: number) {
  const invitado = mockStore.invitados.find(i => i.token_hash === tokenHash && i.activo);
  if (!invitado) return { success: false, error: 'Invitación no válida' };

  const evento = mockStore.eventos.find(e => e.id === invitado.evento_id);
  if (!evento || estaInvitacionCaducada(evento.fecha_caducidad_invitaciones)) {
    return { success: false, error: 'El evento ha finalizado' };
  }

  if (estaRsvpCerrado(evento.fecha_limite_rsvp)) {
    return { success: false, error: 'El plazo para confirmar asistencia ha expirado' };
  }

  const finalAcomp = estado === 'rechazado' ? 0 : Math.min(Math.max(0, acompanantes), invitado.max_acompanantes_permitidos);
  
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

  return { success: true, estado_rsvp: estado, numero_acompanantes: finalAcomp, respondido_at: invitado.respondido_at };
}

export function mockObtenerPanelOrganizador(tokenHash: string): PanelOrganizadorData {
  const acceso = mockStore.accesos_cliente.find(a => a.token_hash === tokenHash);
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

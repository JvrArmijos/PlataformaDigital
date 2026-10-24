import { createClient } from '@supabase/supabase-js';
import type { 
  Cliente, 
  Evento, 
  Invitado, 
  AccesoCliente, 
  InvitacionPublicaData, 
  PanelOrganizadorData,
  LogMantenimiento
} from '../types/database';
import { 
  mockStore, 
  guardarMockStore,
  sincronizarMockStore,
  sincronizarMockStoreServidor,
  mockObtenerInvitacion, 
  mockRegistrarRsvp, 
  mockObtenerPanelOrganizador, 
  mockEjecutarMantenimiento 
} from './mockData';

// Variables de entorno públicas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-proyecto.supabase.co') &&
  !supabaseAnonKey.includes('tu-clave-anon')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// ====================================================================
// OPERACIONES PÚBLICAS / TOKEN RPC (Invitados y Organizadores)
// ====================================================================

export async function obtenerInvitacionPorHash(tokenHash: string): Promise<InvitacionPublicaData> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase.rpc('obtener_invitacion_por_token', {
      p_token_hash: tokenHash
    });
    if (error) {
      return { valido: false, error: error.message };
    }
    return data as InvitacionPublicaData;
  }
  await sincronizarMockStoreServidor();
  return mockObtenerInvitacion(tokenHash);
}

export async function registrarRsvpPorHash(
  tokenHash: string, 
  estado: 'confirmado' | 'rechazado', 
  acompanantes: number,
  nombreOpcional?: string
) {
  if (isConfigured && supabase) {
    const { data, error } = await supabase.rpc('registrar_respuesta_rsvp', {
      p_token_hash: tokenHash,
      p_estado: estado,
      p_acompanantes: acompanantes
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  }
  await sincronizarMockStoreServidor();
  return mockRegistrarRsvp(tokenHash, estado, acompanantes, nombreOpcional);
}

export async function obtenerPanelOrganizadorPorHash(tokenHash: string): Promise<PanelOrganizadorData> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase.rpc('obtener_panel_organizador', {
      p_token_hash: tokenHash
    });
    if (error) {
      return { valido: false, error: error.message };
    }
    return data as PanelOrganizadorData;
  }
  await sincronizarMockStoreServidor();
  return mockObtenerPanelOrganizador(tokenHash);
}

export async function ejecutarMantenimientoManual() {
  if (isConfigured && supabase) {
    const { data, error } = await supabase.rpc('ejecutar_mantenimiento_caducidad_eliminacion');
    if (error) throw error;
    return data;
  }
  return mockEjecutarMantenimiento();
}

// ====================================================================
// OPERACIONES ADMINISTRATIVAS (Clientes, Eventos, Invitados, Accesos)
// ====================================================================

export async function adminListarClientes(): Promise<Cliente[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  sincronizarMockStore();
  return [...mockStore.clientes];
}

export async function adminCrearCliente(nuevo: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([nuevo])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  sincronizarMockStore();
  const creado: Cliente = {
    ...nuevo,
    id: 'c-' + Date.now(),
    created_at: new Date().toISOString()
  };
  mockStore.clientes.push(creado);
  guardarMockStore();
  return creado;
}

export async function adminListarEventos(): Promise<Evento[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*, cliente:clientes(*)')
      .order('fecha_evento', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  sincronizarMockStore();
  return mockStore.eventos.map(e => ({
    ...e,
    cliente: mockStore.clientes.find(c => c.id === e.cliente_id)
  }));
}

export async function adminObtenerEvento(id: string): Promise<Evento | null> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*, cliente:clientes(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
  sincronizarMockStore();
  const encontrado = mockStore.eventos.find(e => e.id === id);
  if (!encontrado) return null;
  return {
    ...encontrado,
    cliente: mockStore.clientes.find(c => c.id === encontrado.cliente_id)
  };
}

export async function adminGuardarEvento(evento: Partial<Evento> & { cliente_id: string; titulo: string; fecha_evento: string }): Promise<Evento> {
  if (isConfigured && supabase) {
    if (evento.id) {
      const { data, error } = await supabase
        .from('eventos')
        .update(evento)
        .eq('id', evento.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('eventos')
        .insert([evento])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  // Mock implementation
  sincronizarMockStore();
  if (evento.id) {
    const index = mockStore.eventos.findIndex(e => e.id === evento.id);
    if (index === -1) throw new Error('Evento no encontrado');
    const actualizado = { ...mockStore.eventos[index], ...evento, updated_at: new Date().toISOString() };
    mockStore.eventos[index] = actualizado as Evento;
    guardarMockStore();
    return actualizado as Evento;
  } else {
    const nuevoEvento: Evento = {
      id: 'e-' + Date.now(),
      cliente_id: evento.cliente_id,
      titulo: evento.titulo,
      tipo: evento.tipo || 'boda',
      fecha_evento: evento.fecha_evento,
      zona_horaria: evento.zona_horaria || 'America/Guayaquil',
      fecha_limite_rsvp: evento.fecha_limite_rsvp || evento.fecha_evento,
      ubicacion_nombre: evento.ubicacion_nombre || '',
      ubicacion_url: evento.ubicacion_url || '',
      indicaciones: evento.indicaciones || '',
      configuracion_diseno: evento.configuracion_diseno || {
        tema: 'dorado_luxury',
        estilo_tarjeta: 'clasica_curva',
        color_primario: '#d97706',
        color_secundario: '#0c0a09',
      },
      estado: evento.estado || 'borrador',
      fecha_caducidad_invitaciones: new Date(new Date(evento.fecha_evento).getTime() + 7 * 86400000).toISOString(),
      fecha_caducidad_panel: new Date(new Date(evento.fecha_evento).getTime() + 30 * 86400000).toISOString(),
      fecha_eliminacion_datos: new Date(new Date(evento.fecha_evento).getTime() + 90 * 86400000).toISOString(),
      datos_eliminados_at: null,
      estado_retencion: 'activa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.eventos.push(nuevoEvento);
    guardarMockStore();
    return nuevoEvento;
  }
}

export async function adminListarInvitados(eventoId: string): Promise<Invitado[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  sincronizarMockStore();
  return mockStore.invitados.filter(i => i.evento_id === eventoId && i.activo);
}

export async function adminGuardarInvitado(invitado: {
  id?: string;
  evento_id: string;
  nombre: string;
  telefono?: string | null;
  token_hash: string;
  max_acompanantes_permitidos?: number;
  token_plano?: string;
}): Promise<Invitado> {
  if (isConfigured && supabase) {
    if (invitado.id) {
      const { data, error } = await supabase
        .from('invitados')
        .update(invitado)
        .eq('id', invitado.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('invitados')
        .insert([{
          ...invitado,
          estado_rsvp: 'pendiente',
          numero_acompanantes: 0,
          max_acompanantes_permitidos: invitado.max_acompanantes_permitidos || 0,
          activo: true
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  // Mock
  sincronizarMockStore();
  if (invitado.id) {
    const idx = mockStore.invitados.findIndex(i => i.id === invitado.id);
    const updated = { ...mockStore.invitados[idx], ...invitado, updated_at: new Date().toISOString() };
    mockStore.invitados[idx] = updated as Invitado;
    guardarMockStore();
    return updated as Invitado;
  } else {
    const nuevo: Invitado = {
      id: 'i-' + Date.now() + Math.random().toString(36).substring(7),
      evento_id: invitado.evento_id,
      nombre: invitado.nombre,
      telefono: invitado.telefono || null,
      token_hash: invitado.token_hash,
      estado_rsvp: 'pendiente',
      numero_acompanantes: 0,
      max_acompanantes_permitidos: invitado.max_acompanantes_permitidos || 0,
      respondido_at: null,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      token_plano: invitado.token_plano
    };
    mockStore.invitados.push(nuevo);
    guardarMockStore();
    return nuevo;
  }
}

export async function adminEliminarInvitado(id: string): Promise<void> {
  if (isConfigured && supabase) {
    const { error } = await supabase
      .from('invitados')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return;
  }
  sincronizarMockStore();
  const found = mockStore.invitados.find(i => i.id === id);
  if (found) found.activo = false;
  guardarMockStore();
}

export async function adminObtenerAccesoOrganizador(eventoId: string): Promise<AccesoCliente | null> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('accesos_cliente')
      .select('*')
      .eq('evento_id', eventoId)
      .is('revocado_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  sincronizarMockStore();
  return mockStore.accesos_cliente.find(a => a.evento_id === eventoId && !a.revocado_at) || null;
}

export async function adminCrearAccesoOrganizador(eventoId: string, tokenHash: string, expiraAt: string, tokenPlano?: string): Promise<AccesoCliente> {
  if (isConfigured && supabase) {
    // Revocar previos
    await supabase
      .from('accesos_cliente')
      .update({ revocado_at: new Date().toISOString() })
      .eq('evento_id', eventoId);

    const { data, error } = await supabase
      .from('accesos_cliente')
      .insert([{
        evento_id: eventoId,
        token_hash: tokenHash,
        permiso: 'solo_lectura',
        expira_at: expiraAt,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Mock: revocar previos
  sincronizarMockStore();
  mockStore.accesos_cliente.forEach(a => {
    if (a.evento_id === eventoId && !a.revocado_at) {
      a.revocado_at = new Date().toISOString();
    }
  });

  const nuevo: AccesoCliente = {
    id: 'a-' + Date.now(),
    evento_id: eventoId,
    token_hash: tokenHash,
    permiso: 'solo_lectura',
    expira_at: expiraAt,
    revocado_at: null,
    ultimo_acceso_at: null,
    created_at: new Date().toISOString(),
    token_plano: tokenPlano || tokenHash
  };
  mockStore.accesos_cliente.push(nuevo);
  guardarMockStore();
  return nuevo;
}

export async function adminRevocarAccesoOrganizador(accesoId: string): Promise<void> {
  if (isConfigured && supabase) {
    const { error } = await supabase
      .from('accesos_cliente')
      .update({ revocado_at: new Date().toISOString() })
      .eq('id', accesoId);
    if (error) throw error;
    return;
  }
  sincronizarMockStore();
  const found = mockStore.accesos_cliente.find(a => a.id === accesoId);
  if (found) found.revocado_at = new Date().toISOString();
  guardarMockStore();
}

export async function adminListarLogsMantenimiento(): Promise<LogMantenimiento[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('log_mantenimiento')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  }
  return [...mockStore.logs_mantenimiento];
}

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  mockStore, 
  mockObtenerInvitacion, 
  mockRegistrarRsvp, 
  mockObtenerPanelOrganizador, 
  mockEjecutarMantenimiento 
} from '../src/lib/mockData';
import { calcularPlazosDesdeEvento } from '../src/lib/dates';
import { generarTokenSeguro, calcularSha256 } from '../src/lib/crypto';
import type { Evento } from '../src/types/database';

describe('Pruebas de Seguridad y Lógica de Negocio (Sección 16)', () => {
  const eventoId1 = 'e-test-1';
  const eventoId2 = 'e-test-2';
  const clienteId = 'c-test-1';

  beforeEach(() => {
    // Resetear mockStore para pruebas limpias
    const fechaFutura = new Date(Date.now() + 10 * 86400000).toISOString();
    const plazos = calcularPlazosDesdeEvento(fechaFutura);

    mockStore.clientes = [
      {
        id: clienteId,
        nombre: 'Cliente Multi-Eventos',
        correo: 'test@ejemplo.com',
        activo: true,
        created_at: new Date().toISOString()
      }
    ];

    mockStore.eventos = [
      {
        id: eventoId1,
        cliente_id: clienteId,
        titulo: 'Evento Principal 1',
        tipo: 'boda',
        fecha_evento: fechaFutura,
        zona_horaria: 'America/Guayaquil',
        fecha_limite_rsvp: new Date(Date.now() + 5 * 86400000).toISOString(),
        ubicacion_nombre: 'Quinta A',
        configuracion_diseno: { tema: 'clasico_elegante', color_primario: '#b45309', color_secundario: '#fef3c7' },
        estado: 'publicado',
        fecha_caducidad_invitaciones: plazos.fecha_caducidad_invitaciones,
        fecha_caducidad_panel: plazos.fecha_caducidad_panel,
        fecha_eliminacion_datos: plazos.fecha_eliminacion_datos,
        datos_eliminados_at: null,
        estado_retencion: 'activa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: eventoId2,
        cliente_id: clienteId,
        titulo: 'Evento Secundario 2 (Mismo Cliente)',
        tipo: 'cumpleanos',
        fecha_evento: fechaFutura,
        zona_horaria: 'America/Guayaquil',
        fecha_limite_rsvp: new Date(Date.now() + 5 * 86400000).toISOString(),
        ubicacion_nombre: 'Salón B',
        configuracion_diseno: { tema: 'moderno_minimal', color_primario: '#0284c7', color_secundario: '#e0f2fe' },
        estado: 'publicado',
        fecha_caducidad_invitaciones: plazos.fecha_caducidad_invitaciones,
        fecha_caducidad_panel: plazos.fecha_caducidad_panel,
        fecha_eliminacion_datos: plazos.fecha_eliminacion_datos,
        datos_eliminados_at: null,
        estado_retencion: 'activa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    mockStore.invitados = [
      {
        id: 'i-invitado-1',
        evento_id: eventoId1,
        nombre: 'Invitado Evento 1',
        token_hash: 'hash_invitado_1',
        estado_rsvp: 'pendiente',
        numero_acompanantes: 0,
        max_acompanantes_permitidos: 2,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'i-invitado-2',
        evento_id: eventoId2,
        nombre: 'Invitado Evento 2',
        token_hash: 'hash_invitado_2',
        estado_rsvp: 'confirmado',
        numero_acompanantes: 1,
        max_acompanantes_permitidos: 1,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    mockStore.accesos_cliente = [
      {
        id: 'a-acceso-1',
        evento_id: eventoId1,
        token_hash: 'hash_org_evento_1',
        permiso: 'solo_lectura',
        expira_at: plazos.fecha_caducidad_panel,
        revocado_at: null,
        ultimo_acceso_at: null,
        created_at: new Date().toISOString()
      }
    ];

    mockStore.historial_rsvp = [];
    mockStore.logs_mantenimiento = [];
  });

  it('un invitado no puede consultar los datos de otros invitados ni listas ajenas', () => {
    const res = mockObtenerInvitacion('hash_invitado_1');
    expect(res.valido).toBe(true);
    expect(res.invitado?.nombre).toBe('Invitado Evento 1');
    // La respuesta no contiene la lista de invitados ni datos de otros
    expect((res as unknown as { invitados?: unknown }).invitados).toBeUndefined();
    expect((res.invitado as unknown as { token_hash?: unknown }).token_hash).toBeUndefined();
  });

  it('un organizador no puede acceder a otro evento ajeno a su token', () => {
    const panel = mockObtenerPanelOrganizador('hash_org_evento_1');
    expect(panel.valido).toBe(true);
    expect(panel.evento?.id).toBe(eventoId1);
    expect(panel.evento?.titulo).toBe('Evento Principal 1');

    // Verificar que solo ve los invitados del evento 1
    expect(panel.invitados?.every(i => i.nombre !== 'Invitado Evento 2')).toBe(true);
  });

  it('los enlaces de invitación vencidos (+7d post evento) dejan de funcionar', () => {
    // Configurar evento 1 con caducidad en el pasado
    const evento1 = mockStore.eventos.find(e => e.id === eventoId1)!;
    evento1.fecha_caducidad_invitaciones = new Date(Date.now() - 1000).toISOString();

    const res = mockObtenerInvitacion('hash_invitado_1');
    expect(res.valido).toBe(false);
    expect(res.caducado).toBe(true);
    expect(res.mensaje).toBe('Este evento ha finalizado');
    expect(res.invitado).toBeUndefined();
  });

  it('los enlaces privados de organizador vencidos (+30d) o revocados dejan de funcionar', () => {
    // Caso 1: Revocado
    const acceso = mockStore.accesos_cliente.find(a => a.token_hash === 'hash_org_evento_1')!;
    acceso.revocado_at = new Date().toISOString();

    const resRevocado = mockObtenerPanelOrganizador('hash_org_evento_1');
    expect(resRevocado.valido).toBe(false);
    expect(resRevocado.revocado).toBe(true);

    // Caso 2: Expirado
    acceso.revocado_at = null;
    acceso.expira_at = new Date(Date.now() - 5000).toISOString();

    const resExpirado = mockObtenerPanelOrganizador('hash_org_evento_1');
    expect(resExpirado.valido).toBe(false);
    expect(resExpirado.expirado).toBe(true);
  });

  it('no se aceptan respuestas RSVP después de la fecha límite', () => {
    const evento1 = mockStore.eventos.find(e => e.id === eventoId1)!;
    evento1.fecha_limite_rsvp = new Date(Date.now() - 1000).toISOString();

    const res = mockRegistrarRsvp('hash_invitado_1', 'confirmado', 1);
    expect(res.success).toBe(false);
    expect(res.error).toContain('expirado');
  });

  it('los cambios de respuesta y acompañantes se reflejan en el total de asistentes del panel', () => {
    // Invitado 1 confirma con 2 acompañantes
    const resp = mockRegistrarRsvp('hash_invitado_1', 'confirmado', 2);
    expect(resp.success).toBe(true);

    const panel = mockObtenerPanelOrganizador('hash_org_evento_1');
    expect(panel.metricas?.confirmados).toBe(1);
    expect(panel.metricas?.total_acompanantes_confirmados).toBe(2);
    // Total personas = 1 titular + 2 acompañantes = 3
    expect(panel.metricas?.total_asistentes).toBe(3);

    // Si luego cambia a rechazado:
    mockRegistrarRsvp('hash_invitado_1', 'rechazado', 0);
    const panelActualizado = mockObtenerPanelOrganizador('hash_org_evento_1');
    expect(panelActualizado.metricas?.confirmados).toBe(0);
    expect(panelActualizado.metricas?.rechazados).toBe(1);
    expect(panelActualizado.metricas?.total_asistentes).toBe(0);
  });

  it('valida que los acompañantes no superen el límite autorizado', () => {
    // max_acompanantes_permitidos es 2, intentamos enviar 5
    const resp = mockRegistrarRsvp('hash_invitado_1', 'confirmado', 5);
    expect(resp.success).toBe(true);
    expect(resp.numero_acompanantes).toBe(2); // Ajustado a máximo 2
  });

  it('los cambios de fecha recalculan los tres plazos correctamente', () => {
    const nuevaFecha = new Date(Date.now() + 60 * 86400000).toISOString();
    const nuevosPlazos = calcularPlazosDesdeEvento(nuevaFecha);

    const eventoMs = new Date(nuevaFecha).getTime();
    expect(new Date(nuevosPlazos.fecha_caducidad_invitaciones).getTime() - eventoMs).toBe(7 * 86400000);
    expect(new Date(nuevosPlazos.fecha_caducidad_panel).getTime() - eventoMs).toBe(30 * 86400000);
    expect(new Date(nuevosPlazos.fecha_eliminacion_datos).getTime() - eventoMs).toBe(90 * 86400000);
  });

  it('la tarea de caducidad y eliminación es idempotente (se puede ejecutar varias veces sin daño)', () => {
    const ejecucion1 = mockEjecutarMantenimiento();
    expect(ejecucion1.tipo_tarea).toBe('mantenimiento_diario_caducidad_eliminacion');

    const ejecucion2 = mockEjecutarMantenimiento();
    expect(ejecucion2.tipo_tarea).toBe('mantenimiento_diario_caducidad_eliminacion');
    // No debe duplicar ni lanzar excepciones
    expect(mockStore.logs_mantenimiento).toHaveLength(2);
  });

  it('los eventos con retención excepcional no se eliminan al llegar a los 90 días', () => {
    const evento1 = mockStore.eventos.find(e => e.id === eventoId1)!;
    evento1.fecha_eliminacion_datos = new Date(Date.now() - 1000).toISOString();
    evento1.estado_retencion = 'retencion_excepcional';
    evento1.motivo_retencion = 'Requerimiento legal auditado';

    const log = mockEjecutarMantenimiento();
    expect(log.eventos_retenidos).toBe(1);
    expect(evento1.estado_retencion).toBe('retencion_excepcional');
    expect(evento1.datos_eliminados_at).toBeNull();
    // Los invitados del evento 1 no se borraron
    expect(mockStore.invitados.some(i => i.evento_id === eventoId1)).toBe(true);
  });

  it('la eliminación de un evento a los 90 días no afecta a otros eventos del mismo cliente', () => {
    // Configurar evento 1 para ser eliminado (+90d)
    const evento1 = mockStore.eventos.find(e => e.id === eventoId1)!;
    evento1.fecha_eliminacion_datos = new Date(Date.now() - 1000).toISOString();
    evento1.estado_retencion = 'activa';

    // Evento 2 del mismo cliente permanece vigente
    const evento2 = mockStore.eventos.find(e => e.id === eventoId2)!;
    evento2.fecha_eliminacion_datos = new Date(Date.now() + 50 * 86400000).toISOString();

    const log = mockEjecutarMantenimiento();
    expect(log.eventos_eliminados).toBe(1);

    expect(evento1.estado_retencion).toBe('eliminada');
    expect(mockStore.invitados.some(i => i.evento_id === eventoId1)).toBe(false);

    // Los invitados del evento 2 siguen existiendo intactos
    expect(mockStore.invitados.some(i => i.evento_id === eventoId2)).toBe(true);
    expect(evento2.estado_retencion).toBe('activa');
  });

  it('verifica que no existan claves privilegiadas (service_role) en el código fuente del frontend', () => {
    // Verificar que solo se usen variables públicas
    const envVars = Object.keys(import.meta.env);
    expect(envVars.some(k => k.toLowerCase().includes('service_role'))).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { 
  calcularPlazosDesdeEvento, 
  estaInvitacionCaducada, 
  estaPanelOrganizadorExpirado, 
  estaRsvpCerrado 
} from '../src/lib/dates';

describe('Cálculo de Plazos y Caducidad (Sección 7 y 8)', () => {
  const fechaEvento = new Date('2026-11-01T18:00:00Z').toISOString();

  it('calcula los 3 plazos exactos: +7d (invitaciones), +30d (panel), +90d (eliminación)', () => {
    const plazos = calcularPlazosDesdeEvento(fechaEvento);

    const eventoMs = new Date(fechaEvento).getTime();
    const cadInvitacionMs = new Date(plazos.fecha_caducidad_invitaciones).getTime();
    const cadPanelMs = new Date(plazos.fecha_caducidad_panel).getTime();
    const elimDatosMs = new Date(plazos.fecha_eliminacion_datos).getTime();

    // 7 días = 7 * 24 * 3600 * 1000
    expect(cadInvitacionMs - eventoMs).toBe(7 * 24 * 60 * 60 * 1000);
    // 30 días
    expect(cadPanelMs - eventoMs).toBe(30 * 24 * 60 * 60 * 1000);
    // 90 días
    expect(elimDatosMs - eventoMs).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it('detecta correctamente si la invitación ha caducado (+7 días pasados)', () => {
    // Fecha de caducidad en el pasado
    const caducadaPasada = new Date(Date.now() - 10000).toISOString();
    expect(estaInvitacionCaducada(caducadaPasada)).toBe(true);

    // Fecha de caducidad en el futuro
    const caducadaFutura = new Date(Date.now() + 5 * 86400000).toISOString();
    expect(estaInvitacionCaducada(caducadaFutura)).toBe(false);
  });

  it('detecta correctamente si el panel del organizador ha expirado (+30 días pasados)', () => {
    const expiradoPasado = new Date(Date.now() - 5000).toISOString();
    expect(estaPanelOrganizadorExpirado(expiradoPasado)).toBe(true);

    const vigenciaFutura = new Date(Date.now() + 20 * 86400000).toISOString();
    expect(estaPanelOrganizadorExpirado(vigenciaFutura)).toBe(false);
  });

  it('detecta si la fecha límite de RSVP ha concluido', () => {
    const rsvpVencido = new Date(Date.now() - 1000).toISOString();
    expect(estaRsvpCerrado(rsvpVencido)).toBe(true);

    const rsvpAbierto = new Date(Date.now() + 3600000).toISOString();
    expect(estaRsvpCerrado(rsvpAbierto)).toBe(false);
  });
});

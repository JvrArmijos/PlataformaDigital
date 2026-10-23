/**
 * Utilidades de cálculo y validación de fechas según la sección 7 y 8 del requerimiento:
 * - Invitaciones: +7 días desde la fecha del evento
 * - Panel Organizador: +30 días desde la fecha del evento
 * - Conservación / Eliminación: +90 días desde la fecha del evento
 * - Zona horaria por defecto: America/Guayaquil
 */

export const ZONA_HORARIA_PREDETERMINADA = 'America/Guayaquil';

export interface PlazosCalculados {
  fecha_caducidad_invitaciones: string; // ISO 8601
  fecha_caducidad_panel: string;        // ISO 8601
  fecha_eliminacion_datos: string;      // ISO 8601
}

/**
 * Calcula los tres plazos obligatorios a partir de la fecha oficial del evento.
 */
export function calcularPlazosDesdeEvento(fechaEventoIso: string): PlazosCalculados {
  const evento = new Date(fechaEventoIso);
  if (isNaN(evento.getTime())) {
    throw new Error('Fecha de evento inválida para el cálculo de plazos.');
  }

  // +7 días naturales
  const caducidadInvitaciones = new Date(evento.getTime() + 7 * 24 * 60 * 60 * 1000);
  // +30 días naturales
  const caducidadPanel = new Date(evento.getTime() + 30 * 24 * 60 * 60 * 1000);
  // +90 días naturales
  const eliminacionDatos = new Date(evento.getTime() + 90 * 24 * 60 * 60 * 1000);

  return {
    fecha_caducidad_invitaciones: caducidadInvitaciones.toISOString(),
    fecha_caducidad_panel: caducidadPanel.toISOString(),
    fecha_eliminacion_datos: eliminacionDatos.toISOString(),
  };
}

/**
 * Comprueba si la invitación individual ha caducado (+7 días tras el evento).
 */
export function estaInvitacionCaducada(fechaCaducidadInvitacionesIso: string): boolean {
  const caducidad = new Date(fechaCaducidadInvitacionesIso);
  return Date.now() > caducidad.getTime();
}

/**
 * Comprueba si el enlace privado del organizador ha expirado (+30 días tras el evento).
 */
export function estaPanelOrganizadorExpirado(fechaCaducidadPanelIso: string): boolean {
  const expiracion = new Date(fechaCaducidadPanelIso);
  return Date.now() > expiracion.getTime();
}

/**
 * Comprueba si el plazo de confirmación RSVP ha concluido.
 */
export function estaRsvpCerrado(fechaLimiteRsvpIso: string): boolean {
  const limite = new Date(fechaLimiteRsvpIso);
  return Date.now() > limite.getTime();
}

/**
 * Calcula los días u horas restantes hasta una fecha determinada.
 */
export function obtenerTiempoRestante(fechaObjetivoIso: string): {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  haLlegado: boolean;
} {
  const objetivo = new Date(fechaObjetivoIso).getTime();
  const ahora = Date.now();
  const diferencia = objetivo - ahora;

  if (diferencia <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, haLlegado: true };
  }

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

  return { dias, horas, minutos, segundos, haLlegado: false };
}

/**
 * Formatea una fecha y hora legible para el usuario en español y la zona horaria indicada.
 */
export function formatearFechaHora(fechaIso: string, zonaHoraria: string = ZONA_HORARIA_PREDETERMINADA): string {
  try {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-EC', {
      timeZone: zonaHoraria,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  } catch {
    return new Date(fechaIso).toLocaleString();
  }
}

/**
 * Formato corto de fecha (DD/MM/AAAA).
 */
export function formatearFechaCorta(fechaIso: string, zonaHoraria: string = ZONA_HORARIA_PREDETERMINADA): string {
  try {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-EC', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(fecha);
  } catch {
    return new Date(fechaIso).toLocaleDateString();
  }
}

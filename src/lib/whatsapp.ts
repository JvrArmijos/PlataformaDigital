/**
 * Generador de enlaces manuales para WhatsApp según sección 11 (Método B).
 * No utiliza servicios de pago; genera enlaces 'https://wa.me/...' con texto URI encoded
 * para revisión y envío manual por parte del administrador.
 */

export interface MensajeWhatsAppParams {
  nombreInvitado: string;
  tituloEvento: string;
  fechaEventoLegible: string;
  ubicacionNombre: string;
  enlaceInvitacion: string;
  telefonoDestino?: string | null;
}

/**
 * Limpia y normaliza el número de teléfono para WhatsApp (ej. '0991234567' -> '593991234567' si es Ecuador, o quita signos).
 */
export function normalizarTelefonoWhatsApp(telefono?: string | null): string {
  if (!telefono) return '';
  const soloDigitos = telefono.replace(/\D/g, '');
  return soloDigitos;
}

/**
 * Genera el texto del mensaje personalizado y el enlace directo de WhatsApp.
 */
export function generarMensajeWhatsApp(params: MensajeWhatsAppParams): {
  textoMensaje: string;
  enlaceWhatsApp: string;
} {
  const {
    nombreInvitado,
    tituloEvento,
    fechaEventoLegible,
    ubicacionNombre,
    enlaceInvitacion,
    telefonoDestino,
  } = params;

  const textoMensaje = 
`¡Hola ${nombreInvitado}! ✨

Tenemos el honor de invitarte a nuestro evento especial:
💍 *${tituloEvento}*

📅 *Fecha:* ${fechaEventoLegible}
📍 *Lugar:* ${ubicacionNombre}

Por favor, ingresa a tu invitación digital personalizada para conocer todos los detalles y confirmar tu asistencia:
👉 ${enlaceInvitacion}

¡Esperamos contar con tu presencia!`;

  const textoCodificado = encodeURIComponent(textoMensaje);
  const numeroLimpio = normalizarTelefonoWhatsApp(telefonoDestino);

  const enlaceWhatsApp = numeroLimpio
    ? `https://wa.me/${numeroLimpio}?text=${textoCodificado}`
    : `https://wa.me/?text=${textoCodificado}`;

  return {
    textoMensaje,
    enlaceWhatsApp,
  };
}

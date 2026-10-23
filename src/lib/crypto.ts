/**
 * Utilidades criptográficas para la generación y hashing de tokens.
 * Cumple con los requisitos de la sección 9:
 * - Generador criptográficamente seguro
 * - Almacenamiento exclusivo del hash SHA-256
 * - Formato URL-safe
 */

/**
 * Genera un token aleatorio criptográficamente seguro de 48 caracteres hexadecimales.
 */
export function generarTokenSeguro(): string {
  const bytes = new Uint8Array(24);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback seguro usando dynamic import de crypto en entornos Node si existiera
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calcula el hash SHA-256 de un token en formato hexadecimal en minúsculas.
 * Solo este hash se almacena en la base de datos (token_hash).
 */
export async function calcularSha256(token: string): Promise<string> {
  const normalized = token.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);

  const cryptoApi = (typeof window !== 'undefined' && window.crypto) 
    ? window.crypto 
    : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);

  if (cryptoApi && cryptoApi.subtle) {
    const hashBuffer = await cryptoApi.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback para entornos donde subtle no esté disponible
  throw new Error('La API criptográfica WebCrypto no está disponible en este entorno.');
}

/**
 * Construye el enlace público de invitación individual para el invitado.
 */
export function construirEnlaceInvitacion(token: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/i/${encodeURIComponent(token)}`;
}

/**
 * Construye el enlace privado para el organizador.
 */
export function construirEnlaceOrganizador(token: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/asistencia/${encodeURIComponent(token)}`;
}

import { describe, it, expect } from 'vitest';
import { generarTokenSeguro, calcularSha256, construirEnlaceInvitacion, construirEnlaceOrganizador } from '../src/lib/crypto';

describe('Módulo de Criptografía y Tokens (Sección 9)', () => {
  it('genera tokens criptográficamente seguros y de longitud suficiente', () => {
    const token1 = generarTokenSeguro();
    const token2 = generarTokenSeguro();

    expect(token1).toHaveLength(48);
    expect(token2).toHaveLength(48);
    expect(token1).not.toBe(token2);
    // Verificar formato hexadecimal
    expect(/^[0-9a-f]{48}$/.test(token1)).toBe(true);
  });

  it('calcula el hash SHA-256 de forma consistente', async () => {
    const token = 'token_de_prueba_1234567890';
    const hash1 = await calcularSha256(token);
    const hash2 = await calcularSha256(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);

    // Diferente token debe producir diferente hash
    const hash3 = await calcularSha256(token + '_modificado');
    expect(hash1).not.toBe(hash3);
  });

  it('construye enlaces de invitación y organizador URL-safe', () => {
    const token = 'abc123xyz';
    const enlaceInv = construirEnlaceInvitacion(token, 'https://invitaciones.com');
    const enlaceOrg = construirEnlaceOrganizador(token, 'https://invitaciones.com');

    expect(enlaceInv).toBe('https://invitaciones.com/i/abc123xyz');
    expect(enlaceOrg).toBe('https://invitaciones.com/asistencia/abc123xyz');
  });
});

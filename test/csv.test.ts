import { describe, it, expect } from 'vitest';
import { sanitizarCeldaCSV, parsearCSVInvitados } from '../src/lib/csv';

describe('Exportación e Importación CSV y Protección Anti-Inyección (Sección 11 y 13)', () => {
  it('sanitiza celdas para prevenir inyección de fórmulas de hojas de cálculo', () => {
    // Si inicia con =, +, -, @, debe ser neutralizado con una comilla simple
    expect(sanitizarCeldaCSV('=1+2')).toBe(`"'=1+2"`);
    expect(sanitizarCeldaCSV('+cmd|')).toBe(`"'+cmd|"`);
    expect(sanitizarCeldaCSV('-2+5')).toBe(`"'-2+5"`);
    expect(sanitizarCeldaCSV('@SUM(A1:A5)')).toBe(`"'@SUM(A1:A5)"`);

    // Escapado de comillas
    expect(sanitizarCeldaCSV('Hola "Mundo"')).toBe(`"Hola ""Mundo"""`);
  });

  it('parsea correctamente cadenas CSV de invitados', () => {
    const rawCSV = `Nombre, Teléfono, Acompañantes
Carlos Valencia, 0991234567, 1
"Elena Paredes, Dra.", 0987654321, 2
Solo Nombre`;

    const res = parsearCSVInvitados(rawCSV);
    expect(res).toHaveLength(3);

    expect(res[0].nombre).toBe('Carlos Valencia');
    expect(res[0].telefono).toBe('0991234567');
    expect(res[0].max_acompanantes).toBe(1);

    expect(res[1].nombre).toBe('Elena Paredes, Dra.');
    expect(res[1].telefono).toBe('0987654321');
    expect(res[1].max_acompanantes).toBe(2);

    expect(res[2].nombre).toBe('Solo Nombre');
    expect(res[2].max_acompanantes).toBe(0);
  });
});

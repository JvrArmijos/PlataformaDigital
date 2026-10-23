/**
 * Utilidades para exportación e importación segura de CSV.
 * Previene vulnerabilidades de Inyección de Fórmulas CSV (Formula Injection).
 */

/**
 * Sanitiza un valor para evitar ejecución de fórmulas en hojas de cálculo (Excel, LibreOffice, Google Sheets).
 */
export function sanitizarCeldaCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return '""';
  let str = String(valor).trim();

  // Si comienza con caracteres peligrosos que inician fórmulas (=, +, -, @, tab, cr), anteponer comilla simple
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapar comillas dobles existentes duplicándolas
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Genera un archivo CSV descargable en el navegador.
 */
export function descargarArchivoCSV(contenido: string, nombreArchivo: string): void {
  // BOM UTF-8 (\uFEFF) para que Excel abra correctamente caracteres acentuados y eñes
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera el reporte CSV de asistencia exclusivo para el Organizador.
 * No expone tokens ni datos de otros eventos.
 */
export function exportarAsistenciaOrganizadorCSV(
  tituloEvento: string,
  invitados: Array<{
    nombre: string;
    telefono?: string | null;
    estado_rsvp: string;
    numero_acompanantes: number;
    respondido_at?: string | null;
  }>
): void {
  const encabezados = ['Nombre del Invitado', 'Teléfono', 'Estado RSVP', 'Acompañantes Confirmados', 'Total Asistentes', 'Fecha de Respuesta'];
  
  const filas = invitados.map(inv => {
    const total = inv.estado_rsvp === 'confirmado' ? (1 + (inv.numero_acompanantes || 0)) : 0;
    const fecha = inv.respondido_at ? new Date(inv.respondido_at).toLocaleString() : 'Sin respuesta';
    return [
      sanitizarCeldaCSV(inv.nombre),
      sanitizarCeldaCSV(inv.telefono || 'N/A'),
      sanitizarCeldaCSV(inv.estado_rsvp.toUpperCase()),
      sanitizarCeldaCSV(inv.estado_rsvp === 'confirmado' ? inv.numero_acompanantes : 0),
      sanitizarCeldaCSV(total),
      sanitizarCeldaCSV(fecha)
    ].join(',');
  });

  const contenido = [encabezados.join(','), ...filas].join('\r\n');
  const nombreLimpio = tituloEvento.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  descargarArchivoCSV(contenido, `asistencia_${nombreLimpio}_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Genera el reporte administrativo de invitados con sus enlaces individuales de invitación.
 */
export function exportarEnlacesInvitacionesAdminCSV(
  tituloEvento: string,
  invitadosConEnlace: Array<{
    nombre: string;
    telefono?: string | null;
    estado_rsvp: string;
    max_acompanantes: number;
    enlace: string;
  }>
): void {
  const encabezados = ['Nombre', 'Teléfono', 'Acompañantes Permitidos', 'Estado RSVP', 'Enlace de Invitación Individual'];
  
  const filas = invitadosConEnlace.map(inv => [
    sanitizarCeldaCSV(inv.nombre),
    sanitizarCeldaCSV(inv.telefono || ''),
    sanitizarCeldaCSV(inv.max_acompanantes),
    sanitizarCeldaCSV(inv.estado_rsvp),
    sanitizarCeldaCSV(inv.enlace)
  ].join(','));

  const contenido = [encabezados.join(','), ...filas].join('\r\n');
  const nombreLimpio = tituloEvento.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  descargarArchivoCSV(contenido, `enlaces_invitados_${nombreLimpio}.csv`);
}

/**
 * Parsea un texto CSV para importación de invitados por lotes.
 * Formato esperado en el encabezado o líneas:
 * Nombre, Teléfono (opcional), Acompañantes Permitidos (opcional)
 */
export function parsearCSVInvitados(textoCSV: string): Array<{
  nombre: string;
  telefono: string;
  max_acompanantes: number;
}> {
  const lineas = textoCSV
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lineas.length === 0) return [];

  const resultado: Array<{ nombre: string; telefono: string; max_acompanantes: number }> = [];

  // Omitir encabezado si existe
  const primeraLinea = lineas[0].toLowerCase();
  const tieneEncabezado = primeraLinea.includes('nombre') || primeraLinea.includes('name');
  const inicio = tieneEncabezado ? 1 : 0;

  for (let i = inicio; i < lineas.length; i++) {
    // Parser simple de CSV que respeta comillas
    const fila = parsearLineaCSV(lineas[i]);
    if (fila.length > 0 && fila[0].trim()) {
      const nombre = fila[0].trim();
      const telefono = fila.length > 1 ? fila[1].trim() : '';
      const rawAcomp = fila.length > 2 ? parseInt(fila[2].trim(), 10) : 0;
      const max_acompanantes = isNaN(rawAcomp) || rawAcomp < 0 ? 0 : rawAcomp;

      resultado.push({ nombre, telefono, max_acompanantes });
    }
  }

  return resultado;
}

function parsearLineaCSV(linea: string): string[] {
  const resultado: string[] = [];
  let actual = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (char === '"') {
      if (dentroComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if ((char === ',' || char === ';') && !dentroComillas) {
      resultado.push(actual);
      actual = '';
    } else {
      actual += char;
    }
  }
  resultado.push(actual);
  return resultado;
}

export type RolUsuario = 'admin' | 'staff';
export type EstadoEvento = 'borrador' | 'publicado' | 'finalizado' | 'cancelado';
export type EstadoRetencion = 'activa' | 'pendiente_eliminacion' | 'en_proceso' | 'eliminada' | 'retencion_excepcional';
export type EstadoRSVP = 'pendiente' | 'confirmado' | 'rechazado';
export type CanalEntrega = 'enlace' | 'WhatsApp';
export type EstadoEntrega = 'preparado' | 'enviado_manual' | 'error_registrado';

export type EstiloTarjeta = 
  | 'gala_royal'           // 1. Cúpula imperial & marco dorado de gala
  | 'editorial_vogue'      // 2. Revista de moda & tipografía asimétrica
  | 'pasaporte_ticket'     // 3. Pase de abordaje VIP & código de barras
  | 'sobre_clasico'        // 4. Carta romántica & sello de lacre en relieve
  | 'cyber_neon'           // 5. Fiesta neón glow & diseño dark tech
  | 'botanico_jardin'      // 6. Jardín botánico & corona de eucalipto
  | 'minimalista_polaroid' // 7. Foto polaroid & washi tape retro
  | 'joya_artdeco'         // 8. Gran Gatsby & geometría dorada 1920
  | 'cristal_glass'        // 9. Vidrio esmerilado & glassmorphism flotante
  | 'celestial_mistico';   // 10. Bóveda celeste, estrellas & luna dorada

export type EfectoTransicion = 
  | 'sobre_gala' 
  | 'hoja_libro' 
  | 'destello_magico' 
  | 'cortina_suave'
  | 'zoom_cinematico'
  | 'persiana_veneciana'
  | 'giro_3d_moneda'
  | 'deslizamiento_lateral'
  | 'burbuja_emergente'
  | 'caida_petalos';

export interface DisenoConfig {
  tema: 
    | 'dorado_luxury' 
    | 'romantico_floral' 
    | 'esmeralda_botanico' 
    | 'zafiro_real' 
    | 'lavanda_elegance' 
    | 'blanco_minimal'
    | 'quince_princesa'
    | 'neon_night'
    | 'celestial_angel';
  estilo_tarjeta?: EstiloTarjeta;
  color_primario: string;
  color_secundario: string;
  color_acento?: string;
  efecto_transicion?: EfectoTransicion;
  fuente_titulo?: 'serif' | 'script' | 'cinzel';
  codigo_vestimenta?: string;
  permitir_ninos?: boolean;
  musica_url?: string;
  mensaje_bienvenida?: string;
  mensaje_cierre?: string;
  mensaje_regalo?: string;
  itinerario?: Array<{ hora: string; actividad: string; icono?: string }>;
  cuenta_bancaria_regalo?: {
    banco: string;
    titular: string;
    numero: string;
    tipo: string;
    cedula?: string;
  };
}

export interface Perfil {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  notas?: string | null;
  activo: boolean;
  created_at: string;
}

export interface Evento {
  id: string;
  cliente_id: string;
  titulo: string;
  tipo: string;
  fecha_evento: string; // ISO 8601 TIMESTAMPTZ
  zona_horaria: string;
  fecha_limite_rsvp: string;
  ubicacion_nombre: string;
  ubicacion_url?: string | null;
  indicaciones?: string | null;
  configuracion_diseno: DisenoConfig;
  estado: EstadoEvento;
  fecha_caducidad_invitaciones: string; // +7 días
  fecha_caducidad_panel: string;        // +30 días
  fecha_eliminacion_datos: string;      // +90 días
  datos_eliminados_at?: string | null;
  estado_retencion: EstadoRetencion;
  motivo_retencion?: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales para UI
  cliente?: Cliente;
}

export interface Invitado {
  id: string;
  evento_id: string;
  nombre: string;
  telefono?: string | null;
  token_hash: string;
  estado_rsvp: EstadoRSVP;
  numero_acompanantes: number;
  max_acompanantes_permitidos: number;
  respondido_at?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Campos en memoria frontend cuando se generan tokens recién creados
  token_plano?: string;
  enlace_completo?: string;
}

export interface AccesoCliente {
  id: string;
  evento_id: string;
  token_hash: string;
  permiso: 'solo_lectura';
  expira_at: string;
  revocado_at?: string | null;
  ultimo_acceso_at?: string | null;
  created_at: string;
  // En memoria frontend al generarse
  token_plano?: string;
  enlace_completo?: string;
}

export interface HistorialRSVP {
  id: string;
  invitado_id: string;
  estado_anterior?: string | null;
  estado_nuevo: EstadoRSVP;
  numero_acompanantes: number;
  created_at: string;
}

export interface EntregaInvitacion {
  id: string;
  invitado_id: string;
  canal: CanalEntrega;
  estado: EstadoEntrega;
  enviado_at?: string | null;
  created_at: string;
}

export interface LogMantenimiento {
  id: string;
  tipo_tarea: string;
  eventos_finalizados: number;
  accesos_revocados: number;
  eventos_eliminados: number;
  eventos_retenidos: number;
  detalles_tecnicos?: Record<string, unknown> | null;
  error_mensaje?: string | null;
  created_at: string;
}

export interface InvitacionPublicaData {
  valido: boolean;
  caducado?: boolean;
  rsvp_cerrado?: boolean;
  es_general?: boolean;
  error?: string;
  mensaje?: string;
  invitado?: {
    id: string;
    nombre: string;
    estado_rsvp: EstadoRSVP;
    numero_acompanantes: number;
    max_acompanantes_permitidos: number;
    respondido_at?: string | null;
  };
  evento?: {
    id: string;
    titulo: string;
    tipo: string;
    fecha_evento: string;
    zona_horaria: string;
    fecha_limite_rsvp: string;
    ubicacion_nombre: string;
    ubicacion_url?: string | null;
    indicaciones?: string | null;
    configuracion_diseno: DisenoConfig;
    estado: EstadoEvento;
  };
}

export interface PanelOrganizadorData {
  valido: boolean;
  expirado?: boolean;
  revocado?: boolean;
  error?: string;
  evento?: {
    id: string;
    titulo: string;
    tipo: string;
    fecha_evento: string;
    zona_horaria: string;
    fecha_limite_rsvp: string;
    ubicacion_nombre: string;
    ubicacion_url?: string | null;
    estado: EstadoEvento;
    expira_panel_at: string;
  };
  metricas?: {
    total_invitados: number;
    confirmados: number;
    rechazados: number;
    pendientes: number;
    total_asistentes: number;
    total_acompanantes_confirmados: number;
  };
  invitados?: Array<{
    id: string;
    nombre: string;
    telefono?: string | null;
    estado_rsvp: EstadoRSVP;
    numero_acompanantes: number;
    max_acompanantes_permitidos: number;
    respondido_at?: string | null;
  }>;
}

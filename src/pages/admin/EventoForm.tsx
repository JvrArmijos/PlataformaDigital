import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Save, 
  ArrowLeft, 
  Palette, 
  Clock, 
  ShieldAlert,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Gift,
  Shirt,
  MapPin,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { adminGuardarEvento, adminObtenerEvento, adminListarClientes } from '../../lib/supabase';
import { calcularPlazosDesdeEvento, formatearFechaCorta } from '../../lib/dates';
import type { Cliente, DisenoConfig, EstadoEvento, EstadoRetencion } from '../../types/database';

export const TIPOS_EVENTO = [
  { id: 'boda', nombre: '💍 Boda / Matrimonio (Religioso o Civil)', temaSugerido: 'dorado_luxury' },
  { id: 'quinceanos', nombre: '👑 XV Años / Quinceañera / Sweet 16', temaSugerido: 'quince_princesa' },
  { id: 'graduacion', nombre: '🎓 Graduación Académica / Grado Universitario', temaSugerido: 'zafiro_real' },
  { id: 'bautizo', nombre: '🕊️ Bautizo / Presentación al Templo', temaSugerido: 'celestial_angel' },
  { id: 'primera_comunion', nombre: '⛪ Primera Comunión / Confirmación', temaSugerido: 'blanco_minimal' },
  { id: 'cumpleanos_infantil', nombre: '🎈 Cumpleaños Infantil / Fiesta Temática', temaSugerido: 'neon_night' },
  { id: 'cumpleanos_adulto', nombre: '🥂 Cumpleaños Adulto / Fiesta Sorpresa', temaSugerido: 'dorado_luxury' },
  { id: 'baby_shower', nombre: '🍼 Baby Shower / Gender Reveal', temaSugerido: 'celestial_angel' },
  { id: 'aniversario', nombre: '💫 Aniversario de Bodas (Plata, Oro, Rubí)', temaSugerido: 'dorado_luxury' },
  { id: 'corporativo', nombre: '💼 Evento Corporativo / Conferencia / Gala', temaSugerido: 'zafiro_real' },
  { id: 'despedida_soltera', nombre: '🍸 Despedida de Soltera / Soltero', temaSugerido: 'neon_night' },
  { id: 'otro', nombre: '✨ Otro Tipo de Celebración', temaSugerido: 'dorado_luxury' },
] as const;

export const TEMAS_DISENO = [
  { id: 'dorado_luxury', nombre: '✨ Dorado Luxury & Noche (Negro y Oro Imperial)', primario: '#d97706', secundario: '#0c0a09', acento: '#fbbf24' },
  { id: 'romantico_floral', nombre: '🌸 Romántico Floral & Rose Gold (Vino y Borgoña)', primario: '#be185d', secundario: '#fff1f2', acento: '#f43f5e' },
  { id: 'esmeralda_botanico', nombre: '🌿 Verde Esmeralda & Eucalipto (Botánico)', primario: '#047857', secundario: '#ecfdf5', acento: '#10b981' },
  { id: 'quince_princesa', nombre: '👑 Quinceañera Princesa (Rosa Glam & Oro)', primario: '#db2777', secundario: '#fdf2f8', acento: '#f472b6' },
  { id: 'neon_night', nombre: '⚡ Fiesta Neón & Glow (Cian & Violeta Eléctrico)', primario: '#06b6d4', secundario: '#09090b', acento: '#d946ef' },
  { id: 'celestial_angel', nombre: '🕊️ Ángel Celestial (Azul Cielo & Pureza)', primario: '#0284c7', secundario: '#f0f9ff', acento: '#fbbf24' },
  { id: 'zafiro_real', nombre: '💎 Azul Zafiro Real (Marino y Plata)', primario: '#1d4ed8', secundario: '#eff6ff', acento: '#38bdf8' },
  { id: 'lavanda_elegance', nombre: '💜 Lavanda & Lila Romance (Violeta Pastel)', primario: '#7c3aed', secundario: '#f5f3ff', acento: '#a78bfa' },
  { id: 'blanco_minimal', nombre: '🤍 Blanco Perla & Minimalista (Piedra y Carbón)', primario: '#44403c', secundario: '#fafaf9', acento: '#78716c' },
] as const;

export const EFECTOS_TRANSICION = [
  { id: 'sobre_gala', nombre: '✉️ Sobre de Gala (Apertura y solapa de sobre)' },
  { id: 'hoja_libro', nombre: '📖 Giro de Libro (Pase de página 3D realista)' },
  { id: 'destello_magico', nombre: '✨ Destello Mágico (Resplandor brillante y partículas)' },
  { id: 'cortina_suave', nombre: '🎭 Cortina Teatral (Despliegue suave hacia abajo)' },
  { id: 'zoom_cinematico', nombre: '🎬 Zoom Cinemático (Profundidad 3D & enfoque de cine)' },
  { id: 'persiana_veneciana', nombre: '🪟 Persiana Veneciana (Apertura en franjas de lamas)' },
  { id: 'giro_3d_moneda', nombre: '🪙 Giro 3D de Moneda (Rotación 180° en eje Y)' },
  { id: 'deslizamiento_lateral', nombre: '➡️ Deslizamiento Dinámico (Entrada elástica lateral)' },
  { id: 'burbuja_emergente', nombre: '🫧 Burbuja Emergente (Onda expansiva elástica)' },
  { id: 'caida_petalos', nombre: '🌸 Caída de Pétalos (Descenso suave etéreo con rotación)' },
] as const;

export const ESTILOS_TARJETA = [
  { id: 'gala_royal', nombre: '🏛️ Gala Real (Arco superior en cúpula & botón central dorado)' },
  { id: 'editorial_vogue', nombre: '📰 Revista Vogue (Diseño asimétrico & botón lateral derecho)' },
  { id: 'pasaporte_ticket', nombre: '🎫 Pase de Abordaje VIP (Boleto troquelado con código de barras)' },
  { id: 'sobre_clasico', nombre: '✉️ Carta Romántica (Solapa de sobre & botón de sello de lacre)' },
  { id: 'cyber_neon', nombre: '⚡ Cyber Neón Glow (Líneas futuristas HUD & botones holográficos)' },
  { id: 'botanico_jardin', nombre: '🌿 Jardín Botánico (Corona de eucalipto & botón cápsula orgánica)' },
  { id: 'minimalista_polaroid', nombre: '📸 Foto Polaroid (Marco retro chic & botón estilo sticker diagonal)' },
  { id: 'joya_artdeco', nombre: '💎 Gran Gatsby 1920 (Geometría octogonal dorada & botón romboide)' },
  { id: 'cristal_glass', nombre: '🪞 Vidrio Traslúcido (Glassmorphism líquido flotante & botones transparentes)' },
  { id: 'celestial_mistico', nombre: '🌙 Bóveda Celeste (Constelaciones nocturnas & botón eclipse estelar)' },
] as const;

export interface VarianteEstilo {
  nombreEstilo: string;
  bienvenida: string;
  regalo: string;
  cierre: string;
  vestimenta: string;
  tema: DisenoConfig['tema'];
  estilo_tarjeta: DisenoConfig['estilo_tarjeta'];
  efecto_transicion: DisenoConfig['efecto_transicion'];
}

// Catálogo con múltiples estilos y personalidades creativas para que las plantillas nunca sean iguales
export const VARIANTES_PLANTILLAS: Record<string, VarianteEstilo[]> = {
  boda: [
    {
      nombreEstilo: '🏛️ Clásica Imperial',
      bienvenida: 'Tenemos el honor de invitarte a celebrar con nosotros el inicio de este nuevo capítulo y la bendición de nuestro matrimonio.',
      regalo: 'Tu presencia es nuestro mayor regalo. Pero si deseas tener un detalle con nosotros, disponemos de lluvia de sobres:',
      cierre: '¡Tu bendición y presencia son nuestro mejor regalo!',
      vestimenta: 'Formal / Rigurosa Etiqueta o Traje Oscuro',
      tema: 'dorado_luxury',
      estilo_tarjeta: 'gala_royal',
      efecto_transicion: 'sobre_gala'
    },
    {
      nombreEstilo: '📰 Moderna Editorial',
      bienvenida: 'Un sí para siempre. Queremos celebrar nuestro amor rodeados de las personas que hacen nuestra vida inolvidable.',
      regalo: 'El mejor presente es compartir este momento contigo. Si deseas tener una muestra de cariño:',
      cierre: '¡Nos vemos en la pista para brindar por el amor!',
      vestimenta: 'Black Tie / Elegante Contemporáneo',
      tema: 'blanco_minimal',
      estilo_tarjeta: 'editorial_vogue',
      efecto_transicion: 'zoom_cinematico'
    },
    {
      nombreEstilo: '🌿 Jardín Botánico & Bohemia',
      bienvenida: 'Bajo el cielo abierto y rodeados de naturaleza, uniremos nuestras vidas. Acompáñanos a festejar este amor.',
      regalo: 'Tu compañía engalana nuestro día. Si deseas obsequiarnos un presente para nuestro nuevo hogar:',
      cierre: '¡Celebremos el amor bajo las estrellas!',
      vestimenta: 'Guayabera Elegante / Vestidos Vaporosos en Tonos Pastel',
      tema: 'esmeralda_botanico',
      estilo_tarjeta: 'botanico_jardin',
      efecto_transicion: 'caida_petalos'
    },
    {
      nombreEstilo: '💌 Romance Poético',
      bienvenida: 'Porque dos historias decidieron unirse para caminar juntas con el mismo latido. Deseamos que seas testigo de nuestra dicha.',
      regalo: 'Tu presencia es la joya de nuestra fiesta. Si deseas tener un detalle especial:',
      cierre: '¡Gracias por creer en nuestro amor!',
      vestimenta: 'Cocktail Elegante / Traje Formal',
      tema: 'romantico_floral',
      estilo_tarjeta: 'sobre_clasico',
      efecto_transicion: 'destello_magico'
    }
  ],
  quinceanos: [
    {
      nombreEstilo: '👑 Princesa de Cuento',
      bienvenida: 'Hay momentos en la vida que son inolvidables, y compartirlos con quienes más quiero los hace eternos. Te espero en mis 15 años.',
      regalo: 'Tu presencia engalana mi noche. Si deseas hacerme un presente especial, disponemos de lluvia de sobres:',
      cierre: '¡Gracias por ser parte de mi noche mágica de 15 años!',
      vestimenta: 'Elegante / Traje o Vestido de Cóctel (Favor no vestir de rosa)',
      tema: 'quince_princesa',
      estilo_tarjeta: 'cristal_glass',
      efecto_transicion: 'destello_magico'
    },
    {
      nombreEstilo: '⚡ Fiesta Neón Glow',
      bienvenida: '¡Llegaron mis 15! Prepárate para una noche de música, luces, glitter y diversión sin límites. ¡No puedes faltar!',
      regalo: 'Tu energía en la pista es mi mejor regalo. Si deseas hacerme un detalle:',
      cierre: '¡A bailar hasta que amanezca!',
      vestimenta: 'Party Chic / Colores Neón o Brillos',
      tema: 'neon_night',
      estilo_tarjeta: 'cyber_neon',
      efecto_transicion: 'burbuja_emergente'
    },
    {
      nombreEstilo: '💎 Gala Hollywood Glam',
      bienvenida: 'Una noche de alfombra roja y estrellas para celebrar mis quince primaveras. Me encantaría que me acompañes.',
      regalo: 'Tu presencia es el mayor brillo de mi noche. Si deseas tener un detalle:',
      cierre: '¡Gracias por iluminar mi celebración!',
      vestimenta: 'Gala / Traje de Noche',
      tema: 'dorado_luxury',
      estilo_tarjeta: 'joya_artdeco',
      efecto_transicion: 'persiana_veneciana'
    }
  ],
  graduacion: [
    {
      nombreEstilo: '🎓 Éxito Académico Formal',
      bienvenida: 'Con esfuerzo, constancia y dedicación culmina una gran etapa académica. Me encantaría que me acompañes a celebrar mi graduación.',
      regalo: 'El mayor honor es compartir este logro contigo. Si deseas hacerme un presente para mi nueva etapa profesional:',
      cierre: '¡Gracias por acompañarme en este importante logro!',
      vestimenta: 'Formal / Traje de Gala',
      tema: 'zafiro_real',
      estilo_tarjeta: 'editorial_vogue',
      efecto_transicion: 'hoja_libro'
    },
    {
      nombreEstilo: '🥂 Celebración de Metas',
      bienvenida: '¡Lo logramos! Culmina una etapa de trasnochos y sueños, y empieza el gran camino profesional. Ven a brindar conmigo.',
      regalo: 'Tu respaldo a lo largo de este camino ha sido invaluable. Si deseas tener una muestra de aprecio:',
      cierre: '¡A brindar por el futuro que construimos!',
      vestimenta: 'Cóctel Elegante',
      tema: 'dorado_luxury',
      estilo_tarjeta: 'pasaporte_ticket',
      efecto_transicion: 'zoom_cinematico'
    }
  ],
  bautizo: [
    {
      nombreEstilo: '🕊️ Ángel Celestial',
      bienvenida: 'Doy gracias a Dios por el don de mi vida y a mis padres por guiar mis pasos. Te invitamos a celebrar este sacramento sagrado.',
      regalo: 'Tu bendición y compañía son el mejor regalo. Si deseas tener una muestra de cariño:',
      cierre: '¡Que Dios bendiga tu hogar y gracias por acompañarnos!',
      vestimenta: 'Semiformal / Tonos Claros o Pastel',
      tema: 'celestial_angel',
      estilo_tarjeta: 'celestial_mistico',
      efecto_transicion: 'cortina_suave'
    },
    {
      nombreEstilo: '🌿 Dulce Bendición',
      bienvenida: 'Un rayito de luz llegó a iluminar nuestras vidas. Con alegría te invitamos al Bautizo de nuestro amado hijo(a).',
      regalo: 'Tu cariño es la mayor bendición para nuestro bebé. Si deseas hacerle un obsequio:',
      cierre: '¡Gracias por compartir esta dicha con nuestra familia!',
      vestimenta: 'Blanco o Beige / Semiformal',
      tema: 'blanco_minimal',
      estilo_tarjeta: 'botanico_jardin',
      efecto_transicion: 'caida_petalos'
    }
  ],
  cumpleanos_infantil: [
    {
      nombreEstilo: '🎈 Aventura & Juegos',
      bienvenida: '¡Estoy cumpliendo un añito más y la diversión está asegurada! Ven a compartir juegos, risas y sorpresas en mi fiesta.',
      regalo: 'Tu alegría es el mejor regalo. Pero si deseas hacerme un obsequio o presente:',
      cierre: '¡No faltes, la fiesta no será lo mismo sin ti!',
      vestimenta: 'Cómoda / Colores Vivos o Disfraz',
      tema: 'neon_night',
      estilo_tarjeta: 'pasaporte_ticket',
      efecto_transicion: 'burbuja_emergente'
    },
    {
      nombreEstilo: '📸 Fiesta Fotográfica Retro',
      bienvenida: '¡Sonríe a la cámara! Celebramos un año más lleno de juegos, dulces y fotos divertidas con los mejores amigos.',
      regalo: 'Tu sonrisa y tus abrazos son el mejor regalo. Si deseas traerme un detalle:',
      cierre: '¡Ven listo para divertirte al máximo!',
      vestimenta: 'Casual Festiva',
      tema: 'quince_princesa',
      estilo_tarjeta: 'minimalista_polaroid',
      efecto_transicion: 'deslizamiento_lateral'
    }
  ],
  cumpleanos_adulto: [
    {
      nombreEstilo: '🥂 Gala & Brindis Dorado',
      bienvenida: '¡Los mejores momentos se celebran entre amigos y familia! Acompáñame a brindar por un año más de vida, metas y alegrías.',
      regalo: 'Tu presencia y ganas de celebrar son el mejor obsequio. Si deseas tener un detalle especial:',
      cierre: '¡Gracias por celebrar la vida junto a mí!',
      vestimenta: 'Casual Elegante / Cocktail',
      tema: 'dorado_luxury',
      estilo_tarjeta: 'sobre_clasico',
      efecto_transicion: 'sobre_gala'
    },
    {
      nombreEstilo: '⚡ Fiesta & Noche de Copas',
      bienvenida: 'Un año más sabio, más feliz y con más ganas de bailar. Ven a festejar mi cumpleaños en una noche inolvidable.',
      regalo: 'Tu presencia es el regalo. Si deseas tener una muestra de aprecio:',
      cierre: '¡Prohibido irse temprano!',
      vestimenta: 'Fiesta / Cocktail',
      tema: 'neon_night',
      estilo_tarjeta: 'cyber_neon',
      efecto_transicion: 'giro_3d_moneda'
    }
  ],
  baby_shower: [
    {
      nombreEstilo: '🍼 Dulce Espera en las Nubes',
      bienvenida: 'Una dulce espera llena de amor está por terminar. Te invitamos a celebrar la próxima llegada de nuestro mayor tesoro.',
      regalo: 'Tu cariño para nuestro bebé es el regalo más preciado. Si deseas tener un detalle para su llegada:',
      cierre: '¡Gracias por acompañarnos a esperar este milagro!',
      vestimenta: 'Tonos Pastel / Blanco o Beige',
      tema: 'celestial_angel',
      estilo_tarjeta: 'celestial_mistico',
      efecto_transicion: 'cortina_suave'
    },
    {
      nombreEstilo: '🌿 Jardín de Bienvenida',
      bienvenida: 'Nuestro hogar florece con la llegada de nuestro bebé. Acompáñanos en este hermoso Baby Shower para llenar de amor su camino.',
      regalo: 'Si deseas obsequiar un detalle para el recién nacido o lluvia de pañales:',
      cierre: '¡Con amor te esperamos!',
      vestimenta: 'Blanco, Verde Olivo o Tonos Tierra',
      tema: 'esmeralda_botanico',
      estilo_tarjeta: 'botanico_jardin',
      efecto_transicion: 'caida_petalos'
    }
  ],
  aniversario: [
    {
      nombreEstilo: '💫 Bodas de Oro & Gatsby',
      bienvenida: 'Celebrar el amor, la lealtad y los años compartidos es un motivo de inmensa gratitud. Acompáñanos a renovar nuestros votos.',
      regalo: 'Tu presencia es nuestro regalo de aniversario. Pero si deseas obsequiarnos un presente:',
      cierre: '¡Brindemos por muchos años más de amor!',
      vestimenta: 'Elegante / Traje Formal',
      tema: 'dorado_luxury',
      estilo_tarjeta: 'joya_artdeco',
      efecto_transicion: 'persiana_veneciana'
    }
  ],
  corporativo: [
    {
      nombreEstilo: '💼 Gala Institucional & Negocios',
      bienvenida: 'Nos complace convocarle a nuestra gala anual para compartir los logros alcanzados y presentar los proyectos estratégicos futuros.',
      regalo: 'Agradecemos su valiosa participación y respaldo institucional.',
      cierre: 'Agradecemos su distinguida asistencia.',
      vestimenta: 'Formal de Negocios / Cocktail',
      tema: 'zafiro_real',
      estilo_tarjeta: 'editorial_vogue',
      efecto_transicion: 'zoom_cinematico'
    }
  ],
  despedida_soltera: [
    {
      nombreEstilo: '🍸 Glamour & Última Noche Soltera',
      bienvenida: '¡Se nos casa! Prepárate para una noche llena de brindis, risas y momentos inolvidables antes de dar el gran paso.',
      regalo: '¡Lo importante es tu energía y tus mejores vibras para esta despedida!',
      cierre: '¡Nos vemos en la pista de baile!',
      vestimenta: 'Fiesta / Glamour & Cóctel',
      tema: 'neon_night',
      estilo_tarjeta: 'cyber_neon',
      efecto_transicion: 'destello_magico'
    }
  ]
};

export function EventoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(id && id !== 'nuevo');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos principales
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('boda');
  const [fechaEvento, setFechaEvento] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [zonaHoraria, setZonaHoraria] = useState('America/Guayaquil');
  const [fechaLimiteRsvp, setFechaLimiteRsvp] = useState(() => {
    const d = new Date(Date.now() + 20 * 86400000);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [ubicacionNombre, setUbicacionNombre] = useState('');
  const [ubicacionUrl, setUbicacionUrl] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [estado, setEstado] = useState<EstadoEvento>('borrador');

  // Retención excepcional
  const [estadoRetencion, setEstadoRetencion] = useState<EstadoRetencion>('activa');
  const [motivoRetencion, setMotivoRetencion] = useState('');

  // Estados de acordeón / casillas condicionales para requerimientos del cliente
  const [incluirDatosBancarios, setIncluirDatosBancarios] = useState(false);
  const [incluirCodigoVestimenta, setIncluirCodigoVestimenta] = useState(false);
  const [incluirUbicacionMapa, setIncluirUbicacionMapa] = useState(false);
  const [incluirIndicaciones, setIncluirIndicaciones] = useState(false);
  const [incluirMensajesPersonalizados, setIncluirMensajesPersonalizados] = useState(false);

  const [iaMensajeExito, setIaMensajeExito] = useState<string | null>(null);
  const [indiceVarianteActual, setIndiceVarianteActual] = useState(0);

  // Configuración de diseño
  const [diseno, setDiseno] = useState<DisenoConfig>({
    tema: 'dorado_luxury',
    color_primario: '#d97706',
    color_secundario: '#0c0a09',
    color_acento: '#fbbf24',
    efecto_transicion: 'sobre_gala',
    fuente_titulo: 'serif',
    codigo_vestimenta: '',
    permitir_ninos: true,
    mensaje_bienvenida: 'Tenemos el honor de invitarte a celebrar con nosotros este día tan esperado.',
    mensaje_cierre: '¡Tu presencia es nuestro mejor regalo!',
    mensaje_regalo: 'Tu presencia es nuestro mayor regalo. Pero si deseas tener un detalle especial con nosotros:',
    cuenta_bancaria_regalo: {
      banco: '',
      titular: '',
      numero: '',
      tipo: 'Ahorros',
      cedula: ''
    }
  });

  useEffect(() => {
    async function inicializar() {
      setCargando(true);
      try {
        const cls = await adminListarClientes();
        setClientes(cls);
        if (cls.length > 0 && !clienteId) {
          setClienteId(cls[0].id);
        }

        if (esEdicion && id) {
          const ev = await adminObtenerEvento(id);
          if (ev) {
            setClienteId(ev.cliente_id);
            setTitulo(ev.titulo);
            setTipo(ev.tipo);
            setFechaEvento(new Date(ev.fecha_evento).toISOString().slice(0, 16));
            setZonaHoraria(ev.zona_horaria || 'America/Guayaquil');
            setFechaLimiteRsvp(new Date(ev.fecha_limite_rsvp).toISOString().slice(0, 16));
            setUbicacionNombre(ev.ubicacion_nombre);
            setUbicacionUrl(ev.ubicacion_url || '');
            setIndicaciones(ev.indicaciones || '');
            setEstado(ev.estado);
            setEstadoRetencion(ev.estado_retencion);
            setMotivoRetencion(ev.motivo_retencion || '');
            if (ev.configuracion_diseno) {
              setDiseno({ ...diseno, ...ev.configuracion_diseno });
              // Detectar qué módulos estaban activos
              if (ev.configuracion_diseno.cuenta_bancaria_regalo?.numero) {
                setIncluirDatosBancarios(true);
              }
              if (ev.configuracion_diseno.codigo_vestimenta) {
                setIncluirCodigoVestimenta(true);
              }
              if (ev.ubicacion_url) {
                setIncluirUbicacionMapa(true);
              }
              if (ev.indicaciones) {
                setIncluirIndicaciones(true);
              }
              if (ev.configuracion_diseno.mensaje_bienvenida || ev.configuracion_diseno.mensaje_cierre) {
                setIncluirMensajesPersonalizados(true);
              }
            }
          }
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Error al inicializar');
      } finally {
        setCargando(false);
      }
    }

    inicializar();
  }, [id, esEdicion]);

  // Aplicar plantilla rápida predefinida según el tipo de evento y variante
  const handleAplicarPlantillaTipo = (tipoSeleccionado: string, indiceForzado?: number) => {
    const listaVariantes = VARIANTES_PLANTILLAS[tipoSeleccionado] || VARIANTES_PLANTILLAS.boda;
    const nuevoIndice = indiceForzado !== undefined 
      ? indiceForzado 
      : ((indiceVarianteActual + 1) % listaVariantes.length);
    
    setIndiceVarianteActual(nuevoIndice);
    const plantilla = listaVariantes[nuevoIndice] || listaVariantes[0];
    const presetTema = TEMAS_DISENO.find(t => t.id === plantilla.tema) || TEMAS_DISENO[0];

    setDiseno(prev => ({
      ...prev,
      tema: plantilla.tema,
      estilo_tarjeta: plantilla.estilo_tarjeta,
      efecto_transicion: plantilla.efecto_transicion,
      color_primario: presetTema.primario,
      color_secundario: presetTema.secundario,
      color_acento: presetTema.acento,
      mensaje_bienvenida: plantilla.bienvenida,
      mensaje_regalo: plantilla.regalo,
      mensaje_cierre: plantilla.cierre,
      codigo_vestimenta: plantilla.vestimenta
    }));

    // Abrir automáticamente las secciones para que el usuario VEA los textos aplicados
    setIncluirCodigoVestimenta(Boolean(plantilla.vestimenta));
    setIncluirMensajesPersonalizados(true);
    setIncluirDatosBancarios(true);

    const nombreSilueta = ESTILOS_TARJETA.find(s => s.id === plantilla.estilo_tarjeta)?.nombre || plantilla.estilo_tarjeta;
    const nombreEfecto = EFECTOS_TRANSICION.find(e => e.id === plantilla.efecto_transicion)?.nombre || plantilla.efecto_transicion;

    setIaMensajeExito(`¡Plantilla aplicada: "${plantilla.nombreEstilo}"! Silueta: ${nombreSilueta}, Transición: ${nombreEfecto}.`);
    setTimeout(() => setIaMensajeExito(null), 6000);
  };



  // Cálculo en vivo de los plazos
  let plazosCalculados = null;
  try {
    const fechaCompletaIso = new Date(fechaEvento).toISOString();
    plazosCalculados = calcularPlazosDesdeEvento(fechaCompletaIso);
  } catch {
    // en edición
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !titulo || !fechaEvento || !ubicacionNombre) {
      alert('Por favor complete los campos obligatorios: Cliente, Título, Fecha y Lugar.');
      return;
    }

    try {
      setGuardando(true);
      const fechaEventoIso = new Date(fechaEvento).toISOString();
      const fechaLimiteIso = new Date(fechaLimiteRsvp).toISOString();

      // Limpiar campos que el cliente decidió no incluir
      const disenoFinal: DisenoConfig = {
        ...diseno,
        codigo_vestimenta: incluirCodigoVestimenta ? diseno.codigo_vestimenta : undefined,
        cuenta_bancaria_regalo: (incluirDatosBancarios && diseno.cuenta_bancaria_regalo?.numero) 
          ? diseno.cuenta_bancaria_regalo 
          : undefined,
        mensaje_regalo: incluirDatosBancarios ? diseno.mensaje_regalo : undefined,
      };

      const resultado = await adminGuardarEvento({
        id: esEdicion ? id : undefined,
        cliente_id: clienteId,
        titulo,
        tipo,
        fecha_evento: fechaEventoIso,
        zona_horaria: zonaHoraria,
        fecha_limite_rsvp: fechaLimiteIso,
        ubicacion_nombre: ubicacionNombre,
        ubicacion_url: incluirUbicacionMapa && ubicacionUrl ? ubicacionUrl : null,
        indicaciones: incluirIndicaciones && indicaciones ? indicaciones : null,
        configuracion_diseno: disenoFinal,
        estado,
        estado_retencion: estadoRetencion,
        motivo_retencion: estadoRetencion === 'retencion_excepcional' ? motivoRetencion : null,
      });

      navigate(`/admin/eventos/${resultado.id}/invitaciones`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar evento');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-sm">Cargando datos del evento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera */}
      <div>
        <Link
          to="/admin/eventos"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a eventos
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-700 block">
              Configuración de Eventos
            </span>
            <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
              {esEdicion ? 'Editar Evento' : 'Nuevo Evento Digital'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* SECCIÓN 1: DATOS GENERALES */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            1. Datos Generales del Evento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Cliente Asociado *
              </label>
              <select
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="">Seleccione un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tipo de Celebración *
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  const nuevoTipo = e.target.value;
                  setTipo(nuevoTipo);
                  // Auto-aplicar la primera variante del nuevo tipo de evento
                  handleAplicarPlantillaTipo(nuevoTipo, 0);
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              >
                {TIPOS_EVENTO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Título de la Invitación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Boda Sofía & Mateo o Mis 15 Años Valentina"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Fecha y Hora Oficial del Evento *
              </label>
              <input
                type="datetime-local"
                required
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Fecha Límite de Confirmación (RSVP) *
              </label>
              <input
                type="datetime-local"
                required
                value={fechaLimiteRsvp}
                onChange={(e) => setFechaLimiteRsvp(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Lugar / Salón de Recepción *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Quinta Los Cipreses, Valle de los Chillos"
              value={ubicacionNombre}
              onChange={(e) => setUbicacionNombre(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          {/* Módulos desplegables condicionales de Ubicación & Notas */}
          <div className="pt-2 space-y-3">
            {/* Casilla 1: Enlace a Google Maps */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <label className="flex items-center justify-between p-3.5 bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-colors">
                <span className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={incluirUbicacionMapa}
                    onChange={(e) => setIncluirUbicacionMapa(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <MapPin className="w-4 h-4 text-amber-700" />
                  ¿Incluir enlace de Google Maps o Waze para los invitados?
                </span>
                {incluirUbicacionMapa ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </label>

              {incluirUbicacionMapa && (
                <div className="p-4 bg-white border-t border-stone-200 animate-fade-in space-y-2">
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={ubicacionUrl}
                    onChange={(e) => setUbicacionUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <span className="text-[11px] text-stone-500 block">
                    Pega el enlace compartido desde Google Maps para que el invitado abra el GPS directamente desde su celular.
                  </span>
                </div>
              )}
            </div>

            {/* Casilla 2: Indicaciones especiales */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <label className="flex items-center justify-between p-3.5 bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-colors">
                <span className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={incluirIndicaciones}
                    onChange={(e) => setIncluirIndicaciones(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  ¿Agregar indicaciones especiales (parqueadero, puntualidad, niños)?
                </span>
                {incluirIndicaciones ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </label>

              {incluirIndicaciones && (
                <div className="p-4 bg-white border-t border-stone-200 animate-fade-in space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Ej: Agradecemos su puntualidad. El recinto cuenta con parqueadero privado y seguridad..."
                    value={indicaciones}
                    onChange={(e) => setIndicaciones(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Estado del Evento
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoEvento)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="borrador">Borrador (Configuración interna)</option>
                <option value="publicado">Publicado (Invitaciones y RSVP activos)</option>
                <option value="finalizado">Finalizado (Celebración concluida)</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Zona Horaria
              </label>
              <input
                type="text"
                disabled
                value={zonaHoraria}
                className="w-full px-3 py-2 text-sm bg-stone-100 text-stone-500 rounded-xl border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PLAZOS Y RETENCIÓN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            2. Plazos Automáticos y Privacidad de Datos
          </h2>

          {plazosCalculados && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-900 block">
                  Invitaciones (+7 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_caducidad_invitaciones)}
                </span>
                <span className="text-[10px] text-stone-500">Muestra página de evento finalizado.</span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-900 block">
                  Panel Organizador (+30 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_caducidad_panel)}
                </span>
                <span className="text-[10px] text-stone-500">Revocación del enlace privado.</span>
              </div>

              <div className="p-3 bg-stone-100 border border-stone-200 rounded-2xl">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-700 block">
                  Eliminación de Datos (+90 días)
                </span>
                <span className="text-xs font-bold text-stone-800 mt-1 block">
                  {formatearFechaCorta(plazosCalculados.fecha_eliminacion_datos)}
                </span>
                <span className="text-[10px] text-stone-500">Borrado seguro de datos personales.</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={estadoRetencion === 'retencion_excepcional'}
                onChange={(e) => setEstadoRetencion(e.target.checked ? 'retencion_excepcional' : 'activa')}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Aplicar Excepción Documentada de Retención (Impide eliminación automática a los 90 días)</span>
            </label>

            {estadoRetencion === 'retencion_excepcional' && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs text-purple-900 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span>Motivo u Obligación Legal de Conservación:</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: Requerimiento contable o autorización expresa del cliente..."
                  value={motivoRetencion}
                  onChange={(e) => setMotivoRetencion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-purple-300 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: DISEÑO, TEMAS Y ESTILOS CURADOS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm uppercase tracking-wider font-bold text-stone-700 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-600" />
              3. Diseño, Estilo Visual y Módulos a Medida
            </h2>
          </div>

          {/* BARRA DE VARIANTES Y ESTILOS CURADOS (1-CLIC) */}
          <div className="p-4 bg-gradient-to-br from-amber-50/80 via-stone-50 to-orange-50/60 rounded-2xl border border-amber-200/90 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Estilos y Diseños Preconfigurados para {TIPOS_EVENTO.find(t => t.id === tipo)?.nombre.split(' ')[1] || tipo.toUpperCase()}:</span>
                </span>
                <span className="text-[11px] text-amber-900/80 block mt-0.5">
                  Cada botón cambia al instante la silueta de la tarjeta, la animación de transición, los colores y las frases.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAplicarPlantillaTipo(tipo)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>🎲 Probar Otra Variante</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(VARIANTES_PLANTILLAS[tipo] || VARIANTES_PLANTILLAS.boda).map((variante, idx) => {
                const esActivo = indiceVarianteActual === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAplicarPlantillaTipo(tipo, idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      esActivo
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                        : 'bg-white hover:bg-amber-100/60 text-stone-700 border-stone-300 hover:border-amber-400'
                    }`}
                  >
                    <span>{variante.nombreEstilo}</span>
                    {esActivo && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {iaMensajeExito && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 mt-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{iaMensajeExito}</span>
              </div>
            )}
          </div>

          {/* RESUMEN EN VIVO DE LO CONFIGURADO */}
          <div className="p-3.5 bg-white rounded-2xl border border-stone-200 text-xs space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-stone-900 font-bold">
              <span>📋 Resumen visual activo de esta invitación:</span>
              <span className="text-[11px] font-normal text-stone-500">Todo es editable en los selectores inferiores</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-700 bg-stone-50/80 p-3 rounded-xl border border-stone-200">
              <p><strong>🎨 Tema:</strong> {TEMAS_DISENO.find(t => t.id === diseno.tema)?.nombre || diseno.tema}</p>
              <p><strong>🏛️ Silueta Tarjeta:</strong> {ESTILOS_TARJETA.find(s => s.id === (diseno.estilo_tarjeta || 'gala_royal'))?.nombre || diseno.estilo_tarjeta}</p>
              <p><strong>✨ Animación:</strong> {EFECTOS_TRANSICION.find(e => e.id === (diseno.efecto_transicion || 'sobre_gala'))?.nombre || diseno.efecto_transicion}</p>
              <p><strong>👔 Vestimenta:</strong> {diseno.codigo_vestimenta || 'Opcional (no exigida)'}</p>
              <p className="sm:col-span-2"><strong>💌 Bienvenida:</strong> "{diseno.mensaje_bienvenida}"</p>
              <p className="sm:col-span-2"><strong>🎁 Regalo:</strong> "{diseno.mensaje_regalo}"</p>
            </div>
          </div>

          {/* Selectores de Diseño: Tema de Color, Silueta de Tarjeta y Efecto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Paleta / Tema de Color *
              </label>
              <select
                value={diseno.tema}
                onChange={(e) => {
                  const temaId = e.target.value as DisenoConfig['tema'];
                  const preset = TEMAS_DISENO.find(t => t.id === temaId);
                  if (preset) {
                    setDiseno(prev => ({
                      ...prev,
                      tema: temaId,
                      color_primario: preset.primario,
                      color_secundario: preset.secundario,
                      color_acento: preset.acento,
                    }));
                  } else {
                    setDiseno(prev => ({ ...prev, tema: temaId }));
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              >
                {TEMAS_DISENO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Silueta / Forma de Tarjeta *
              </label>
              <select
                value={diseno.estilo_tarjeta || 'clasica_curva'}
                onChange={(e) => setDiseno({ ...diseno, estilo_tarjeta: e.target.value as DisenoConfig['estilo_tarjeta'] })}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              >
                {ESTILOS_TARJETA.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Efecto de Apertura *
              </label>
              <select
                value={diseno.efecto_transicion || 'sobre_gala'}
                onChange={(e) => setDiseno({ ...diseno, efecto_transicion: e.target.value as DisenoConfig['efecto_transicion'] })}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              >
                {EFECTOS_TRANSICION.map((ef) => (
                  <option key={ef.id} value={ef.id}>
                    {ef.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Colores Dinámicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Color Primario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={diseno.color_primario}
                  onChange={(e) => setDiseno({ ...diseno, color_primario: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-stone-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={diseno.color_primario}
                  onChange={(e) => setDiseno({ ...diseno, color_primario: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 text-stone-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Color de Acento / Detalles
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={diseno.color_acento || '#fbbf24'}
                  onChange={(e) => setDiseno({ ...diseno, color_acento: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-stone-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={diseno.color_acento || '#fbbf24'}
                  onChange={(e) => setDiseno({ ...diseno, color_acento: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 text-stone-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              MÓDULOS CONDICIONALES A MEDIDA DEL CLIENTE (ACORDEÓN)
             ======================================================== */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Requerimientos Específicos del Cliente (Opcionales):
            </h3>

            {/* CASILLA 1: DATOS BANCARIOS / LLUVIA DE SOBRES */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <label className="flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-colors">
                <span className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={incluirDatosBancarios}
                    onChange={(e) => setIncluirDatosBancarios(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <Gift className="w-4 h-4 text-amber-600" />
                  ¿El cliente desea recibir regalos mediante transferencia bancaria / lluvia de sobres?
                </span>
                {incluirDatosBancarios ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </label>

              {incluirDatosBancarios && (
                <div className="p-5 bg-white border-t border-stone-200 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Mensaje de Cortesía para Regalos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Tu presencia es nuestro mayor regalo. Pero si deseas tener un detalle:"
                      value={diseno.mensaje_regalo || ''}
                      onChange={(e) => setDiseno({ ...diseno, mensaje_regalo: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                        Nombre del Banco
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Pichincha / Produbanco"
                        value={diseno.cuenta_bancaria_regalo?.banco || ''}
                        onChange={(e) => setDiseno({
                          ...diseno,
                          cuenta_bancaria_regalo: {
                            ...(diseno.cuenta_bancaria_regalo || { tipo: 'Ahorros', titular: '', numero: '' }),
                            banco: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={diseno.cuenta_bancaria_regalo?.tipo || 'Ahorros'}
                        onChange={(e) => setDiseno({
                          ...diseno,
                          cuenta_bancaria_regalo: {
                            ...(diseno.cuenta_bancaria_regalo || { banco: 'Banco Pichincha', titular: '', numero: '' }),
                            tipo: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      >
                        <option value="Ahorros">Cuenta de Ahorros</option>
                        <option value="Corriente">Cuenta Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 2200112233"
                        value={diseno.cuenta_bancaria_regalo?.numero || ''}
                        onChange={(e) => setDiseno({
                          ...diseno,
                          cuenta_bancaria_regalo: {
                            ...(diseno.cuenta_bancaria_regalo || { banco: 'Banco Pichincha', tipo: 'Ahorros', titular: '' }),
                            numero: e.target.value.replace(/\D/g, '')
                          }
                        })}
                        className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                        Titular de la Cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Sofía Mendoza"
                        value={diseno.cuenta_bancaria_regalo?.titular || ''}
                        onChange={(e) => setDiseno({
                          ...diseno,
                          cuenta_bancaria_regalo: {
                            ...(diseno.cuenta_bancaria_regalo || { banco: 'Banco Pichincha', tipo: 'Ahorros', numero: '' }),
                            titular: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                        Cédula / Identificación
                      </label>
                      <input
                        type="text"
                        maxLength={13}
                        placeholder="Ej: 1712345678"
                        value={diseno.cuenta_bancaria_regalo?.cedula || ''}
                        onChange={(e) => setDiseno({
                          ...diseno,
                          cuenta_bancaria_regalo: {
                            ...(diseno.cuenta_bancaria_regalo || { banco: 'Banco Pichincha', tipo: 'Ahorros', titular: '', numero: '' }),
                            cedula: e.target.value.replace(/\D/g, '').slice(0, 13)
                          }
                        })}
                        className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CASILLA 2: CÓDIGO DE VESTIMENTA */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <label className="flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-colors">
                <span className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={incluirCodigoVestimenta}
                    onChange={(e) => setIncluirCodigoVestimenta(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <Shirt className="w-4 h-4 text-amber-600" />
                  ¿Especificar Código de Vestimenta (Dress Code)?
                </span>
                {incluirCodigoVestimenta ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </label>

              {incluirCodigoVestimenta && (
                <div className="p-5 bg-white border-t border-stone-200 space-y-3 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Ej: Formal / Traje oscuro o Vestido largo de noche"
                    value={diseno.codigo_vestimenta || ''}
                    onChange={(e) => setDiseno({ ...diseno, codigo_vestimenta: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
                  />
                  
                  {/* Botones de sugerencias rápidas */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-stone-500 py-1 mr-1">Opciones rápidas:</span>
                    {['Formal', 'Rigurosa Etiqueta', 'Guayabera / Playa', 'Cóctel', 'Semiformal', 'Tonos Pastel / Blanco'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setDiseno({ ...diseno, codigo_vestimenta: sug })}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CASILLA 3: MENSAJES PERSONALIZADOS */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <label className="flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-colors">
                <span className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={incluirMensajesPersonalizados}
                    onChange={(e) => setIncluirMensajesPersonalizados(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  ¿Personalizar Mensajes de Bienvenida y Despedida?
                </span>
                {incluirMensajesPersonalizados ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </label>

              {incluirMensajesPersonalizados && (
                <div className="p-5 bg-white border-t border-stone-200 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Mensaje de Bienvenida / Dedicatoria Inicial
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Queremos compartir este día tan especial e inolvidable con quienes más amamos..."
                      value={diseno.mensaje_bienvenida || ''}
                      onChange={(e) => setDiseno({ ...diseno, mensaje_bienvenida: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Mensaje de Cierre / Despedida
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: ¡Tu presencia es nuestro mejor regalo!"
                      value={diseno.mensaje_cierre || ''}
                      onChange={(e) => setDiseno({ ...diseno, mensaje_cierre: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Envío */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/admin/eventos"
            className="px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 text-sm font-semibold transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando evento...' : (esEdicion ? 'Guardar Cambios' : 'Crear y Pasar a Invitados')}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Heart, 
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Gift,
  X,
  CreditCard,
  Crown,
  GraduationCap,
  Feather,
  Wine,
  PartyPopper,
  Baby,
  Award,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calcularSha256 } from '../../lib/crypto';
import { formatearFechaHora } from '../../lib/dates';
import { obtenerInvitacionPorHash, registrarRsvpPorHash } from '../../lib/supabase';
import type { InvitacionPublicaData } from '../../types/database';
import { Countdown } from '../../components/Countdown';

// Definición de paletas visuales para cada tema
const ESTILOS_TEMA: Record<string, {
  fondo: string;
  tarjeta: string;
  borde: string;
  ribete: string;
  acentoTexto: string;
  acentoBg: string;
  botonPrimario: string;
  indicadorActivo: string;
  particulaColor: string;
}> = {
  dorado_luxury: {
    fondo: 'from-stone-950 via-stone-900 to-stone-950',
    tarjeta: 'bg-stone-900/95 border-amber-500/30 shadow-amber-950/40',
    borde: 'border-amber-500/30',
    ribete: 'from-transparent via-amber-400 to-transparent',
    acentoTexto: 'text-amber-400',
    acentoBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    botonPrimario: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 hover:from-amber-500 hover:to-amber-400 shadow-amber-900/50',
    indicadorActivo: 'bg-amber-400 shadow-amber-400/50',
    particulaColor: '#d97706'
  },
  romantico_floral: {
    fondo: 'from-rose-950 via-stone-900 to-rose-950',
    tarjeta: 'bg-stone-900/95 border-rose-500/30 shadow-rose-950/40',
    borde: 'border-rose-500/30',
    ribete: 'from-transparent via-rose-400 to-transparent',
    acentoTexto: 'text-rose-400',
    acentoBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    botonPrimario: 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white hover:from-rose-500 hover:to-rose-400 shadow-rose-900/50',
    indicadorActivo: 'bg-rose-400 shadow-rose-400/50',
    particulaColor: '#f43f5e'
  },
  esmeralda_botanico: {
    fondo: 'from-emerald-950 via-stone-900 to-emerald-950',
    tarjeta: 'bg-stone-900/95 border-emerald-500/30 shadow-emerald-950/40',
    borde: 'border-emerald-500/30',
    ribete: 'from-transparent via-emerald-400 to-transparent',
    acentoTexto: 'text-emerald-400',
    acentoBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    botonPrimario: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-900/50',
    indicadorActivo: 'bg-emerald-400 shadow-emerald-400/50',
    particulaColor: '#10b981'
  },
  zafiro_real: {
    fondo: 'from-blue-950 via-stone-900 to-blue-950',
    tarjeta: 'bg-stone-900/95 border-blue-500/30 shadow-blue-950/40',
    borde: 'border-blue-500/30',
    ribete: 'from-transparent via-blue-400 to-transparent',
    acentoTexto: 'text-blue-400',
    acentoBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    botonPrimario: 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white hover:from-blue-500 hover:to-blue-400 shadow-blue-900/50',
    indicadorActivo: 'bg-blue-400 shadow-blue-400/50',
    particulaColor: '#3b82f6'
  },
  lavanda_elegance: {
    fondo: 'from-purple-950 via-stone-900 to-purple-950',
    tarjeta: 'bg-stone-900/95 border-purple-500/30 shadow-purple-950/40',
    borde: 'border-purple-500/30',
    ribete: 'from-transparent via-purple-400 to-transparent',
    acentoTexto: 'text-purple-400',
    acentoBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    botonPrimario: 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white hover:from-purple-500 hover:to-purple-400 shadow-purple-900/50',
    indicadorActivo: 'bg-purple-400 shadow-purple-400/50',
    particulaColor: '#8b5cf6'
  },
  blanco_minimal: {
    fondo: 'from-stone-950 via-stone-900 to-stone-950',
    tarjeta: 'bg-stone-900/95 border-zinc-500/30 shadow-zinc-950/40',
    borde: 'border-zinc-500/30',
    ribete: 'from-transparent via-zinc-300 to-transparent',
    acentoTexto: 'text-zinc-300',
    acentoBg: 'bg-zinc-800 border-zinc-700 text-zinc-200',
    botonPrimario: 'bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 text-stone-950 hover:bg-white shadow-zinc-900/50',
    indicadorActivo: 'bg-zinc-300 shadow-zinc-300/50',
    particulaColor: '#a1a1aa'
  },
  quince_princesa: {
    fondo: 'from-pink-950 via-stone-900 to-pink-950',
    tarjeta: 'bg-stone-900/95 border-pink-500/30 shadow-pink-950/40',
    borde: 'border-pink-500/30',
    ribete: 'from-transparent via-pink-400 to-transparent',
    acentoTexto: 'text-pink-400',
    acentoBg: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
    botonPrimario: 'bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white hover:from-pink-500 hover:to-pink-400 shadow-pink-900/50',
    indicadorActivo: 'bg-pink-400 shadow-pink-400/50',
    particulaColor: '#ec4899'
  },
  neon_night: {
    fondo: 'from-violet-950 via-stone-950 to-cyan-950',
    tarjeta: 'bg-stone-900/95 border-cyan-500/30 shadow-cyan-950/40',
    borde: 'border-cyan-500/30',
    ribete: 'from-transparent via-cyan-400 to-transparent',
    acentoTexto: 'text-cyan-400',
    acentoBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    botonPrimario: 'bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600 text-white hover:opacity-95 shadow-cyan-900/50',
    indicadorActivo: 'bg-cyan-400 shadow-cyan-400/50',
    particulaColor: '#06b6d4'
  },
  celestial_angel: {
    fondo: 'from-sky-950 via-stone-900 to-amber-950',
    tarjeta: 'bg-stone-900/95 border-sky-400/30 shadow-sky-950/40',
    borde: 'border-sky-400/30',
    ribete: 'from-transparent via-amber-300 to-transparent',
    acentoTexto: 'text-sky-300',
    acentoBg: 'bg-sky-500/10 border-sky-400/30 text-sky-200',
    botonPrimario: 'bg-gradient-to-r from-sky-500 via-amber-400 to-sky-600 text-stone-950 font-bold hover:opacity-95 shadow-sky-900/50',
    indicadorActivo: 'bg-sky-400 shadow-sky-400/50',
    particulaColor: '#38bdf8'
  }
};

// 10 Arquetipos y Siluetas Estructurales de Diseño
const CONFIG_FORMAS_TARJETA: Record<string, { 
  id: string;
  contenedor: string; 
  alineacion: 'center' | 'left';
  estiloBoton: 'royal' | 'vogue' | 'ticket' | 'lacre' | 'cyber' | 'botanico' | 'polaroid' | 'artdeco' | 'glass' | 'celestial';
}> = {
  gala_royal: {
    id: 'gala_royal',
    contenedor: 'rounded-t-[80px] rounded-b-3xl border-t-2 border-b-2 border-amber-500/40 shadow-2xl pt-7 bg-stone-900/95',
    alineacion: 'center',
    estiloBoton: 'royal',
  },
  editorial_vogue: {
    id: 'editorial_vogue',
    contenedor: 'rounded-none border-l-4 border-amber-400 pl-6 pr-5 py-8 shadow-2xl bg-stone-900',
    alineacion: 'left',
    estiloBoton: 'vogue',
  },
  pasaporte_ticket: {
    id: 'pasaporte_ticket',
    contenedor: 'rounded-2xl border-2 border-dashed border-amber-500/40 shadow-2xl relative before:absolute before:top-1/3 before:-left-3.5 before:w-7 before:h-7 before:bg-stone-950 before:rounded-full after:absolute after:top-1/3 after:-right-3.5 after:w-7 after:h-7 after:bg-stone-950 after:rounded-full bg-stone-900/95 p-6',
    alineacion: 'center',
    estiloBoton: 'ticket',
  },
  sobre_clasico: {
    id: 'sobre_clasico',
    contenedor: 'rounded-3xl border-4 border-double border-amber-600/40 shadow-2xl bg-stone-900/95 p-6',
    alineacion: 'center',
    estiloBoton: 'lacre',
  },
  cyber_neon: {
    id: 'cyber_neon',
    contenedor: 'rounded-xl border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-black/95 [clip-path:polygon(0%_16px,16px_0%,calc(100%-16px)_0%,100%_16px,100%_calc(100%-16px),calc(100%-16px)_100%,16px_100%,0%_calc(100%-16px))] p-6',
    alineacion: 'center',
    estiloBoton: 'cyber',
  },
  botanico_jardin: {
    id: 'botanico_jardin',
    contenedor: 'rounded-[45px] border-2 border-emerald-500/30 shadow-2xl p-7 bg-stone-900/90',
    alineacion: 'center',
    estiloBoton: 'botanico',
  },
  minimalista_polaroid: {
    id: 'minimalista_polaroid',
    contenedor: 'rounded-sm border-8 border-stone-200/90 border-b-[44px] shadow-2xl bg-stone-900 text-stone-100 p-5 relative before:absolute before:-top-3 before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-6 before:bg-amber-100/40 before:backdrop-blur-sm before:rotate-1',
    alineacion: 'center',
    estiloBoton: 'polaroid',
  },
  joya_artdeco: {
    id: 'joya_artdeco',
    contenedor: 'rounded-2xl border-2 border-amber-400/60 shadow-2xl [clip-path:polygon(24px_0%,calc(100%-24px)_0%,100%_24px,100%_calc(100%-24px),calc(100%-24px)_100%,24px_100%,0%_calc(100%-24px),0%_24px)] p-6 bg-stone-900/95',
    alineacion: 'center',
    estiloBoton: 'artdeco',
  },
  cristal_glass: {
    id: 'cristal_glass',
    contenedor: 'rounded-3xl border border-white/20 backdrop-blur-3xl bg-stone-900/50 shadow-2xl p-7',
    alineacion: 'center',
    estiloBoton: 'glass',
  },
  celestial_mistico: {
    id: 'celestial_mistico',
    contenedor: 'rounded-t-full rounded-b-3xl border-t-2 border-amber-400/50 border-x border-b shadow-[0_0_25px_rgba(251,191,36,0.2)] bg-gradient-to-b from-indigo-950/90 to-stone-950 pt-8 p-6',
    alineacion: 'center',
    estiloBoton: 'celestial',
  }
};

// Emblema e icono superior personalizado según el tipo de celebración
function renderDistintivoEvento(tipo: string, temaAcento: string) {
  switch (tipo) {
    case 'boda':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
          <span>Nuestra Boda</span>
        </div>
      );
    case 'quinceanos':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Mis XV Años</span>
        </div>
      );
    case 'graduacion':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <GraduationCap className="w-4 h-4 text-sky-400" />
          <span>Graduación Académica</span>
        </div>
      );
    case 'bautizo':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Feather className="w-3.5 h-3.5 text-sky-300" />
          <span>Santo Bautismo</span>
        </div>
      );
    case 'primera_comunion':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          <span>Primera Comunión</span>
        </div>
      );
    case 'cumpleanos_infantil':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <PartyPopper className="w-4 h-4 text-pink-400" />
          <span>¡Estás Invitado a mi Fiesta!</span>
        </div>
      );
    case 'cumpleanos_adulto':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Wine className="w-3.5 h-3.5 text-amber-400" />
          <span>Celebración de Cumpleaños</span>
        </div>
      );
    case 'baby_shower':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Baby className="w-4 h-4 text-pink-300" />
          <span>Baby Shower Especial</span>
        </div>
      );
    case 'aniversario':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Wine className="w-3.5 h-3.5 text-amber-400" />
          <span>Aniversario de Bodas</span>
        </div>
      );
    case 'corporativo':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>Gala Institucional</span>
        </div>
      );
    case 'despedida_soltera':
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Wine className="w-3.5 h-3.5 text-pink-400" />
          <span>Despedida de Soltera</span>
        </div>
      );
    default:
      return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase ${temaAcento}`}>
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Invitación Especial</span>
        </div>
      );
  }
}

export function InvitacionPublica() {
  const { token } = useParams<{ token: string }>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<InvitacionPublicaData | null>(null);
  const [tokenHash, setTokenHash] = useState<string>('');

  // Control de páginas del libro (0: Portada, 1: Fecha y Lugar, 2: Detalles y Regalos, 3: RSVP)
  const [paginaActual, setPaginaActual] = useState(0);
  const totalPaginas = 4;

  // Estado para la animación de apertura
  const [abriendo, setAbriendo] = useState(false);

  // Estado para modal de datos bancarios / regalo
  const [mostrarModalRegalo, setMostrarModalRegalo] = useState(false);

  // Formulario RSVP
  const [nombreInvitadoGeneral, setNombreInvitadoGeneral] = useState('');
  const [seleccionRsvp, setSeleccionRsvp] = useState<'confirmado' | 'rechazado'>('confirmado');
  const [totalAsistentes, setTotalAsistentes] = useState<number>(1); // 1 a 4 personas
  const [enviandoRsvp, setEnviandoRsvp] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [copiadoCuenta, setCopiadoCuenta] = useState(false);

  useEffect(() => {
    async function cargar() {
      if (!token) {
        setError('Enlace de invitación no proporcionado.');
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        // Si el token es general (ej: general-uuid), no lo hasheamos para mantener su prefijo
        let hash = token;
        if (!token.startsWith('general-') && !token.startsWith('gen-')) {
          hash = await calcularSha256(token);
        }
        setTokenHash(hash);

        const res = await obtenerInvitacionPorHash(hash);

        // Verificar si este navegador o dispositivo ya registró respuesta previa en este enlace
        let rsvpLocal: { nombre?: string; estado?: 'confirmado' | 'rechazado'; acompanantes?: number; respondido_at?: string } | null = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = window.localStorage.getItem('rsvp_completado_' + (token || hash));
            if (raw) rsvpLocal = JSON.parse(raw);
          } catch {}
        }

        if (res && res.invitado) {
          if (rsvpLocal && rsvpLocal.respondido_at) {
            res.invitado.respondido_at = rsvpLocal.respondido_at;
            res.invitado.estado_rsvp = rsvpLocal.estado || res.invitado.estado_rsvp;
            res.invitado.numero_acompanantes = rsvpLocal.acompanantes ?? res.invitado.numero_acompanantes;
            if (res.es_general && rsvpLocal.nombre) {
              res.invitado.nombre = rsvpLocal.nombre;
            }
          }
          setSeleccionRsvp(res.invitado.estado_rsvp === 'rechazado' ? 'rechazado' : 'confirmado');
          setTotalAsistentes((res.invitado.numero_acompanantes || 0) + 1);
        }

        setDatos(res);
        if (!res.valido && !res.caducado) {
          setError(res.error || 'Invitación no válida.');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al procesar la invitación');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [token]);

  const handleAbrirInvitacion = () => {
    setAbriendo(true);
    // Lanzar efecto festivo sutil
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 }
    });

    setTimeout(() => {
      setPaginaActual(1);
      setAbriendo(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
  };

  const handleEnviarRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenHash) return;

    if (datos?.es_general && !nombreInvitadoGeneral.trim()) {
      alert('Por favor ingresa tu nombre completo para registrar tu asistencia.');
      return;
    }

    try {
      setEnviandoRsvp(true);
      const acompanantesFinales = seleccionRsvp === 'confirmado' ? Math.max(0, totalAsistentes - 1) : 0;
      const res = await registrarRsvpPorHash(
        tokenHash, 
        seleccionRsvp, 
        acompanantesFinales,
        nombreInvitadoGeneral.trim() || undefined
      );

      if (res && res.success) {
        const ahora = new Date().toISOString();
        const nombreFinal = datos?.es_general && nombreInvitadoGeneral.trim() 
          ? nombreInvitadoGeneral.trim() 
          : (datos?.invitado?.nombre || 'Invitado(a)');

        // Persistir en localStorage local para que cualquier recarga recuerde la confirmación
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem('rsvp_completado_' + (token || tokenHash), JSON.stringify({
              nombre: nombreFinal,
              estado: seleccionRsvp,
              acompanantes: acompanantesFinales,
              respondido_at: ahora
            }));
          } catch {}
        }

        setMensajeExito('¡Tu respuesta ha sido registrada exitosamente!');
        if (seleccionRsvp === 'confirmado') {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
        if (datos?.invitado) {
          setDatos({
            ...datos,
            invitado: {
              ...datos.invitado,
              nombre: nombreFinal,
              estado_rsvp: seleccionRsvp,
              numero_acompanantes: acompanantesFinales,
              respondido_at: ahora
            }
          });
        }
      } else {
        alert(res?.error || 'No se pudo guardar la respuesta.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al enviar respuesta');
    } finally {
      setEnviandoRsvp(false);
    }
  };

  const copiarCuenta = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiadoCuenta(true);
    setTimeout(() => setCopiadoCuenta(false), 2000);
  };

  const avanzarPagina = () => {
    if (paginaActual < totalPaginas - 1) {
      setPaginaActual(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const retrocederPagina = () => {
    if (paginaActual > 0) {
      setPaginaActual(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="text-center p-8">
          <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif-elegant text-amber-200 text-xl tracking-wider">
            Cargando tu invitación interactiva...
          </p>
        </div>
      </div>
    );
  }

  // REGLA DE CADUCIDAD (+7 DÍAS POST EVENTO)
  if (datos?.caducado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center shadow-xl text-stone-200">
          <div className="w-16 h-16 bg-stone-800 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="font-serif-elegant text-2xl font-bold text-white mb-2">
            Este evento ha finalizado
          </h1>
          <p className="text-stone-400 text-sm">
            La invitación ya no se encuentra disponible debido a que el plazo de acceso ha concluido.
          </p>
        </div>
      </div>
    );
  }

  if (error || !datos?.valido || !datos?.evento || !datos?.invitado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center shadow-xl text-stone-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invitación no encontrada</h1>
          <p className="text-stone-400 text-sm mb-6">
            {error || 'El enlace utilizado es inválido o no existe en nuestros registros.'}
          </p>
        </div>
      </div>
    );
  }

  const { evento, invitado } = datos;
  const diseno = evento.configuracion_diseno || {};

  // Obtener estilos del tema activo o usar dorado por defecto
  const temaId = diseno.tema || 'dorado_luxury';
  const tema = ESTILOS_TEMA[temaId] || ESTILOS_TEMA.dorado_luxury;

  // Silueta y forma de tarjeta (10 arquetipos disponibles)
  const estiloTarjeta = diseno.estilo_tarjeta || 'gala_royal';
  const configForma = CONFIG_FORMAS_TARJETA[estiloTarjeta] || CONFIG_FORMAS_TARJETA.gala_royal;

  // Clase de animación según efecto seleccionado (10 transiciones disponibles)
  const efectoTransicion = diseno.efecto_transicion || 'hoja_libro';
  const animacionClase = {
    sobre_gala: 'animate-envelope-open',
    hoja_libro: 'animate-book-flip',
    destello_magico: 'animate-magic-sparkle',
    cortina_suave: 'animate-curtain-drop',
    zoom_cinematico: 'animate-zoom-cinematic',
    persiana_veneciana: 'animate-venetian-blind',
    giro_3d_moneda: 'animate-flip-coin-3d',
    deslizamiento_lateral: 'animate-slide-in-right',
    burbuja_emergente: 'animate-bubble-pop',
    caida_petalos: 'animate-petal-float',
  }[efectoTransicion] || 'animate-book-flip';

  const nombresPaginas = ['Portada', 'Cuándo & Dónde', 'Detalles', 'Confirmar Asistencia'];

  // Determinar si ya respondió y no es una invitación general pendiente
  const yaRespondio = Boolean(invitado.respondido_at);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${tema.fondo} flex flex-col justify-between py-4 px-3 sm:px-4 relative overflow-x-hidden selection:bg-amber-300 selection:text-stone-900`}>
      {/* Fondo con micropartículas de diseño */}
      <div 
        className="fixed inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${tema.particulaColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/80 pointer-events-none" />

      {/* Barra superior de progreso tipo libro (Visible solo a partir de la página 1) */}
      {paginaActual > 0 ? (
        <div className="max-w-md mx-auto w-full z-20 mb-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium px-2 mb-2">
            <span className={`flex items-center gap-1.5 font-cinzel text-xs tracking-wider ${tema.acentoTexto}`}>
              <BookOpen className="w-4 h-4" />
              Página {paginaActual + 1} de {totalPaginas}
            </span>
            <span className="text-stone-300 font-serif-elegant italic text-sm">
              {nombresPaginas[paginaActual]}
            </span>
          </div>

          {/* Pestañas de progreso */}
          <div className="grid grid-cols-4 gap-1.5 bg-stone-900/90 p-1.5 rounded-full border border-stone-800 backdrop-blur">
            {nombresPaginas.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPaginaActual(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === paginaActual 
                    ? tema.indicadorActivo 
                    : i < paginaActual 
                      ? 'bg-stone-500 hover:bg-stone-400' 
                      : 'bg-stone-800 hover:bg-stone-700'
                }`}
                title={`Ir a ${nombresPaginas[i]}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-6" /> // Espaciador estético para la portada
      )}

      {/* CONTENEDOR CENTRAL: TARJETA MÓVIL RESPONSIVA CON SILUETA CONFIGURADA */}
      <div className="max-w-md mx-auto w-full relative z-10 flex-1 flex flex-col justify-center my-1">
        <div className={`${tema.tarjeta} ${configForma.contenedor} p-5 sm:p-8 relative overflow-hidden transition-all duration-500 ${animacionClase} min-h-[500px] flex flex-col justify-between`}>
          
          {/* Ribete decorativo superior e inferior */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tema.ribete}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tema.ribete}`} />

          {/* ========================================================
              PÁGINA 1: PORTADA & BIENVENIDA (DISEÑOS ESTRUCTURALES CÁLIDOS)
             ======================================================== */}
          {paginaActual === 0 && (
            estiloTarjeta === 'pasaporte_ticket' ? (
              /* ARQUETIPO: PASE DE INVITACIÓN ESPECIAL */
              <div className={`space-y-4 my-auto py-2 font-mono text-left ${animacionClase}`}>
                <div className="border-b-2 border-dashed border-amber-500/40 pb-2.5 flex justify-between items-center text-xs text-amber-400">
                  <span className="font-bold flex items-center gap-1.5">
                    🎟️ PASE DE INVITACIÓN ESPECIAL
                  </span>
                  <span className="bg-amber-400/20 px-2.5 py-0.5 rounded-full text-amber-300 font-bold text-[11px]">
                    ★ INVITADO DE HONOR ★
                  </span>
                </div>

                <div className="bg-stone-950/90 p-4 rounded-xl border border-stone-800 space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">CELEBRACIÓN:</span>
                      <h1 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {evento.titulo}
                      </h1>
                    </div>
                    <span className="text-2xl">🎉</span>
                  </div>

                  <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">RESERVADO PARA:</span>
                      <p className="font-bold text-amber-300 truncate">
                        {datos.es_general ? 'NUESTROS INVITADOS' : invitado.nombre}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase">ZONA:</span>
                      <p className="font-bold text-white">RECEPCIÓN PRINCIPAL</p>
                    </div>
                  </div>
                </div>

                <p className="text-stone-300 text-xs italic font-sans leading-relaxed text-center px-2">
                  "{diseno.mensaje_bienvenida || 'Tenemos el gran honor de invitarte a compartir este día tan especial junto a nosotros.'}"
                </p>

                <div className="pt-2 border-t-2 border-dashed border-amber-500/40 space-y-2.5">
                  <div className="flex justify-center items-center gap-1 opacity-70">
                    <div className="w-1.5 h-6 bg-stone-300" />
                    <div className="w-0.5 h-6 bg-stone-300" />
                    <div className="w-2.5 h-6 bg-stone-300" />
                    <div className="w-1 h-6 bg-stone-300" />
                    <div className="w-3 h-6 bg-stone-300" />
                    <div className="w-1 h-6 bg-stone-300" />
                    <div className="w-2 h-6 bg-stone-300" />
                    <div className="w-0.5 h-6 bg-stone-300" />
                    <div className="w-3 h-6 bg-stone-300" />
                  </div>
                  <button
                    type="button"
                    disabled={abriendo}
                    onClick={handleAbrirInvitacion}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold tracking-wider text-xs uppercase shadow-md transition-all active:scale-98"
                  >
                    {abriendo ? 'Abriendo...' : '🎟️ ABRIR MI INVITACIÓN'}
                  </button>
                </div>
              </div>
            ) : estiloTarjeta === 'editorial_vogue' ? (
              /* ARQUETIPO: REVISTA EDITORIAL ELEGANTE */
              <div className={`space-y-6 my-auto py-2 text-left ${animacionClase}`}>
                <div className="border-b-2 border-stone-200 pb-2 flex justify-between items-baseline text-xs font-mono uppercase tracking-widest text-stone-400">
                  <span className="font-bold text-stone-200">INVITACIÓN ESPECIAL</span>
                  <span>EDICIÓN CELEBRACIÓN</span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-serif-elegant italic text-stone-400 tracking-wider">
                    Una fecha inolvidable para celebrar juntos
                  </span>
                  <h1 className="font-serif-elegant text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase">
                    {evento.titulo}
                  </h1>
                  <div className="w-16 h-1 bg-amber-400" />
                </div>

                <div className="bg-stone-950/60 p-4 border-l-2 border-amber-400 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                    INVITADO(A) DE HONOR:
                  </span>
                  <p className="font-serif-elegant text-2xl text-stone-100 font-semibold italic">
                    {datos.es_general ? 'Nuestros Apreciables Invitados' : invitado.nombre}
                  </p>
                </div>

                <p className="text-stone-300 text-xs font-sans leading-relaxed">
                  {diseno.mensaje_bienvenida || 'Queremos compartir esta fecha inolvidable contigo.'}
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={abriendo}
                    onClick={handleAbrirInvitacion}
                    className="px-6 py-3.5 bg-stone-100 hover:bg-white text-stone-950 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-2xl transition-all active:scale-95"
                  >
                    <span>{abriendo ? 'Abriendo...' : 'Abrir Invitación'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : estiloTarjeta === 'cyber_neon' ? (
              /* ARQUETIPO: FIESTA NEÓN GLOW */
              <div className={`space-y-5 my-auto py-2 text-center font-mono ${animacionClase}`}>
                <div className="flex justify-between items-center text-xs text-cyan-400 border-b border-cyan-500/30 pb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>⚡ ¡NOCHE DE FIESTA Y CELEBRACIÓN!</span>
                  </span>
                  <span className="text-amber-300 font-bold text-[11px]">INVITADO VIP</span>
                </div>

                <div className="p-4 bg-cyan-950/30 border border-cyan-500/50 rounded-xl space-y-2 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  <span className="text-xs text-cyan-300 tracking-wider block font-bold">
                    ESTÁS CORDIALMENTE INVITADO(A) A:
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wide leading-tight">
                    {evento.titulo}
                  </h1>
                  <div className="pt-2 border-t border-cyan-500/30 text-xs text-stone-200">
                    Invitado(a) Especial: <strong className="text-cyan-300">{datos.es_general ? 'Todos Nuestros Amigos' : invitado.nombre}</strong>
                  </div>
                </div>

                <p className="text-stone-300 text-xs font-sans leading-relaxed">
                  "{diseno.mensaje_bienvenida || 'Prepárate para bailar, reír y celebrar una noche inolvidable.'}"
                </p>

                <button
                  type="button"
                  disabled={abriendo}
                  onClick={handleAbrirInvitacion}
                  className="w-full py-4 bg-cyan-950/90 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.5)] font-mono font-bold tracking-wider text-xs uppercase flex items-center justify-center gap-2 hover:bg-cyan-900 transition-all active:scale-98"
                >
                  <span>{abriendo ? 'Abriendo...' : '⚡ ABRIR INVITACIÓN'}</span>
                </button>
              </div>
            ) : estiloTarjeta === 'joya_artdeco' ? (
              /* ARQUETIPO: GRAN GATSBY 1920 */
              <div className={`space-y-5 my-auto py-2 text-center ${animacionClase}`}>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-cinzel tracking-[0.25em] uppercase">
                  <span>❖</span>
                  <div className="w-12 h-px bg-amber-400/60" />
                  <span>GALA & CELEBRACIÓN</span>
                  <div className="w-12 h-px bg-amber-400/60" />
                  <span>❖</span>
                </div>

                <div className="border-2 border-amber-400/60 p-5 rounded-lg bg-stone-950/70 space-y-2 relative shadow-lg">
                  <span className="text-[10px] text-amber-300 font-cinzel tracking-[0.2em] block uppercase">
                    C O R D I A L   I N V I T A C I Ó N
                  </span>
                  <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-100 tracking-wider uppercase leading-tight">
                    {evento.titulo}
                  </h1>
                  <div className="pt-2 border-t border-amber-400/30">
                    <span className="font-script text-3xl text-amber-300 block">
                      {datos.es_general ? 'Distinguidos Invitados' : invitado.nombre}
                    </span>
                  </div>
                </div>

                <p className="font-serif-elegant italic text-stone-300 text-xs px-2">
                  "{diseno.mensaje_bienvenida || 'Una velada de etiqueta, música y celebración inolvidable.'}"
                </p>

                <button
                  type="button"
                  disabled={abriendo}
                  onClick={handleAbrirInvitacion}
                  className="w-full py-3.5 border-2 border-amber-400 bg-stone-950 text-amber-300 font-cinzel tracking-[0.22em] text-xs font-bold uppercase shadow-xl hover:bg-amber-400 hover:text-stone-950 transition-all active:scale-98"
                >
                  {abriendo ? 'Abriendo...' : '❖ ABRIR INVITACIÓN ❖'}
                </button>
              </div>
            ) : estiloTarjeta === 'sobre_clasico' ? (
              /* ARQUETIPO: SOBRE CLÁSICO & LACRE */
              <div className={`space-y-5 my-auto py-2 text-center ${animacionClase}`}>
                <div className="border-b-2 border-amber-700/40 pb-2">
                  <span className="font-serif-elegant italic text-amber-400 text-xs">
                    ~ Carta de Invitación Personal ~
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-stone-400 text-xs uppercase tracking-widest font-light">
                    Tenemos el honor de invitarte a:
                  </p>
                  <h1 className="font-serif-elegant text-3xl font-normal text-white">
                    {evento.titulo}
                  </h1>
                </div>

                <div className="p-4 bg-stone-950/60 rounded-xl border border-stone-800 space-y-1">
                  <p className="text-stone-400 text-[10px] uppercase tracking-wider font-light">
                    Con aprecio para:
                  </p>
                  <p className="font-script text-3xl text-amber-300">
                    {datos.es_general ? 'Apreciables Invitados' : invitado.nombre}
                  </p>
                </div>

                <p className="font-serif-elegant italic text-stone-300 text-xs">
                  "{diseno.mensaje_bienvenida || 'Deseamos que seas parte de nuestra historia en este día tan esperado.'}"
                </p>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    disabled={abriendo}
                    onClick={handleAbrirInvitacion}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-800 via-red-900 to-rose-950 border-4 border-amber-400/80 shadow-2xl flex flex-col items-center justify-center text-amber-200 hover:scale-105 active:scale-95 transition-transform group"
                  >
                    <BookOpen className="w-6 h-6 mb-1 text-amber-300 group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] font-bold tracking-widest uppercase">ROMPE EL SELLO</span>
                  </button>
                </div>
              </div>
            ) : estiloTarjeta === 'minimalista_polaroid' ? (
              /* ARQUETIPO: FOTO POLAROID RETRO */
              <div className={`space-y-4 my-auto py-2 text-center ${animacionClase}`}>
                <div className="w-20 h-5 bg-amber-200/50 -mt-6 mx-auto rounded-sm backdrop-blur-xs rotate-[-2deg] border border-stone-400/30" />

                <div className="p-4 bg-stone-950/90 rounded border border-stone-700/60 space-y-2">
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                    MOMENTO INOLVIDABLE
                  </span>
                  <h1 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {evento.titulo}
                  </h1>
                  <p className="font-script text-2xl text-amber-300">
                    {datos.es_general ? 'Nuestros Amigos y Familia' : invitado.nombre}
                  </p>
                </div>

                <div className="pt-2 text-stone-800 font-mono text-xs italic bg-stone-100 p-2 rounded shadow-inner">
                  ✍️ "¡Prepárate para sonreír y celebrar con nosotros!"
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={abriendo}
                    onClick={handleAbrirInvitacion}
                    className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold rotate-[-3deg] shadow-lg border border-stone-800 transition-all active:scale-95"
                  >
                    <span>{abriendo ? 'Abriendo...' : '📌 ABRIR RECUERDO'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* gala_royal, botanico_jardin, cristal_glass, celestial_mistico */
              <div className={`space-y-6 my-auto py-4 ${animacionClase} ${configForma.alineacion === 'left' ? 'text-left' : 'text-center'}`}>
                {renderDistintivoEvento(evento.tipo, tema.acentoBg)}

                <div className="space-y-2">
                  <p className="text-stone-400 text-xs uppercase tracking-widest font-light">
                    Tenemos el honor de invitarte a:
                  </p>
                  <h1 className="font-serif-elegant text-3xl sm:text-4xl font-normal text-white leading-tight tracking-wide">
                    {evento.titulo}
                  </h1>
                </div>

                <div className="py-5 px-4 bg-stone-950/70 rounded-2xl border border-stone-800 shadow-inner">
                  {datos.es_general ? (
                    <div className="space-y-1.5">
                      <p className={`text-xs uppercase tracking-wider font-semibold ${tema.acentoTexto}`}>
                        ¡Estás Cordialmente Invitado(a)!
                      </p>
                      <p className="font-serif-elegant text-stone-300 text-sm leading-relaxed">
                        {diseno.mensaje_bienvenida || 'Queremos compartir este día tan memorable y esperado junto a ti y a tus seres queridos.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-stone-400 text-[11px] uppercase tracking-widest font-light">
                        Reservado especialmente con aprecio para:
                      </p>
                      <p className={`font-script text-3xl sm:text-4xl font-normal leading-relaxed ${tema.acentoTexto}`}>
                        {invitado.nombre}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {configForma.estiloBoton === 'botanico' ? (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        disabled={abriendo}
                        onClick={handleAbrirInvitacion}
                        className="px-8 py-3.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 shadow-lg font-serif-elegant text-base font-semibold flex items-center gap-2 transition-all active:scale-98"
                      >
                        <Feather className="w-4 h-4 text-emerald-300" />
                        <span>{abriendo ? 'Abriendo...' : 'Acompañarnos'}</span>
                      </button>
                    </div>
                  ) : configForma.estiloBoton === 'glass' ? (
                    <button
                      type="button"
                      disabled={abriendo}
                      onClick={handleAbrirInvitacion}
                      className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-serif-elegant text-base tracking-wide shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <span>{abriendo ? 'Abriendo...' : '✨ Abrir Invitación'}</span>
                    </button>
                  ) : configForma.estiloBoton === 'celestial' ? (
                    <button
                      type="button"
                      disabled={abriendo}
                      onClick={handleAbrirInvitacion}
                      className="w-full py-4 rounded-full bg-gradient-to-r from-indigo-900 via-amber-600 to-indigo-900 border border-amber-300 text-amber-100 font-bold font-serif-elegant tracking-widest text-base shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-98"
                    >
                      <span>{abriendo ? 'Abriendo...' : '🌙 Entrar a la Celebración'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={abriendo}
                      onClick={handleAbrirInvitacion}
                      className={`w-full py-4 px-6 rounded-2xl font-serif-elegant text-lg font-bold tracking-wide shadow-lg transition-all flex items-center justify-center gap-3 group active:scale-98 ${tema.botonPrimario}`}
                    >
                      <span>{abriendo ? 'Abriendo...' : 'Abrir Invitación'}</span>
                      <BookOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {/* ========================================================
              PÁGINA 2: FECHA, HORA, CONTADOR Y LUGAR (CLARO Y FÁCIL PARA CUALQUIER USUARIO)
             ======================================================== */}
          {paginaActual === 1 && (
            estiloTarjeta === 'pasaporte_ticket' ? (
              /* PÁGINA 2: ESTILO PASE DE CELEBRACIÓN */
              <div className={`space-y-4 my-auto text-left font-mono ${animacionClase}`}>
                <div className="border-b-2 border-dashed border-amber-500/40 pb-2 flex justify-between items-center text-xs text-amber-400">
                  <span className="font-bold flex items-center gap-1.5">
                    📅 FECHA, HORA Y SALÓN DEL EVENTO
                  </span>
                  <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 font-bold">
                    PUNTUALIDAD
                  </span>
                </div>

                <div className="bg-stone-950/90 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-start gap-3 border-b border-stone-800 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-400 block uppercase font-bold">DÍA Y HORA DEL EVENTO:</span>
                      <p className="text-white text-base font-bold capitalize mt-0.5">
                        {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] text-stone-400 block uppercase font-bold">LUGAR / SALÓN DE RECEPCIÓN:</span>
                      <p className="text-white text-base font-bold mt-0.5">
                        {evento.ubicacion_nombre}
                      </p>
                      {evento.ubicacion_url && (
                        <a
                          href={evento.ubicacion_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-all mt-2.5"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Ver Ubicación en Google Maps (GPS)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-950/80 rounded-xl border border-dashed border-amber-500/30 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block mb-1">
                    Falta exactamente:
                  </span>
                  <Countdown fechaIso={evento.fecha_evento} colorPrimario={diseno.color_primario} />
                </div>
              </div>
            ) : estiloTarjeta === 'editorial_vogue' ? (
              /* PÁGINA 2: ESTILO REVISTA EDITORIAL */
              <div className={`space-y-5 my-auto text-left ${animacionClase}`}>
                <div className="border-b-2 border-stone-200 pb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-stone-400 block">
                    CRONOGRAMA & LUGAR
                  </span>
                  <h2 className="font-serif-elegant text-3xl font-bold text-white uppercase tracking-tight mt-1">
                    Fecha & Ubicación
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-stone-950/80 border-l-4 border-amber-400 space-y-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400 block font-bold">
                      DÍA Y HORA DEL EVENTO:
                    </span>
                    <p className="font-serif-elegant text-xl text-white font-bold capitalize">
                      {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                    </p>
                  </div>

                  <div className="p-4 bg-stone-950/80 border-l-4 border-stone-600 space-y-1.5">
                    <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block font-bold">
                      LUGAR DE RECEPCIÓN:
                    </span>
                    <p className="font-serif-elegant text-lg text-white font-semibold">
                      {evento.ubicacion_nombre}
                    </p>
                    {evento.ubicacion_url && (
                      <a
                        href={evento.ubicacion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-white text-stone-950 font-bold text-xs rounded-md shadow-sm transition-all mt-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ver Ubicación en Google Maps (GPS)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-stone-950/60 border border-stone-800 text-center">
                  <Countdown fechaIso={evento.fecha_evento} colorPrimario={diseno.color_primario} />
                </div>
              </div>
            ) : estiloTarjeta === 'cyber_neon' ? (
              /* PÁGINA 2: ESTILO FIESTA NEÓN GLOW */
              <div className={`space-y-4 my-auto text-left font-mono ${animacionClase}`}>
                <div className="border-b border-cyan-500/40 pb-2 flex justify-between items-center text-xs text-cyan-400 font-bold">
                  <span>⚡ FECHA, HORA Y LUGAR DE LA FIESTA</span>
                  <span className="text-amber-300">¡NO FALTES!</span>
                </div>

                <div className="p-4 bg-cyan-950/30 border border-cyan-500/50 rounded-xl space-y-3.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div>
                    <span className="text-xs text-cyan-400 block uppercase font-bold">📅 FECHA Y HORA OFICIAL:</span>
                    <p className="text-white text-base font-bold capitalize mt-0.5">
                      {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-cyan-500/20">
                    <span className="text-xs text-cyan-400 block uppercase font-bold">📍 LUGAR DE LA RECEPCIÓN:</span>
                    <p className="text-white text-base font-bold mt-0.5">
                      {evento.ubicacion_nombre}
                    </p>
                    {evento.ubicacion_url && (
                      <a
                        href={evento.ubicacion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-all mt-2.5 font-mono"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ver Ubicación en Google Maps (GPS)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-black border-2 border-cyan-500/40 rounded-xl text-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block mb-1">
                    Cuenta Regresiva para la Celebración:
                  </span>
                  <Countdown fechaIso={evento.fecha_evento} colorPrimario={diseno.color_primario} />
                </div>
              </div>
            ) : estiloTarjeta === 'joya_artdeco' ? (
              /* PÁGINA 2: ESTILO GALA ART DÉCO */
              <div className={`space-y-4 my-auto text-center ${animacionClase}`}>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-cinzel tracking-[0.2em]">
                  <span>❖</span>
                  <div className="w-8 h-px bg-amber-400/60" />
                  <span>FECHA & SALÓN DE RECEPCIÓN</span>
                  <div className="w-8 h-px bg-amber-400/60" />
                  <span>❖</span>
                </div>

                <div className="border-2 border-amber-400/70 p-4 rounded-xl bg-stone-950/80 space-y-3 shadow-xl text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl border border-amber-400/60 bg-amber-400/10 flex items-center justify-center text-amber-300 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-cinzel text-xs text-amber-300 tracking-wider uppercase block font-bold">
                        DÍA & HORA OFICIAL
                      </span>
                      <p className="font-cinzel text-base font-bold text-amber-100 capitalize mt-0.5">
                        {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-400/30 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl border border-amber-400/60 bg-amber-400/10 flex items-center justify-center text-amber-300 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-cinzel text-xs text-amber-300 tracking-wider uppercase block font-bold">
                        LUGAR DE RECEPCIÓN
                      </span>
                      <p className="font-serif-elegant text-base text-white font-semibold mt-0.5">
                        {evento.ubicacion_nombre}
                      </p>
                      {evento.ubicacion_url && (
                        <a
                          href={evento.ubicacion_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 bg-amber-400 hover:bg-amber-300 text-stone-950 font-cinzel text-xs font-bold rounded-lg transition-colors mt-2"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Abrir en Google Maps (GPS)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-950/70 border border-amber-400/40 rounded-xl">
                  <Countdown fechaIso={evento.fecha_evento} colorPrimario={diseno.color_primario} />
                </div>
              </div>
            ) : (
              /* ESTILO CLÁSICO, BOTÁNICO, CRISTAL, CELESTIAL */
              <div className={`space-y-5 my-auto text-center ${animacionClase}`}>
                <div>
                  <p className={`text-xs uppercase tracking-widest font-semibold ${tema.acentoTexto}`}>
                    Cuenta Regresiva
                  </p>
                  <h2 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-white mt-1">
                    Fecha & Ubicación
                  </h2>
                </div>

                <div className="bg-stone-950/70 p-3 rounded-2xl border border-stone-800">
                  <Countdown fechaIso={evento.fecha_evento} colorPrimario={diseno.color_primario} />
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tema.acentoBg}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-stone-400 block">
                        Día y Hora Oficial
                      </span>
                      <p className="text-white text-base font-semibold capitalize mt-0.5">
                        {formatearFechaHora(evento.fecha_evento, evento.zona_horaria)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tema.acentoBg}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs uppercase tracking-wider font-bold text-stone-400 block">
                        Lugar de Recepción
                      </span>
                      <p className="text-white text-base font-semibold mt-0.5">
                        {evento.ubicacion_nombre}
                      </p>
                      {evento.ubicacion_url && (
                        <a
                          href={evento.ubicacion_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors mt-2 shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Ver Ubicación en Google Maps (GPS)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ========================================================
              PÁGINA 3: DETALLES, VESTIMENTA & REGALOS (LENGUAJE CÁLIDO)
             ======================================================== */}
          {paginaActual === 2 && (
            estiloTarjeta === 'pasaporte_ticket' ? (
              <div className={`space-y-4 my-auto text-left font-mono ${animacionClase}`}>
                <div className="border-b-2 border-dashed border-amber-500/40 pb-2 flex justify-between items-center text-xs text-amber-400">
                  <span className="font-bold flex items-center gap-1">
                    📋 CÓDIGO DE VESTIMENTA & DETALLES
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold">INFORMACIÓN</span>
                </div>

                {diseno.codigo_vestimenta && (
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-xs uppercase text-amber-400 font-bold block mb-1">
                      CÓDIGO DE VESTIMENTA SUGERIDO:
                    </span>
                    <p className="text-white text-sm font-bold">
                      {diseno.codigo_vestimenta}
                    </p>
                  </div>
                )}

                {evento.indicaciones && (
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">INDICACIONES:</span>
                    <p className="whitespace-pre-line leading-relaxed">{evento.indicaciones}</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-stone-950 border-2 border-dashed border-amber-500/40 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase">
                    <Gift className="w-4 h-4" />
                    <span>LLUVIA DE SOBRES & PRESENTES</span>
                  </div>
                  <p className="text-xs text-stone-300 italic font-sans leading-relaxed">
                    "{diseno.mensaje_regalo || 'Tu presencia es nuestro mayor regalo. Pero si deseas hacernos un detalle especial:'}"
                  </p>
                  {diseno.cuenta_bancaria_regalo?.numero && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalRegalo(true)}
                      className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase transition-all shadow-md active:scale-98"
                    >
                      💳 VER DATOS BANCARIOS / LLUVIA DE SOBRES
                    </button>
                  )}
                </div>
              </div>
            ) : estiloTarjeta === 'editorial_vogue' ? (
              <div className={`space-y-5 my-auto text-left ${animacionClase}`}>
                <div className="border-b-2 border-stone-200 pb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-stone-400 block">
                    DETALLES PARA INVITADOS
                  </span>
                  <h2 className="font-serif-elegant text-3xl font-bold text-white uppercase tracking-tight mt-1">
                    Vestimenta & Regalos
                  </h2>
                </div>

                {diseno.codigo_vestimenta && (
                  <div className="p-4 bg-stone-950/80 border-l-4 border-amber-400">
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400 block mb-1 font-bold">
                      CÓDIGO DE VESTIMENTA:
                    </span>
                    <p className="font-serif-elegant text-xl text-white font-semibold">
                      {diseno.codigo_vestimenta}
                    </p>
                  </div>
                )}

                {evento.indicaciones && (
                  <div className="p-3.5 bg-stone-950/50 border border-stone-800 text-xs text-stone-300">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block mb-1 font-bold">
                      INDICACIONES ESPECIALES:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{evento.indicaciones}</p>
                  </div>
                )}

                <div className="p-4 bg-stone-950/80 border-l-4 border-stone-200 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block font-bold">
                    PRESENTES & LLUVIA DE SOBRES:
                  </span>
                  <p className="font-serif-elegant italic text-stone-200 text-sm">
                    "{diseno.mensaje_regalo || 'Tu presencia es nuestro mejor regalo.'}"
                  </p>
                  {diseno.cuenta_bancaria_regalo?.numero && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalRegalo(true)}
                      className="mt-2 px-4 py-2 bg-stone-100 hover:bg-white text-stone-950 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Ver Datos Bancarios →
                    </button>
                  )}
                </div>
              </div>
            ) : estiloTarjeta === 'cyber_neon' ? (
              <div className={`space-y-4 my-auto text-left font-mono ${animacionClase}`}>
                <div className="border-b border-cyan-500/40 pb-2 flex justify-between items-center text-xs text-cyan-400 font-bold">
                  <span>DETALLES DE LA CELEBRACIÓN</span>
                  <span className="text-stone-300">INFORMACIÓN</span>
                </div>

                {diseno.codigo_vestimenta && (
                  <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/50 rounded-xl">
                    <span className="text-xs text-cyan-400 uppercase tracking-wider block mb-1 font-bold">
                      CÓDIGO DE VESTIMENTA:
                    </span>
                    <p className="text-white text-sm font-bold">
                      {diseno.codigo_vestimenta}
                    </p>
                  </div>
                )}

                {evento.indicaciones && (
                  <div className="p-3 bg-stone-950/70 border border-cyan-500/20 rounded-xl text-xs text-stone-300">
                    <span className="text-[10px] text-cyan-400 uppercase block mb-1 font-bold">INDICACIONES:</span>
                    <p className="whitespace-pre-line leading-relaxed">{evento.indicaciones}</p>
                  </div>
                )}

                <div className="p-4 bg-cyan-950/20 border border-cyan-500/40 rounded-xl space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <span className="text-xs text-cyan-300 uppercase tracking-wider block font-bold">
                    PRESENTES & LLUVIA DE SOBRES
                  </span>
                  <p className="text-stone-300 text-xs font-sans leading-relaxed">
                    "{diseno.mensaje_regalo || 'Tu presencia es nuestro mejor obsequio.'}"
                  </p>
                  {diseno.cuenta_bancaria_regalo?.numero && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalRegalo(true)}
                      className="w-full py-2.5 bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs uppercase font-mono font-bold tracking-wider hover:bg-cyan-900 transition-colors"
                    >
                      💳 VER DATOS BANCARIOS (LLUVIA DE SOBRES)
                    </button>
                  )}
                </div>
              </div>
            ) : estiloTarjeta === 'joya_artdeco' ? (
              <div className={`space-y-4 my-auto text-center ${animacionClase}`}>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-cinzel tracking-[0.2em]">
                  <span>❖</span>
                  <div className="w-8 h-px bg-amber-400/60" />
                  <span>ETIQUETA & PRESENTES</span>
                  <div className="w-8 h-px bg-amber-400/60" />
                  <span>❖</span>
                </div>

                {diseno.codigo_vestimenta && (
                  <div className="p-4 border border-amber-400/50 bg-stone-950/80 rounded-xl">
                    <span className="font-cinzel text-xs text-amber-300 uppercase tracking-widest block mb-1 font-bold">
                      CÓDIGO DE ETIQUETA
                    </span>
                    <p className="font-cinzel text-lg text-amber-100 font-bold">
                      {diseno.codigo_vestimenta}
                    </p>
                  </div>
                )}

                <div className="p-4 border-2 border-amber-400/60 bg-stone-950/90 rounded-xl space-y-2 shadow-lg">
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-cinzel text-xs uppercase tracking-wider font-bold">
                    <Gift className="w-4 h-4" />
                    <span>PRESENTES & LLUVIA DE SOBRES</span>
                  </div>
                  <p className="font-serif-elegant italic text-stone-200 text-xs">
                    "{diseno.mensaje_regalo || 'Tu presencia es nuestro regalo más apreciado.'}"
                  </p>
                  {diseno.cuenta_bancaria_regalo?.numero && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalRegalo(true)}
                      className="w-full py-2.5 border border-amber-400 bg-amber-400 text-stone-950 font-cinzel text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors"
                    >
                      ❖ Ver Información Bancaria ❖
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ESTILO CLÁSICO, BOTÁNICO, CRISTAL, CELESTIAL */
              <div className={`space-y-5 my-auto text-center ${animacionClase}`}>
                <div>
                  <p className={`text-xs uppercase tracking-widest font-semibold ${tema.acentoTexto}`}>
                    Información para Invitados
                  </p>
                  <h2 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-white mt-1">
                    Detalles Importantes
                  </h2>
                </div>

                {diseno.codigo_vestimenta && (
                  <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-center">
                    <span className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${tema.acentoTexto}`}>
                      Código de Vestimenta
                    </span>
                    <p className="text-white font-serif-elegant text-lg">
                      {diseno.codigo_vestimenta}
                    </p>
                  </div>
                )}

                {evento.indicaciones && (
                  <div className="p-3.5 rounded-2xl bg-stone-950/40 border border-stone-800/80 text-left">
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                      Indicaciones
                    </span>
                    <p className="text-stone-300 text-xs leading-relaxed whitespace-pre-line">
                      {evento.indicaciones}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400">
                    <Gift className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-wider font-semibold">
                      Presentes & Regalos
                    </span>
                  </div>

                  <p className="font-serif-elegant text-stone-300 text-sm italic leading-relaxed">
                    "{diseno.mensaje_regalo || 'Tu presencia es nuestro mejor y mayor regalo... pero si deseas obsequiarnos un detalle especial para esta ocasión:'}"
                  </p>

                  {diseno.cuenta_bancaria_regalo?.numero && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalRegalo(true)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${tema.acentoBg} hover:opacity-90`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Ver Datos Bancarios / Lluvia de Sobres</span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {/* ========================================================
              PÁGINA 4: CONFIRMACIÓN RSVP (CLARA Y AMIGABLE)
             ======================================================== */}
          {paginaActual === 3 && (
            <div className={`space-y-4 my-auto ${animacionClase}`}>
              <div className="text-center">
                <p className={`text-xs uppercase tracking-widest font-semibold ${tema.acentoTexto}`}>
                  Confirmación de Asistencia
                </p>
                <h2 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-white mt-1">
                  ¿Nos Acompañarás a Celebrar?
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Por favor confirma antes del: {formatearFechaHora(evento.fecha_limite_rsvp, evento.zona_horaria)}
                </p>
              </div>

              {mensajeExito && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {/* Si ya respondió previamente o acaba de responder: Mostrar estado SOLO LECTURA */}
              {yaRespondio ? (
                <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-stone-900 border border-stone-700">
                    {invitado.estado_rsvp === 'confirmado' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 uppercase tracking-wider block">
                      Estado Registrado
                    </span>
                    <p className={`text-base font-bold uppercase mt-0.5 ${invitado.estado_rsvp === 'confirmado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {invitado.estado_rsvp === 'confirmado' ? 'Asistencia Confirmada' : 'No Podré Asistir'}
                    </p>
                    {invitado.estado_rsvp === 'confirmado' && (
                      <p className="text-xs text-stone-300 mt-1">
                        Total de asistentes: <strong className="text-white">{(invitado.numero_acompanantes || 0) + 1} persona(s)</strong>
                      </p>
                    )}
                  </div>

                  {invitado.respondido_at && (
                    <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400">
                      Registrado el: {new Date(invitado.respondido_at).toLocaleString()}
                    </div>
                  )}

                  <p className="text-[11px] text-stone-400 italic bg-stone-900/50 p-2.5 rounded-xl border border-stone-800">
                    Tu respuesta ya se encuentra registrada de forma definitiva. Si requieres hacer algún cambio de último momento, por favor comunícate directamente con los organizadores.
                  </p>
                </div>
              ) : datos.rsvp_cerrado ? (
                <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center space-y-2">
                  <p className="text-stone-300 font-medium text-sm">
                    El plazo para confirmar asistencia ha concluido.
                  </p>
                  <p className="text-xs text-stone-400">
                    Estado: <strong className="uppercase text-amber-300">{invitado.estado_rsvp}</strong>
                  </p>
                </div>
              ) : (
                /* Formulario activo solo si NO ha respondido */
                <form onSubmit={handleEnviarRsvp} className="space-y-4">
                  {/* Si es invitación general, pedir nombre */}
                  {datos.es_general && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                        Tu Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Familia Gómez Paredes o Carlos Valencia"
                        value={nombreInvitadoGeneral}
                        onChange={(e) => setNombreInvitadoGeneral(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-950 rounded-xl border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Botones de Asistencia Sí / No */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSeleccionRsvp('confirmado')}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                        seleccionRsvp === 'confirmado'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 shadow-md'
                          : 'border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <CheckCircle className={`w-6 h-6 mb-1 ${seleccionRsvp === 'confirmado' ? 'text-emerald-400' : 'text-stone-600'}`} />
                      <span className="text-sm font-semibold">Sí, asistiré</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeleccionRsvp('rechazado')}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${
                        seleccionRsvp === 'rechazado'
                          ? 'border-rose-500 bg-rose-950/60 text-rose-200 shadow-md'
                          : 'border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <XCircle className={`w-6 h-6 mb-1 ${seleccionRsvp === 'rechazado' ? 'text-rose-400' : 'text-stone-600'}`} />
                      <span className="text-sm font-semibold">No podré asistir</span>
                    </button>
                  </div>

                  {/* Selector desplegable de 1 a 4 personas */}
                  {seleccionRsvp === 'confirmado' && (
                    <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-1.5">
                      <label className="flex items-center justify-between text-xs font-semibold text-stone-300 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-400" />
                          ¿Con cuántas personas asistirás?
                        </span>
                        <span className="text-stone-400 text-[11px] normal-case">
                          (Máx. 4)
                        </span>
                      </label>
                      <select
                        value={totalAsistentes}
                        onChange={(e) => setTotalAsistentes(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2.5 bg-stone-900 rounded-xl border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option value={1}>1 persona (Solo yo)</option>
                        <option value={2}>2 personas (Yo + 1 acompañante)</option>
                        <option value={3}>3 personas (Yo + 2 acompañantes)</option>
                        <option value={4}>4 personas (Yo + 3 acompañantes)</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enviandoRsvp}
                    className={`w-full py-3.5 px-6 rounded-2xl font-serif-elegant text-base font-bold tracking-wide shadow-lg transition-all disabled:opacity-50 ${tema.botonPrimario}`}
                  >
                    {enviandoRsvp ? 'Guardando respuesta...' : 'Confirmar Mi Asistencia'}
                  </button>
                </form>
              )}

              {/* Mensaje de cierre */}
              <p className="text-center text-xs italic text-stone-400 font-serif-elegant pt-2">
                {diseno.mensaje_cierre || '¡Tu presencia es nuestro mejor regalo!'}
              </p>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN INFERIOR (Solo visibles en páginas 1, 2 y 3. No en portada) */}
          {paginaActual > 0 && (
            <div className="flex items-center justify-between gap-3 pt-5 mt-3 border-t border-stone-800/80">
              <button
                type="button"
                onClick={retrocederPagina}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Número de página centrado */}
              <span className="text-[11px] font-mono text-stone-400">
                {paginaActual + 1} / {totalPaginas}
              </span>

              {paginaActual < totalPaginas - 1 ? (
                <button
                  type="button"
                  onClick={avanzarPagina}
                  className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${tema.botonPrimario}`}
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaginaActual(0)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-stone-300 bg-stone-800/80 hover:bg-stone-700 transition-all"
                >
                  <span>Inicio</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EMERGENTE: DATOS BANCARIOS / LLUVIA DE SOBRES */}
      {mostrarModalRegalo && diseno.cuenta_bancaria_regalo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-left space-y-4">
            <button
              type="button"
              onClick={() => setMostrarModalRegalo(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl border ${tema.acentoBg}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-elegant text-lg font-bold text-white">
                  Datos para Transferencia
                </h3>
                <p className="text-xs text-stone-400">Lluvia de Sobres / Obsequio</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs text-stone-200">
              {diseno.cuenta_bancaria_regalo.banco && (
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Banco</span>
                  <p className="font-semibold text-sm text-white">
                    {diseno.cuenta_bancaria_regalo.banco} {diseno.cuenta_bancaria_regalo.tipo ? `(${diseno.cuenta_bancaria_regalo.tipo})` : ''}
                  </p>
                </div>
              )}

              {diseno.cuenta_bancaria_regalo.numero && (
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Número de Cuenta</span>
                  <div className="flex items-center justify-between mt-1 p-2 rounded-lg bg-stone-900 border border-stone-700">
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {diseno.cuenta_bancaria_regalo.numero}
                    </span>
                    <button
                      type="button"
                      onClick={() => copiarCuenta(diseno.cuenta_bancaria_regalo?.numero || '')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] transition-colors"
                    >
                      {copiadoCuenta ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoCuenta ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {diseno.cuenta_bancaria_regalo.titular && (
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Titular de la Cuenta</span>
                  <p className="font-semibold text-white">{diseno.cuenta_bancaria_regalo.titular}</p>
                </div>
              )}

              {diseno.cuenta_bancaria_regalo.cedula && (
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Cédula / Identificación</span>
                  <p className="font-mono text-stone-300">{diseno.cuenta_bancaria_regalo.cedula}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMostrarModalRegalo(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* Pie de página discreto */}
      <footer className="text-center py-2 text-stone-500 text-[11px] z-10 font-mono">
        © {new Date().getFullYear()} {evento.titulo}
      </footer>
    </div>
  );
}

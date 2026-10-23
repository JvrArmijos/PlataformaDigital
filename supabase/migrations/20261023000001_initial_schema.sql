-- ====================================================================
-- MIGRACIÓN 1: MODELO DE DATOS INICIAL
-- Plataforma de Invitaciones Digitales Personalizadas
-- ====================================================================

-- Habilitar extensión pgcrypto para UUIDs y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLA PERFILES (Usuarios administrativos vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'admin' CHECK (rol IN ('admin', 'staff')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA CLIENTES (Contratantes de las invitaciones)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    correo TEXT,
    telefono TEXT,
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA EVENTOS
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'boda', -- boda, xv_anos, cumpleanos, bautizo, corporativo, etc.
    fecha_evento TIMESTAMPTZ NOT NULL,
    zona_horaria TEXT NOT NULL DEFAULT 'America/Guayaquil',
    fecha_limite_rsvp TIMESTAMPTZ NOT NULL,
    ubicacion_nombre TEXT NOT NULL,
    ubicacion_url TEXT,
    indicaciones TEXT,
    configuracion_diseno JSONB NOT NULL DEFAULT '{
        "color_primario": "#b45309",
        "color_secundario": "#fef3c7",
        "tema": "clasico_elegante",
        "musica_url": "",
        "permitir_ninos": true,
        "codigo_vestimenta": "Formal / Elegante"
    }'::jsonb,
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'finalizado', 'cancelado')),
    fecha_caducidad_invitaciones TIMESTAMPTZ NOT NULL,
    fecha_caducidad_panel TIMESTAMPTZ NOT NULL,
    fecha_eliminacion_datos TIMESTAMPTZ NOT NULL,
    datos_eliminados_at TIMESTAMPTZ,
    estado_retencion TEXT NOT NULL DEFAULT 'activa' CHECK (estado_retencion IN ('activa', 'pendiente_eliminacion', 'en_proceso', 'eliminada', 'retencion_excepcional')),
    motivo_retencion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA INVITADOS
CREATE TABLE IF NOT EXISTS public.invitados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    token_hash TEXT NOT NULL UNIQUE,
    estado_rsvp TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_rsvp IN ('pendiente', 'confirmado', 'rechazado')),
    numero_acompanantes INTEGER NOT NULL DEFAULT 0 CHECK (numero_acompanantes >= 0),
    max_acompanantes_permitidos INTEGER NOT NULL DEFAULT 0 CHECK (max_acompanantes_permitidos >= 0),
    respondido_at TIMESTAMPTZ,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA ACCESOS_CLIENTE (Enlaces privados para organizadores)
CREATE TABLE IF NOT EXISTS public.accesos_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    permiso TEXT NOT NULL DEFAULT 'solo_lectura' CHECK (permiso = 'solo_lectura'),
    expira_at TIMESTAMPTZ NOT NULL,
    revocado_at TIMESTAMPTZ,
    ultimo_acceso_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA HISTORIAL_RSVP (Auditoría de respuestas)
CREATE TABLE IF NOT EXISTS public.historial_rsvp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitado_id UUID NOT NULL REFERENCES public.invitados(id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    numero_acompanantes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA ENTREGAS_INVITACION (Registro de preparación y envío)
CREATE TABLE IF NOT EXISTS public.entregas_invitacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitado_id UUID NOT NULL REFERENCES public.invitados(id) ON DELETE CASCADE,
    canal TEXT NOT NULL CHECK (canal IN ('enlace', 'WhatsApp')),
    estado TEXT NOT NULL CHECK (estado IN ('preparado', 'enviado_manual', 'error_registrado')),
    enviado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA LOG_MANTENIMIENTO (Auditoría sin PII de las tareas automáticas)
CREATE TABLE IF NOT EXISTS public.log_mantenimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_tarea TEXT NOT NULL,
    eventos_finalizados INTEGER NOT NULL DEFAULT 0,
    accesos_revocados INTEGER NOT NULL DEFAULT 0,
    eventos_eliminados INTEGER NOT NULL DEFAULT 0,
    eventos_retenidos INTEGER NOT NULL DEFAULT 0,
    detalles_tecnicos JSONB,
    error_mensaje TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimización de rendimiento y búsquedas por token_hash
CREATE INDEX IF NOT EXISTS idx_invitados_evento_id ON public.invitados(evento_id);
CREATE INDEX IF NOT EXISTS idx_invitados_token_hash ON public.invitados(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitados_estado_rsvp ON public.invitados(estado_rsvp);
CREATE INDEX IF NOT EXISTS idx_accesos_cliente_evento_id ON public.accesos_cliente(evento_id);
CREATE INDEX IF NOT EXISTS idx_accesos_cliente_token_hash ON public.accesos_cliente(token_hash);
CREATE INDEX IF NOT EXISTS idx_eventos_cliente_id ON public.eventos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON public.eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fechas_caducidad ON public.eventos(fecha_caducidad_invitaciones, fecha_eliminacion_datos);
CREATE INDEX IF NOT EXISTS idx_historial_rsvp_invitado ON public.historial_rsvp(invitado_id);
CREATE INDEX IF NOT EXISTS idx_entregas_invitacion_invitado ON public.entregas_invitacion(invitado_id);

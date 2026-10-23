-- ====================================================================
-- MIGRACIÓN 3: SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Función de verificación de privilegios de Administrador
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = auth.uid()
          AND rol = 'admin'
          AND activo = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accesos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_invitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_mantenimiento ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para PERFILES
DROP POLICY IF EXISTS "Perfiles: lectura para el propio usuario o admin" ON public.perfiles;
CREATE POLICY "Perfiles: lectura para el propio usuario o admin"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "Perfiles: solo admin puede modificar" ON public.perfiles;
CREATE POLICY "Perfiles: solo admin puede modificar"
    ON public.perfiles FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 2. Políticas para CLIENTES
DROP POLICY IF EXISTS "Clientes: acceso exclusivo administrador" ON public.clientes;
CREATE POLICY "Clientes: acceso exclusivo administrador"
    ON public.clientes FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 3. Políticas para EVENTOS
DROP POLICY IF EXISTS "Eventos: acceso exclusivo administrador" ON public.eventos;
CREATE POLICY "Eventos: acceso exclusivo administrador"
    ON public.eventos FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 4. Políticas para INVITADOS
DROP POLICY IF EXISTS "Invitados: acceso exclusivo administrador" ON public.invitados;
CREATE POLICY "Invitados: acceso exclusivo administrador"
    ON public.invitados FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 5. Políticas para ACCESOS_CLIENTE
DROP POLICY IF EXISTS "Accesos cliente: exclusivo administrador" ON public.accesos_cliente;
CREATE POLICY "Accesos cliente: exclusivo administrador"
    ON public.accesos_cliente FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 6. Políticas para HISTORIAL_RSVP
DROP POLICY IF EXISTS "Historial RSVP: exclusivo administrador" ON public.historial_rsvp;
CREATE POLICY "Historial RSVP: exclusivo administrador"
    ON public.historial_rsvp FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 7. Políticas para ENTREGAS_INVITACION
DROP POLICY IF EXISTS "Entregas: exclusivo administrador" ON public.entregas_invitacion;
CREATE POLICY "Entregas: exclusivo administrador"
    ON public.entregas_invitacion FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 8. Políticas para LOG_MANTENIMIENTO
DROP POLICY IF EXISTS "Log mantenimiento: exclusivo administrador" ON public.log_mantenimiento;
CREATE POLICY "Log mantenimiento: exclusivo administrador"
    ON public.log_mantenimiento FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

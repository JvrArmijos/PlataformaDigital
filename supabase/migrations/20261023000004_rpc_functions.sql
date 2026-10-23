-- ====================================================================
-- MIGRACIÓN 4: FUNCIONES RPC DE SEGURIDAD Y OPERACIONES PRIVILEGIADAS
-- Todas estas funciones se ejecutan como SECURITY DEFINER para no otorgar
-- permisos directos de lectura a las tablas sensibles desde el cliente anónimo.
-- ====================================================================

-- 1. CONSULTA DE INVITACIÓN PÚBLICA MEDIANTE TOKEN HASH
CREATE OR REPLACE FUNCTION public.obtener_invitacion_por_token(p_token_hash TEXT)
RETURNS JSONB AS $$
DECLARE
    v_invitado RECORD;
    v_evento RECORD;
    v_ahora TIMESTAMPTZ := NOW();
    v_rsvp_cerrado BOOLEAN;
BEGIN
    -- Validar parámetro
    IF p_token_hash IS NULL OR LENGTH(TRIM(p_token_hash)) = 0 THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Token no proporcionado');
    END IF;

    -- Buscar invitado por hash del token
    SELECT i.id, i.evento_id, i.nombre, i.estado_rsvp, i.numero_acompanantes,
           i.max_acompanantes_permitidos, i.respondido_at, i.activo
    INTO v_invitado
    FROM public.invitados i
    WHERE i.token_hash = p_token_hash
      AND i.activo = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Invitación no válida o no encontrada');
    END IF;

    -- Buscar datos del evento
    SELECT e.id, e.titulo, e.tipo, e.fecha_evento, e.zona_horaria,
           e.fecha_limite_rsvp, e.ubicacion_nombre, e.ubicacion_url,
           e.indicaciones, e.configuracion_diseno, e.estado,
           e.fecha_caducidad_invitaciones
    INTO v_evento
    FROM public.eventos e
    WHERE e.id = v_invitado.evento_id;

    IF NOT FOUND OR v_evento.estado = 'cancelado' THEN
        RETURN jsonb_build_object('valido', false, 'error', 'El evento ya no se encuentra disponible');
    END IF;

    -- Regla de caducidad: Si superó la fecha de caducidad (+7 días post-evento), mostrar mensaje limpio
    IF v_ahora > v_evento.fecha_caducidad_invitaciones THEN
        RETURN jsonb_build_object(
            'valido', false,
            'caducado', true,
            'mensaje', 'Este evento ha finalizado'
        );
    END IF;

    -- Verificar si el plazo de confirmación está cerrado
    v_rsvp_cerrado := (v_ahora > v_evento.fecha_limite_rsvp);

    -- Devolver datos estrictamente necesarios, sin hash ni datos de otros invitados
    RETURN jsonb_build_object(
        'valido', true,
        'caducado', false,
        'rsvp_cerrado', v_rsvp_cerrado,
        'invitado', jsonb_build_object(
            'id', v_invitado.id,
            'nombre', v_invitado.nombre,
            'estado_rsvp', v_invitado.estado_rsvp,
            'numero_acompanantes', v_invitado.numero_acompanantes,
            'max_acompanantes_permitidos', v_invitado.max_acompanantes_permitidos,
            'respondido_at', v_invitado.respondido_at
        ),
        'evento', jsonb_build_object(
            'id', v_evento.id,
            'titulo', v_evento.titulo,
            'tipo', v_evento.tipo,
            'fecha_evento', v_evento.fecha_evento,
            'zona_horaria', v_evento.zona_horaria,
            'fecha_limite_rsvp', v_evento.fecha_limite_rsvp,
            'ubicacion_nombre', v_evento.ubicacion_nombre,
            'ubicacion_url', v_evento.ubicacion_url,
            'indicaciones', v_evento.indicaciones,
            'configuracion_diseno', v_evento.configuracion_diseno,
            'estado', v_evento.estado
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. REGISTRAR RESPUESTA RSVP DE INVITADO MEDIANTE TOKEN HASH
CREATE OR REPLACE FUNCTION public.registrar_respuesta_rsvp(
    p_token_hash TEXT,
    p_estado TEXT,
    p_acompanantes INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_invitado RECORD;
    v_evento RECORD;
    v_ahora TIMESTAMPTZ := NOW();
    v_acomp_final INT;
BEGIN
    -- Validar estado
    IF p_estado NOT IN ('confirmado', 'rechazado') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Estado de RSVP no válido');
    END IF;

    -- Buscar invitado
    SELECT id, evento_id, estado_rsvp, max_acompanantes_permitidos, activo
    INTO v_invitado
    FROM public.invitados
    WHERE token_hash = p_token_hash
      AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitación no válida');
    END IF;

    -- Buscar evento
    SELECT id, estado, fecha_limite_rsvp, fecha_caducidad_invitaciones
    INTO v_evento
    FROM public.eventos
    WHERE id = v_invitado.evento_id;

    -- Validar que el evento esté publicado y no caducado
    IF v_evento.estado NOT IN ('publicado', 'borrador') OR v_ahora > v_evento.fecha_caducidad_invitaciones THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este evento ha finalizado y no acepta respuestas');
    END IF;

    -- Validar fecha límite de RSVP
    IF v_ahora > v_evento.fecha_limite_rsvp THEN
        RETURN jsonb_build_object('success', false, 'error', 'El plazo para confirmar asistencia ha expirado');
    END IF;

    -- Validar acompañantes
    IF p_estado = 'rechazado' THEN
        v_acomp_final := 0;
    ELSE
        v_acomp_final := COALESCE(p_acompanantes, 0);
        IF v_acomp_final < 0 THEN
            v_acomp_final := 0;
        ELSIF v_acomp_final > v_invitado.max_acompanantes_permitidos THEN
            v_acomp_final := v_invitado.max_acompanantes_permitidos;
        END IF;
    END IF;

    -- Registrar auditoría en historial_rsvp
    INSERT INTO public.historial_rsvp (invitado_id, estado_anterior, estado_nuevo, numero_acompanantes)
    VALUES (v_invitado.id, v_invitado.estado_rsvp, p_estado, v_acomp_final);

    -- Actualizar invitado
    UPDATE public.invitados
    SET estado_rsvp = p_estado,
        numero_acompanantes = v_acomp_final,
        respondido_at = v_ahora,
        updated_at = v_ahora
    WHERE id = v_invitado.id;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', 'Tu respuesta ha sido registrada exitosamente',
        'estado_rsvp', p_estado,
        'numero_acompanantes', v_acomp_final,
        'respondido_at', v_ahora
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CONSULTA DE PANEL DEL ORGANIZADOR MEDIANTE TOKEN HASH (SOLO LECTURA)
CREATE OR REPLACE FUNCTION public.obtener_panel_organizador(p_token_hash TEXT)
RETURNS JSONB AS $$
DECLARE
    v_acceso RECORD;
    v_evento RECORD;
    v_metricas JSONB;
    v_invitados JSONB;
    v_ahora TIMESTAMPTZ := NOW();
BEGIN
    IF p_token_hash IS NULL OR LENGTH(TRIM(p_token_hash)) = 0 THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Token de acceso no proporcionado');
    END IF;

    -- Buscar acceso por hash
    SELECT id, evento_id, permiso, expira_at, revocado_at
    INTO v_acceso
    FROM public.accesos_cliente
    WHERE token_hash = p_token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Enlace privado no válido o no encontrado');
    END IF;

    -- Validar revocación
    IF v_acceso.revocado_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'revocado', true,
            'error', 'Este enlace privado ha sido revocado por el administrador'
        );
    END IF;

    -- Validar expiración (más de 30 días posteriores al evento)
    IF v_ahora > v_acceso.expira_at THEN
        RETURN jsonb_build_object(
            'valido', false,
            'expirado', true,
            'error', 'El enlace privado ha expirado según la política de retención (30 días tras el evento)'
        );
    END IF;

    -- Actualizar último acceso de forma segura
    UPDATE public.accesos_cliente
    SET ultimo_acceso_at = v_ahora
    WHERE id = v_acceso.id;

    -- Obtener datos del evento
    SELECT id, titulo, tipo, fecha_evento, zona_horaria, fecha_limite_rsvp,
           ubicacion_nombre, ubicacion_url, estado, fecha_caducidad_panel
    INTO v_evento
    FROM public.eventos
    WHERE id = v_acceso.evento_id;

    -- Obtener métricas agregadas del evento
    SELECT jsonb_build_object(
        'total_invitados', COUNT(*),
        'confirmados', COUNT(*) FILTER (WHERE estado_rsvp = 'confirmado'),
        'rechazados', COUNT(*) FILTER (WHERE estado_rsvp = 'rechazado'),
        'pendientes', COUNT(*) FILTER (WHERE estado_rsvp = 'pendiente'),
        'total_asistentes', COALESCE(SUM(CASE WHEN estado_rsvp = 'confirmado' THEN 1 + numero_acompanantes ELSE 0 END), 0),
        'total_acompanantes_confirmados', COALESCE(SUM(CASE WHEN estado_rsvp = 'confirmado' THEN numero_acompanantes ELSE 0 END), 0)
    )
    INTO v_metricas
    FROM public.invitados
    WHERE evento_id = v_acceso.evento_id
      AND activo = TRUE;

    -- Obtener lista de invitados para el organizador (SIN hashes, sin tokens)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'nombre', i.nombre,
            'telefono', i.telefono,
            'estado_rsvp', i.estado_rsvp,
            'numero_acompanantes', i.numero_acompanantes,
            'max_acompanantes_permitidos', i.max_acompanantes_permitidos,
            'respondido_at', i.respondido_at
        ) ORDER BY i.nombre ASC
    ), '[]'::jsonb)
    INTO v_invitados
    FROM public.invitados i
    WHERE i.evento_id = v_acceso.evento_id
      AND i.activo = TRUE;

    RETURN jsonb_build_object(
        'valido', true,
        'evento', jsonb_build_object(
            'id', v_evento.id,
            'titulo', v_evento.titulo,
            'tipo', v_evento.tipo,
            'fecha_evento', v_evento.fecha_evento,
            'zona_horaria', v_evento.zona_horaria,
            'fecha_limite_rsvp', v_evento.fecha_limite_rsvp,
            'ubicacion_nombre', v_evento.ubicacion_nombre,
            'ubicacion_url', v_evento.ubicacion_url,
            'estado', v_evento.estado,
            'expira_panel_at', v_acceso.expira_at
        ),
        'metricas', v_metricas,
        'invitados', v_invitados
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TAREA AUTOMÁTICA DE CADUCIDAD Y ELIMINACIÓN DE DATOS (IDEMPOTENTE)
CREATE OR REPLACE FUNCTION public.ejecutar_mantenimiento_caducidad_eliminacion()
RETURNS JSONB AS $$
DECLARE
    v_ahora TIMESTAMPTZ := NOW();
    v_finalizados INT := 0;
    v_revocados INT := 0;
    v_eliminados INT := 0;
    v_retenidos INT := 0;
    v_evento RECORD;
BEGIN
    -- PASO 1: Finalizar eventos con invitaciones caducadas (+7 días)
    WITH actualizados AS (
        UPDATE public.eventos
        SET estado = 'finalizado',
            updated_at = v_ahora
        WHERE fecha_caducidad_invitaciones < v_ahora
          AND estado = 'publicado'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_finalizados FROM actualizados;

    -- PASO 2: Revocar accesos de organizador vencidos (+30 días)
    WITH revocados AS (
        UPDATE public.accesos_cliente
        SET revocado_at = v_ahora
        WHERE expira_at < v_ahora
          AND revocado_at IS NULL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_revocados FROM revocados;

    -- PASO 3: Procesar eventos con fecha de eliminación cumplida (+90 días)
    FOR v_evento IN
        SELECT id, estado_retencion, motivo_retencion
        FROM public.eventos
        WHERE fecha_eliminacion_datos < v_ahora
          AND estado_retencion NOT IN ('eliminada', 'en_proceso')
    LOOP
        -- Comprobar si existe retención excepcional autorizada
        IF v_evento.estado_retencion = 'retencion_excepcional' THEN
            v_retenidos := v_retenidos + 1;
        ELSE
            -- Ejecutar eliminación segura de datos personales y dependencias
            -- Las cascadas de clave foránea eliminan historial_rsvp, entregas_invitacion, accesos e invitados
            DELETE FROM public.historial_rsvp WHERE invitado_id IN (SELECT id FROM public.invitados WHERE evento_id = v_evento.id);
            DELETE FROM public.entregas_invitacion WHERE invitado_id IN (SELECT id FROM public.invitados WHERE evento_id = v_evento.id);
            DELETE FROM public.invitados WHERE evento_id = v_evento.id;
            DELETE FROM public.accesos_cliente WHERE evento_id = v_evento.id;

            -- Limpiar información sensible del evento y marcar estado de retención como eliminada
            UPDATE public.eventos
            SET estado_retencion = 'eliminada',
                datos_eliminados_at = v_ahora,
                indicaciones = '[DATOS PERSONALES ELIMINADOS SEGÚN POLÍTICA DE PRIVACIDAD]',
                updated_at = v_ahora
            WHERE id = v_evento.id;

            v_eliminados := v_eliminados + 1;
        END IF;
    END LOOP;

    -- Registrar auditoría técnica sin PII en log_mantenimiento
    INSERT INTO public.log_mantenimiento (
        tipo_tarea,
        eventos_finalizados,
        accesos_revocados,
        eventos_eliminados,
        eventos_retenidos,
        detalles_tecnicos
    ) VALUES (
        'mantenimiento_diario_caducidad_eliminacion',
        v_finalizados,
        v_revocados,
        v_eliminados,
        v_retenidos,
        jsonb_build_object(
            'timestamp', v_ahora,
            'motor', 'pg_cron_o_rpc'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'timestamp', v_ahora,
        'eventos_finalizados', v_finalizados,
        'accesos_revocados', v_revocados,
        'eventos_eliminados', v_eliminados,
        'eventos_retenidos_excepcion', v_retenidos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permiso de ejecución para llamadas públicas anónimas a las funciones de token
GRANT EXECUTE ON FUNCTION public.obtener_invitacion_por_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_respuesta_rsvp(TEXT, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_panel_organizador(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ejecutar_mantenimiento_caducidad_eliminacion() TO authenticated;

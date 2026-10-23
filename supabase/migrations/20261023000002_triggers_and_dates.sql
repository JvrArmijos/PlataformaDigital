-- ====================================================================
-- MIGRACIÓN 2: CÁLCULO AUTOMÁTICO DE PLAZOS Y FECHAS
-- Regla de negocio:
-- - Invitaciones: +7 días desde fecha_evento
-- - Panel Organizador: +30 días desde fecha_evento
-- - Eliminación de datos: +90 días desde fecha_evento
-- ====================================================================

-- Función para calcular los 3 plazos a partir de fecha_evento
CREATE OR REPLACE FUNCTION public.calcular_plazos_evento()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo recalcular si se inserta o si fecha_evento / zona_horaria cambió
    IF (TG_OP = 'INSERT') OR (NEW.fecha_evento IS DISTINCT FROM OLD.fecha_evento) THEN
        -- No alterar fechas si el evento ya está en estado eliminado
        IF NEW.estado_retencion <> 'eliminada' THEN
            NEW.fecha_caducidad_invitaciones := NEW.fecha_evento + INTERVAL '7 days';
            NEW.fecha_caducidad_panel := NEW.fecha_evento + INTERVAL '30 days';
            NEW.fecha_eliminacion_datos := NEW.fecha_evento + INTERVAL '90 days';
            
            -- Si la fecha límite de RSVP no fue enviada o es posterior al evento, ajustarla a la fecha del evento
            IF NEW.fecha_limite_rsvp IS NULL OR NEW.fecha_limite_rsvp > NEW.fecha_evento THEN
                NEW.fecha_limite_rsvp := NEW.fecha_evento;
            END IF;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_plazos_evento ON public.eventos;
CREATE TRIGGER trg_calcular_plazos_evento
    BEFORE INSERT OR UPDATE OF fecha_evento, zona_horaria
    ON public.eventos
    FOR EACH ROW
    EXECUTE FUNCTION public.calcular_plazos_evento();

-- Trigger para mantener actualizados los accesos vigentes de clientes si cambia la fecha del evento
CREATE OR REPLACE FUNCTION public.actualizar_expiracion_accesos_evento()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.fecha_caducidad_panel IS DISTINCT FROM NEW.fecha_caducidad_panel) THEN
        UPDATE public.accesos_cliente
        SET expira_at = NEW.fecha_caducidad_panel
        WHERE evento_id = NEW.id
          AND revocado_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_expiracion_accesos ON public.eventos;
CREATE TRIGGER trg_actualizar_expiracion_accesos
    AFTER UPDATE OF fecha_caducidad_panel
    ON public.eventos
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_expiracion_accesos_evento();

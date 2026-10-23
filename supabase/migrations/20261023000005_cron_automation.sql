-- ====================================================================
-- MIGRACIÓN 5: PROGRAMACIÓN DE AUTOMATIZACIÓN (SUPABASE CRON)
-- Ejecución diaria programada a las 03:00 UTC (22:00 America/Guayaquil)
-- ====================================================================

-- Habilitar extensión pg_cron si está disponible en la instancia de Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar tarea diaria de caducidad y retención
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Desprogramar si ya existía una versión anterior
        PERFORM cron.unschedule('mantenimiento-diario-caducidad');
        
        -- Programar a las 03:00 UTC todos los días
        PERFORM cron.schedule(
            'mantenimiento-diario-caducidad',
            '0 3 * * *',
            'SELECT public.ejecutar_mantenimiento_caducidad_eliminacion();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron no disponible o permisos insuficientes. La tarea puede invocarse mediante Edge Function programada o GitHub Actions.';
END $$;

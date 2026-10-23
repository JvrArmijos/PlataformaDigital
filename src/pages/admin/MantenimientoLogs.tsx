import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Play, 
  ShieldAlert, 
  FileCheck2, 
  RefreshCw
} from 'lucide-react';
import { adminListarLogsMantenimiento, ejecutarMantenimientoManual, adminListarEventos } from '../../lib/supabase';
import type { LogMantenimiento, Evento } from '../../types/database';
import { formatearFechaCorta } from '../../lib/dates';

export function MantenimientoLogs() {
  const [logs, setLogs] = useState<LogMantenimiento[]>([]);
  const [eventosRetenidos, setEventosRetenidos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [resultadoUltimo, setResultadoUltimo] = useState<unknown>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataLogs, evs] = await Promise.all([
        adminListarLogsMantenimiento(),
        adminListarEventos()
      ]);
      setLogs(dataLogs);
      setEventosRetenidos(evs.filter(e => e.estado_retencion === 'retencion_excepcional'));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar registros');
    } finally {
      setCargando(false);
    }
  };

  const handleEjecutarMantenimiento = async () => {
    try {
      setEjecutando(true);
      const res = await ejecutarMantenimientoManual();
      setResultadoUltimo(res);
      await cargarDatos();
      alert('La tarea de caducidad y eliminación idempotente se ejecutó exitosamente.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error en la ejecución de mantenimiento');
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-purple-700 block">
            Políticas de Caducidad y Retención
          </span>
          <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
            Control de Tareas y Auditoría Técnica
          </h1>
          <p className="text-stone-500 text-xs mt-0.5">
            Supervisión técnica de la caducidad a 7 días, revocación a 30 días y eliminación segura a 90 días
          </p>
        </div>

        <button
          onClick={handleEjecutarMantenimiento}
          disabled={ejecutando}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {ejecutando ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {ejecutando ? 'Ejecutando tarea...' : 'Ejecutar Mantenimiento Ahora'}
        </button>
      </div>

      {resultadoUltimo != null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Resultado de la última ejecución:</p>
            <pre className="mt-1 font-mono text-[11px] bg-white/70 p-2 rounded-lg border border-emerald-100 overflow-x-auto">
              {JSON.stringify(resultadoUltimo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Excepciones de Retención Documentadas */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
        <h2 className="text-sm uppercase tracking-wider font-bold text-stone-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          Excepciones de Retención Autorizadas ({eventosRetenidos.length})
        </h2>
        <p className="text-xs text-stone-500">
          Eventos protegidos contra la eliminación automática de 90 días por justificación legal o contractual:
        </p>

        {eventosRetenidos.length === 0 ? (
          <p className="text-xs text-stone-400 italic">No existen eventos con excepciones de retención en este momento.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {eventosRetenidos.map((e) => (
              <div key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <strong className="text-stone-900 font-medium">{e.titulo}</strong>
                  <span className="text-stone-400 block text-[11px]">
                    Fecha evento: {formatearFechaCorta(e.fecha_evento)} | Eliminación prevista omitida: {formatearFechaCorta(e.fecha_eliminacion_datos)}
                  </span>
                </div>
                <div className="p-2 bg-purple-50 text-purple-800 rounded-xl border border-purple-200 text-[11px]">
                  <strong>Motivo:</strong> {e.motivo_retencion || 'No especificado'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial Técnico de Auditoría (Log Mantenimiento) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Historial de Ejecuciones Técnicas
            </h3>
            <p className="text-xs text-stone-500">
              Registrado sin información personal (PII) según sección 10.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-6">Fecha / Hora</th>
                <th className="py-3 px-4">Tarea</th>
                <th className="py-3 px-4 text-center">Invitaciones Finalizadas (+7d)</th>
                <th className="py-3 px-4 text-center">Accesos Revocados (+30d)</th>
                <th className="py-3 px-4 text-center">Datos Eliminados (+90d)</th>
                <th className="py-3 px-4 text-center">Excepciones Retenidas</th>
                <th className="py-3 px-6">Detalles Técnicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Cargando historial de auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No hay registros de ejecución todavía.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-6 text-stone-700 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {log.tipo_tarea}
                    </td>
                    <td className="py-3 px-4 text-center text-stone-800 font-semibold">
                      {log.eventos_finalizados}
                    </td>
                    <td className="py-3 px-4 text-center text-stone-800 font-semibold">
                      {log.accesos_revocados}
                    </td>
                    <td className="py-3 px-4 text-center text-stone-800 font-semibold">
                      {log.eventos_eliminados}
                    </td>
                    <td className="py-3 px-4 text-center text-purple-700 font-semibold">
                      {log.eventos_retenidos}
                    </td>
                    <td className="py-3 px-6 text-stone-500 font-mono text-[11px]">
                      {log.error_mensaje ? (
                        <span className="text-rose-600 font-semibold">{log.error_mensaje}</span>
                      ) : (
                        JSON.stringify(log.detalles_tecnicos || { ok: true })
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

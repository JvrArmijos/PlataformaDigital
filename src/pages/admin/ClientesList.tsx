import { useEffect, useState } from 'react';
import { Users, Plus, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { adminListarClientes, adminCrearCliente } from '../../lib/supabase';
import type { Cliente } from '../../types/database';

export function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const data = await adminListarClientes();
      setClientes(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      setGuardando(true);
      const nuevo = await adminCrearCliente({
        nombre: nombre.trim(),
        correo: correo.trim() || null,
        telefono: telefono.trim() || null,
        notas: notas.trim() || null,
        activo: true,
      });

      setClientes(prev => [...prev, nuevo]);
      setMostrarModal(false);
      setNombre('');
      setCorreo('');
      setTelefono('');
      setNotas('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al registrar cliente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif-elegant text-3xl font-bold text-stone-900">
            Clientes Registrados
          </h1>
          <p className="text-stone-500 text-xs mt-0.5">
            Gestión de contratantes de eventos y servicios de invitaciones
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Cliente
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Cargando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif-elegant text-xl font-bold text-stone-700">No hay clientes registrados</h3>
          <p className="text-stone-500 text-xs mt-1 mb-4">
            Registra a los organizadores o anfitriones antes de crear sus eventos.
          </p>
          <button
            onClick={() => setMostrarModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-elegant text-xl font-bold text-stone-900">
                    {c.nombre}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Activo
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  {c.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{c.telefono}</span>
                    </div>
                  )}
                  {c.correo && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{c.correo}</span>
                    </div>
                  )}
                  {c.notas && (
                    <div className="flex items-start gap-2 pt-1 text-stone-500">
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="italic">{c.notas}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 text-[11px] text-stone-400">
                Registrado: {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif-elegant text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Nuevo Cliente
            </h3>

            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nombre Completo / Familia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Familia Morales Castro"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+593 99 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Evento en Hacienda San Gabriel..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

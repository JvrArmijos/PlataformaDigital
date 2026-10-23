import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { AdminLogin } from './pages/admin/AdminLogin';
import { EventosList } from './pages/admin/EventosList';
import { EventoForm } from './pages/admin/EventoForm';
import { EventoInvitaciones } from './pages/admin/EventoInvitaciones';
import { ClientesList } from './pages/admin/ClientesList';
import { MantenimientoLogs } from './pages/admin/MantenimientoLogs';
import { InvitacionPublica } from './pages/public/InvitacionPublica';
import { PanelOrganizador } from './pages/public/PanelOrganizador';
import { NotFound } from './pages/public/NotFound';
import { supabase, isConfigured } from './lib/supabase';
import { useEffect, useState } from 'react';

// Wrapper de protección para rutas administrativas
function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function verificar() {
      if (isConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        setAutenticado(Boolean(data.session));
      } else {
        // En entorno mock / preview local
        const demoAuth = localStorage.getItem('admin_authenticated') === 'true';
        setAutenticado(demoAuth);
      }
    }
    verificar();
  }, [location]);

  if (autenticado === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/i/:token" element={<InvitacionPublica />} />
            <Route path="/asistencia/:token" element={<PanelOrganizador />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Rutas Administrativas Protegidas */}
            <Route
              path="/admin"
              element={
                <RequireAdminAuth>
                  <Navigate to="/admin/eventos" replace />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/eventos"
              element={
                <RequireAdminAuth>
                  <EventosList />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/eventos/nuevo"
              element={
                <RequireAdminAuth>
                  <EventoForm />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/eventos/:id"
              element={
                <RequireAdminAuth>
                  <EventoForm />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/eventos/:id/invitaciones"
              element={
                <RequireAdminAuth>
                  <EventoInvitaciones />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <RequireAdminAuth>
                  <ClientesList />
                </RequireAdminAuth>
              }
            />
            <Route
              path="/admin/mantenimiento"
              element={
                <RequireAdminAuth>
                  <MantenimientoLogs />
                </RequireAdminAuth>
              }
            />

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

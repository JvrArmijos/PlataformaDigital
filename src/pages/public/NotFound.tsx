import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-serif-elegant text-6xl font-bold text-amber-700">404</h1>
        <h2 className="text-xl font-bold text-stone-900">Página no encontrada</h2>
        <p className="text-stone-500 text-xs">
          La ruta que intentas consultar no existe o ha sido movida.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors"
          >
            <Home className="w-4 h-4" /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

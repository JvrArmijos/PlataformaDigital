import { useState, useEffect } from 'react';
import { obtenerTiempoRestante } from '../lib/dates';

interface CountdownProps {
  fechaIso: string;
  colorPrimario?: string;
  onFinalizado?: () => void;
}

export function Countdown({ fechaIso }: CountdownProps) {
  const [tiempo, setTiempo] = useState(() => obtenerTiempoRestante(fechaIso));

  useEffect(() => {
    const timer = setInterval(() => {
      const nuevo = obtenerTiempoRestante(fechaIso);
      setTiempo(nuevo);
    }, 1000);

    return () => clearInterval(timer);
  }, [fechaIso]);

  if (tiempo.haLlegado) {
    return (
      <div className="text-center py-4 px-6 bg-stone-100 rounded-2xl border border-stone-200">
        <p className="text-lg font-serif-elegant font-semibold text-stone-800">
          ¡El gran día ha llegado! 🎉
        </p>
      </div>
    );
  }

  const bloques = [
    { valor: tiempo.dias, etiqueta: 'Días' },
    { valor: tiempo.horas, etiqueta: 'Horas' },
    { valor: tiempo.minutos, etiqueta: 'Minutos' },
    { valor: tiempo.segundos, etiqueta: 'Segundos' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto my-6">
      {bloques.map((b, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-stone-200/60"
        >
          <span className="text-2xl sm:text-3xl font-bold font-cinzel text-stone-900 tracking-tight">
            {String(b.valor).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium mt-1">
            {b.etiqueta}
          </span>
        </div>
      ))}
    </div>
  );
}

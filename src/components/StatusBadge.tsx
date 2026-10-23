interface StatusBadgeProps {
  status: string;
  type?: 'evento' | 'rsvp' | 'retencion' | 'acceso';
}

export function StatusBadge({ status, type = 'evento' }: StatusBadgeProps) {
  let label = status;
  let classes = 'bg-stone-100 text-stone-700 border-stone-300';

  // Evento
  if (status === 'publicado') {
    label = 'Publicado';
    classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'borrador') {
    label = 'Borrador';
    classes = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'finalizado') {
    label = 'Finalizado';
    classes = 'bg-stone-100 text-stone-600 border-stone-200';
  } else if (status === 'cancelado') {
    label = 'Cancelado';
    classes = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  // RSVP
  if (type === 'rsvp') {
    if (status === 'confirmado') {
      label = 'Confirmado';
      classes = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (status === 'rechazado') {
      label = 'Rechazado';
      classes = 'bg-rose-50 text-rose-800 border-rose-300';
    } else {
      label = 'Pendiente';
      classes = 'bg-amber-50 text-amber-800 border-amber-300';
    }
  }

  // Retención
  if (type === 'retencion') {
    if (status === 'activa') {
      label = 'Retención Activa';
      classes = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (status === 'retencion_excepcional') {
      label = 'Excepción Autorizada';
      classes = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
    } else if (status === 'eliminada') {
      label = 'Datos Eliminados (90d)';
      classes = 'bg-stone-100 text-stone-500 border-stone-300 line-through';
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  );
}

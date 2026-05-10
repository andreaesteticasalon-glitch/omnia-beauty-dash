import { cn } from '@/lib/utils';
import { useAvailableSlots } from '@/hooks/useAvailability';
import { Service } from '@/lib/sampleData';

interface Props {
  service: Service;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return `${days[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function TimeSlotPicker({ service, date, selectedTime, onSelect }: Props) {
  const { data: slots = [], isLoading } = useAvailableSlots(service.id, date);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">Elige la hora</h2>
        <p className="text-sm text-gold mt-1 capitalize">{formatDate(date)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {service.name} · {service.duration} min
        </p>
      </div>

      {isLoading && (
        <div className="h-24 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && slots.length === 0 && (
        <div className="bg-card rounded-2xl border border-gold-light/30 p-6 text-center">
          <p className="text-muted-foreground text-sm">No hay horas disponibles para este día.</p>
          <p className="text-gold text-xs mt-1">Vuelve atrás y elige otro día.</p>
        </div>
      )}

      {!isLoading && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(time => (
            <button
              key={time}
              onClick={() => onSelect(time)}
              className={cn(
                'py-3 rounded-2xl border text-sm font-medium transition-all duration-150',
                selectedTime === time
                  ? 'bg-gold text-white border-gold shadow-md'
                  : 'bg-card border-gold-light/30 text-foreground hover:border-gold/50 hover:bg-gold/5',
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

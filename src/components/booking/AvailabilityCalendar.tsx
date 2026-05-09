import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvailableDays } from '@/hooks/useAvailability';

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface Props {
  serviceId: string;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function AvailabilityCalendar({ serviceId, selectedDate, onSelect }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: availableDays, isLoading } = useAvailableDays(serviceId, year, month);

  const firstDay = new Date(year, month, 1);
  // Monday-first offset: getDay() returns 0=Sun, adjust to 0=Mon
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Disable navigating to past months
  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">Elige el día</h2>
        <p className="text-sm text-gold mt-1">Días disponibles resaltados en dorado</p>
      </div>

      <div className="bg-card rounded-2xl border border-gold-light/30 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prev}
            disabled={isPrevDisabled}
            className="p-1.5 rounded-xl hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gold" />
          </button>
          <span className="font-serif font-medium text-foreground capitalize">
            {MONTHS[month]} {year}
          </span>
          <button onClick={next} className="p-1.5 rounded-xl hover:bg-gold/10 transition-colors">
            <ChevronRight className="h-5 w-5 text-gold" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gold/60 uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells before first day */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isPast = dateStr < todayStr;
              const isAvailable = availableDays?.has(dateStr) ?? false;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  disabled={isPast || !isAvailable}
                  onClick={() => onSelect(dateStr)}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150',
                    isSelected   && 'bg-gold text-white shadow-md scale-110',
                    !isSelected && isAvailable && !isPast
                                 && 'bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30',
                    isToday && !isSelected && 'ring-1 ring-gold ring-offset-1',
                    (isPast || !isAvailable) && 'text-muted-foreground/30 cursor-not-allowed',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

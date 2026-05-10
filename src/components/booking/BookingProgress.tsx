import { cn } from '@/lib/utils';

const STEPS = ['Tratamiento', 'Fecha', 'Hora', 'Tus datos'];

interface Props { current: number }

export function BookingProgress({ current }: Props) {
  return (
    <div className="flex items-center gap-1 w-full px-2 mb-6">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                done  && 'bg-gold border-gold text-white',
                active && 'bg-white border-gold text-gold shadow-md scale-110',
                !done && !active && 'bg-transparent border-gold/30 text-gold/40',
              )}>
                {done ? '✓' : step}
              </div>
              <span className={cn(
                'text-[9px] font-medium tracking-wide uppercase whitespace-nowrap',
                active ? 'text-gold' : done ? 'text-gold/70' : 'text-gold/30',
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1 mt-[-12px] rounded-full transition-all',
                step < current ? 'bg-gold' : 'bg-gold/20',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

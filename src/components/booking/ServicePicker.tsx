import { Clock, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service } from '@/lib/sampleData';

interface Props {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Facial: '💆', Uñas: '💅', Masajes: '🤲', Depilación: '✨',
  Micropigmentación: '🎨', Corporal: '🌿',
};

export function ServicePicker({ services, selectedId, onSelect }: Props) {
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">
          Elige tu tratamiento
        </h2>
        <p className="text-sm text-gold mt-1">Selecciona el servicio que deseas reservar</p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-2">
            {CATEGORY_ICONS[category] ?? '✦'} {category}
          </p>
          <div className="space-y-2">
            {items.map(service => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                  selectedId === service.id
                    ? 'border-gold bg-gradient-to-r from-gold/15 to-rosegold/10 shadow-md'
                    : 'border-gold-light/30 bg-card hover:border-gold/50 hover:bg-gold/5',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="flex items-center gap-0.5 text-lg font-serif font-semibold text-gold">
                      <Euro className="h-4 w-4" />
                      {service.price}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

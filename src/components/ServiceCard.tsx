import { Clock, Euro, Pencil, Trash2 } from 'lucide-react';
import { Service } from '@/lib/sampleData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-2xl p-4 shadow-soft border border-border/50',
      'transition-all duration-200 hover:shadow-md'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">{service.name}</h3>
          {service.category && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-primary/10 text-primary rounded-full">
              {service.category}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {service.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {service.description}
        </p>
      )}
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1 text-lg font-semibold text-foreground">
          <span>{service.price}</span>
          <Euro className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

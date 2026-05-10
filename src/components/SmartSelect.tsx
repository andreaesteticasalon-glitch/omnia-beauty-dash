import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SmartOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SmartSelectProps {
  options:      SmartOption[];
  value:        string;
  onChange:     (value: string) => void;
  onCreateNew:  () => void;
  placeholder?: string;
  createLabel?: string;
  loading?:     boolean;
  disabled?:    boolean;
  className?:   string;
}

export function SmartSelect({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder  = 'Seleccionar...',
  createLabel  = 'Crear nuevo...',
  loading      = false,
  disabled     = false,
  className,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'w-full justify-between font-normal h-10 px-3',
            'border-gold-light/50 hover:border-gold hover:bg-gold/5',
            'bg-card text-left',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex-1 min-w-0">
            {loading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold shrink-0" />
                Cargando...
              </span>
            ) : selected ? (
              <span className="flex flex-col items-start">
                <span className="truncate text-foreground">{selected.label}</span>
                {selected.subtitle && (
                  <span className="text-[10px] text-muted-foreground truncate">{selected.subtitle}</span>
                )}
              </span>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gold/50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 border-gold-light/30 shadow-luxury bg-card"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Buscar..."
            className="h-9 text-sm border-b border-gold-light/20"
          />
          <CommandList className="max-h-52">
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </CommandEmpty>

            <CommandGroup>
              {options.map(o => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.subtitle ?? ''}`}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                  className="cursor-pointer gap-2 py-2"
                >
                  <Check className={cn(
                    'h-4 w-4 text-gold shrink-0',
                    value === o.value ? 'opacity-100' : 'opacity-0',
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-foreground truncate">{o.label}</span>
                    {o.subtitle && (
                      <span className="text-[10px] text-muted-foreground truncate">{o.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="bg-gold-light/20" />

            <CommandGroup>
              <CommandItem
                value="__create_new__"
                onSelect={() => { setOpen(false); onCreateNew(); }}
                className="cursor-pointer gap-2 py-2.5 text-gold hover:text-gold-dark"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{createLabel}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

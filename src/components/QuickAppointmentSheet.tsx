import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmartSelect } from '@/components/SmartSelect';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { CalendarPlus, Clock, User, Sparkles, Bell } from 'lucide-react';

interface QuickAppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledDate: string;
  prefilledTime: string;
}

export function QuickAppointmentSheet({ 
  open, 
  onOpenChange, 
  prefilledDate, 
  prefilledTime 
}: QuickAppointmentSheetProps) {
  const navigate = useNavigate();
  const { clients, services, addAppointment, getClientById, getServiceById } = useData();
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setClientId('');
      setServiceId('');
      setNotes('');
    }
  }, [open, prefilledDate, prefilledTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !serviceId) {
      toast.error('Por favor selecciona cliente y servicio');
      return;
    }

    const service = getServiceById(serviceId);
    const client = getClientById(clientId);
    
    if (!service || !client) return;

    addAppointment({
      clientId,
      serviceId,
      date: prefilledDate,
      time: prefilledTime,
      price: service.price,
      notes,
      status: 'scheduled',
    });

    // Show confirmation toast with notification simulation
    const formattedDate = new Date(prefilledDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    toast.success(
      <div className="flex flex-col gap-1">
        <p className="font-medium">¡Cita confirmada!</p>
        <p className="text-sm text-muted-foreground">
          {client.name} - {service.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {formattedDate} a las {prefilledTime}
        </p>
        {client.email && (
          <p className="text-xs text-gold flex items-center gap-1 mt-1">
            <Bell className="h-3 w-3" />
            Notificación enviada a {client.email}
          </p>
        )}
      </div>,
      { duration: 5000 }
    );

    onOpenChange(false);
  };

  const formattedDate = new Date(prefilledDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
            <CalendarPlus className="h-5 w-5 text-gold" />
            Nueva Cita Rápida
          </SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Date & Time Display */}
          <div className="bg-gradient-to-r from-gold/10 to-rosegold/10 rounded-2xl p-4 border border-gold-light/40">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gold/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground capitalize">{formattedDate}</p>
                <p className="text-lg font-serif font-semibold text-gold">{prefilledTime}</p>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-gold" strokeWidth={1.5} />
              Cliente
            </Label>
            <SmartSelect
              value={clientId}
              onChange={setClientId}
              options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone ?? undefined }))}
              placeholder="Seleccionar cliente..."
              createLabel="Añadir nueva cliente"
              onCreateNew={() => { onOpenChange(false); navigate('/clients'); }}
            />
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-gold" strokeWidth={1.5} />
              Servicio
            </Label>
            <SmartSelect
              value={serviceId}
              onChange={setServiceId}
              options={services.map(s => ({ value: s.id, label: s.name, subtitle: `${s.price} €` }))}
              placeholder="Seleccionar servicio..."
              createLabel="Añadir nuevo servicio"
              onCreateNew={() => { onOpenChange(false); navigate('/services'); }}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-foreground">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añadir notas sobre la cita..."
              rows={3}
              className="rounded-2xl border-gold-light/50 focus:border-gold focus:ring-gold/30 bg-card"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="luxury" className="w-full" size="lg">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Confirmar Cita
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

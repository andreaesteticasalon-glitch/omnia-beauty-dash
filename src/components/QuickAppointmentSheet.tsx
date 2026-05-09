import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { CalendarPlus, Clock, User, Sparkles, Bell, UserPlus, ChevronDown, X } from 'lucide-react';

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
  const { clients, services, addAppointment, addClient, getClientById, getServiceById } = useData();
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');
  
  // New client form state
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Reset form when opened with new prefilled values
  useEffect(() => {
    if (open) {
      setClientId('');
      setServiceId('');
      setNotes('');
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
    }
  }, [open, prefilledDate, prefilledTime]);

  const handleCreateClient = () => {
    if (!newClientName.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    // Create new client and get the ID
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    addClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || undefined,
      email: newClientEmail.trim() || undefined,
    });

    // Find the newly created client (last one added)
    setTimeout(() => {
      const latestClients = [...clients];
      // Since addClient is async, we need to select the new client after state updates
      setClientId(newId);
    }, 0);

    toast.success(`Cliente "${newClientName}" creado`);
    
    // Reset new client form
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setShowNewClient(false);
  };

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
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <span>{client.name}</span>
                    {client.phone && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {client.phone}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* New Client Collapsible */}
            <Collapsible open={showNewClient} onOpenChange={setShowNewClient}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gold hover:text-gold-dark hover:bg-gold/10 gap-2 mt-1"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Nuevo Cliente</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${showNewClient ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 p-4 bg-gold/5 rounded-2xl border border-gold-light/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Crear nuevo cliente</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewClient(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gold-dark">Nombre *</Label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gold-dark">Teléfono</Label>
                  <Input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gold-dark">Email</Label>
                  <Input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  variant="gold"
                  size="sm"
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-gold" strokeWidth={1.5} />
              Servicio
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full gap-3">
                      <span>{service.name}</span>
                      <span className="text-gold font-medium">{service.price}€</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

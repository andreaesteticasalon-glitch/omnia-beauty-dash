import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/SmartSelect';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Calendar, Clock, User, Sparkles, Edit2, Trash2, X, Check, Save, Euro, Bell } from 'lucide-react';
import { Appointment } from '@/lib/sampleData';
import { ReminderButton } from '@/components/ReminderButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AppointmentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function AppointmentDetailSheet({ 
  open, 
  onOpenChange, 
  appointment 
}: AppointmentDetailSheetProps) {
  const navigate = useNavigate();
  const { clients, services, updateAppointment, deleteAppointment, getClientById, getServiceById, addLoyaltyPoints } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editClientId, setEditClientId] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (appointment && open) {
      setEditClientId(appointment.clientId);
      setEditServiceId(appointment.serviceId);
      setEditNotes(appointment.notes || '');
      setIsEditing(false);
    }
  }, [appointment, open]);

  if (!appointment) return null;

  const client = getClientById(appointment.clientId);
  const service = getServiceById(appointment.serviceId);

  const formattedDate = new Date(appointment.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const handleSave = () => {
    const newService = getServiceById(editServiceId);
    updateAppointment(appointment.id, {
      clientId: editClientId,
      serviceId: editServiceId,
      notes: editNotes,
      price: newService?.price || appointment.price,
    });
    setIsEditing(false);
    toast.success('Cita actualizada correctamente');
  };

  const handleComplete = () => {
    updateAppointment(appointment.id, { status: 'completed' });
    
    // Award loyalty points: 1 point per €10 spent
    const pointsEarned = Math.floor(appointment.price / 10);
    if (pointsEarned > 0) {
      addLoyaltyPoints(appointment.clientId, pointsEarned);
      toast.success(`Cita completada. ${client?.name} ganó ${pointsEarned} puntos de fidelidad! 🌟`);
    } else {
      toast.success('Cita marcada como completada');
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    updateAppointment(appointment.id, { status: 'cancelled' });
    toast.success('Cita cancelada');
    setShowCancelDialog(false);
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteAppointment(appointment.id);
    toast.success('Cita eliminada');
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-gold/20 text-gold-dark border border-gold-light/40">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border border-muted">Cancelada</Badge>;
      default:
        return <Badge variant="secondary" className="bg-rosegold/20 text-rosegold border border-rosegold/30">Programada</Badge>;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md bg-card border-l border-gold-light/30">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
                <Calendar className="h-5 w-5 text-gold" strokeWidth={1.5} />
                Detalles de Cita
              </SheetTitle>
              {getStatusBadge()}
            </div>
          </SheetHeader>
          
          <div className="mt-6 space-y-5">
            {/* Date & Time Display */}
            <div className="bg-gradient-to-r from-gold/10 to-rosegold/10 rounded-2xl p-4 border border-gold-light/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gold" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">{formattedDate}</p>
                  <p className="text-lg font-serif font-semibold text-gold">{appointment.time}</p>
                </div>
              </div>
            </div>

            {isEditing ? (
              <>
                {/* Edit Client */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    Cliente
                  </Label>
                  <SmartSelect
                    value={editClientId}
                    onChange={setEditClientId}
                    options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone ?? undefined }))}
                    placeholder="Seleccionar cliente..."
                    createLabel="Añadir nueva cliente"
                    onCreateNew={() => { setIsEditing(false); onOpenChange(false); navigate('/clients'); }}
                  />
                </div>

                {/* Edit Service */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    Servicio
                  </Label>
                  <SmartSelect
                    value={editServiceId}
                    onChange={setEditServiceId}
                    options={services.map(s => ({ value: s.id, label: s.name, subtitle: `${s.price} €` }))}
                    placeholder="Seleccionar servicio..."
                    createLabel="Añadir nuevo servicio"
                    onCreateNew={() => { setIsEditing(false); onOpenChange(false); navigate('/services'); }}
                  />
                </div>

                {/* Edit Notes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground">
                    <Edit2 className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    Notas
                  </Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Añadir notas sobre la cita..."
                    rows={3}
                  />
                </div>

                {/* Save/Cancel Edit */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} variant="luxury" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-gold-light/50 hover:bg-gold/5">
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* View Client */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    Cliente
                  </Label>
                  <p className="font-medium text-foreground">{client?.name || 'Cliente no encontrado'}</p>
                  {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                </div>

                {/* View Service */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    Servicio
                  </Label>
                  <p className="font-medium text-foreground">{service?.name || 'Servicio no encontrado'}</p>
                  <p className="text-gold font-serif font-semibold flex items-center gap-1">
                    <Euro className="h-4 w-4" strokeWidth={1.5} />
                    {appointment.price}€
                  </p>
                </div>

                {/* View Notes */}
                {appointment.notes && (
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Edit2 className="h-4 w-4 text-gold" strokeWidth={1.5} />
                      Notas
                    </Label>
                    <p className="text-sm text-foreground bg-gold/5 border border-gold-light/30 p-3 rounded-2xl">{appointment.notes}</p>
                  </div>
                )}

                {/* Reminder Section */}
                {appointment.status === 'scheduled' && client && service && (
                  <div className="space-y-2 pt-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Bell className="h-4 w-4 text-gold" strokeWidth={1.5} />
                      Enviar Recordatorio
                    </Label>
                    <ReminderButton
                      clientName={client.name}
                      clientPhone={client.phone}
                      serviceName={service.name}
                      date={appointment.date}
                      time={appointment.time}
                      price={appointment.price}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {appointment.status === 'scheduled' && (
                  <div className="space-y-2 pt-4">
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 border-gold-light/50 hover:bg-gold/5 hover:border-gold">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button onClick={handleComplete} variant="luxury" className="flex-1 shimmer-button animate-glow">
                        <Check className="h-4 w-4 mr-2" />
                        Completar
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowCancelDialog(true)} 
                        variant="outline" 
                        className="flex-1 border-amber-300/50 text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 hover:border-amber-400"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar Cita
                      </Button>
                      <Button 
                        onClick={() => setShowDeleteDialog(true)} 
                        variant="outline" 
                        className="flex-1 border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-card border border-gold-light/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              La cita quedará marcada como cancelada pero se mantendrá en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gold-light/50 hover:bg-gold/5">Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-amber-500 hover:bg-amber-600 text-white">
              Cancelar Cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border border-gold-light/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gold-light/50 hover:bg-gold/5">Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

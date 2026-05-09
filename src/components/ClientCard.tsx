import { User, Phone, Mail, Calendar } from 'lucide-react';
import { Client, Appointment } from '@/lib/sampleData';
import { cn } from '@/lib/utils';
import { LoyaltyBadge } from '@/components/LoyaltyBadge';

interface ClientCardProps {
  client: Client;
  appointments: Appointment[];
  onClick: () => void;
}

export function ClientCard({ client, appointments, onClick }: ClientCardProps) {
  const clientAppointments = appointments.filter(a => a.clientId === client.id);
  const completedAppointments = clientAppointments.filter(a => a.status === 'completed');
  const totalSpent = completedAppointments.reduce((sum, a) => sum + a.price, 0);
  const lastAppointment = clientAppointments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const loyaltyTier = client.loyaltyTier || 'bronze';
  const loyaltyPoints = client.loyaltyPoints || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-card rounded-2xl p-4 shadow-soft border border-border/50',
        'transition-all duration-200 hover:shadow-md hover:border-primary/30',
        'focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-full bg-primary/10 shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{client.name}</h3>
            <LoyaltyBadge tier={loyaltyTier} points={loyaltyPoints} size="sm" showPoints={false} />
          </div>
          {client.phone && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{completedAppointments.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Visitas</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{totalSpent} €</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
        </div>
        {lastAppointment && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(lastAppointment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
      </div>
    </button>
  );
}

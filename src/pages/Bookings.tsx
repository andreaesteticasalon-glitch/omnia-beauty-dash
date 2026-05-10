import { useState } from 'react';
import { Bell, CheckCircle2, History, Package } from 'lucide-react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookingRequestCard } from '@/components/admin/BookingRequestCard';
import { MaterialsPanel } from '@/components/admin/MaterialsPanel';
import { useBookingRequests, usePendingCount } from '@/hooks/useBookingRequests';
import { BookingRequestRow } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type BookingWithService = BookingRequestRow & {
  services: { name: string; price: number; duration: number; category: string | null } | null;
};

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

function HistoryCard({ booking }: { booking: BookingWithService }) {
  const statusLabel: Record<string, { label: string; cls: string }> = {
    accepted:  { label: 'Aceptada',  cls: 'bg-gold/10 text-gold border-gold/30' },
    rejected:  { label: 'Rechazada', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
    cancelled: { label: 'Cancelada', cls: 'bg-muted text-muted-foreground border-muted' },
  };
  const s = statusLabel[booking.status] ?? { label: booking.status, cls: '' };

  return (
    <div className="bg-card rounded-2xl border border-gold-light/20 p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{booking.client_name}</p>
        <p className="text-xs text-muted-foreground">{booking.services?.name} · {fmtDate(booking.requested_date)} {booking.requested_time}</p>
      </div>
      <Badge variant="secondary" className={cn('text-[10px] shrink-0 border', s.cls)}>{s.label}</Badge>
    </div>
  );
}

function ConfirmedCard({ booking }: { booking: BookingWithService }) {
  const confirmed = booking.client_confirmed;
  return (
    <div className="bg-card rounded-2xl border border-gold-light/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-foreground text-sm">{booking.client_name}</p>
        <Badge variant="secondary" className={cn(
          'text-[10px] border',
          confirmed === true  && 'bg-gold/10 text-gold border-gold/30',
          confirmed === false && 'bg-destructive/10 text-destructive border-destructive/30',
          confirmed === null  && 'bg-muted text-muted-foreground border-muted',
        )}>
          {confirmed === true ? '✅ Confirmada' : confirmed === false ? '❌ Cancelada' : '⏳ Sin respuesta'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {booking.services?.name} · {fmtDate(booking.requested_date)} · {booking.requested_time}
      </p>
      {booking.reminder_sent && (
        <p className="text-[10px] text-gold">Recordatorio WhatsApp enviado</p>
      )}
    </div>
  );
}

export default function Bookings() {
  const { data: pendingCount = 0 } = usePendingCount();
  const { data: pending = [] }     = useBookingRequests('pending');
  const { data: accepted = [] }    = useBookingRequests('accepted');
  const { data: history = [] }     = useBookingRequests();

  const historyList = (history as BookingWithService[]).filter(
    b => b.status === 'rejected' || b.status === 'cancelled',
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Reservas</h1>
            <p className="text-sm text-gold mt-0.5">Gestión de solicitudes de cita</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-rosegold text-white border-0 px-3">
              {pendingCount} nueva{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="pending" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30">
            <TabsTrigger value="pending" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <Bell className="h-3.5 w-3.5 mr-1" />
              Pendientes
              {pendingCount > 0 && (
                <span className="ml-1 h-4 w-4 rounded-full bg-rosegold text-white text-[9px] flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Confirmadas
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <History className="h-3.5 w-3.5 mr-1" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {(pending as BookingWithService[]).length === 0 ? (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <Bell className="h-8 w-8 text-gold/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay solicitudes pendientes</p>
              </div>
            ) : (
              (pending as BookingWithService[]).map(b => (
                <BookingRequestCard key={b.id} booking={b} />
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="mt-4 space-y-3">
            {(accepted as BookingWithService[]).map(b => (
              <ConfirmedCard key={b.id} booking={b} />
            ))}
            {(accepted as BookingWithService[]).length === 0 && (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <p className="text-sm text-muted-foreground">No hay reservas confirmadas</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {historyList.map(b => (
              <HistoryCard key={b.id} booking={b} />
            ))}
            {historyList.length === 0 && (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <p className="text-sm text-muted-foreground">Sin historial aún</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Materials panel */}
        <div className="bg-card rounded-3xl border border-gold-light/30 shadow-luxury p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-gold" />
            <h2 className="font-serif font-semibold text-foreground">Preparación del salón</h2>
          </div>
          <MaterialsPanel />
        </div>
      </main>
    </div>
  );
}

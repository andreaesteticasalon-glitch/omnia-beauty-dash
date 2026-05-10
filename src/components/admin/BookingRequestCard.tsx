import { useState } from 'react';
import { Phone, Calendar, Clock, Euro, Smartphone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAcceptBooking, useRejectBooking } from '@/hooks/useBookingRequests';
import { BookingRequestRow } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return `${days[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

type BookingWithService = BookingRequestRow & {
  services: { name: string; price: number; duration: number; category: string | null } | null;
};

interface Props { booking: BookingWithService }

export function BookingRequestCard({ booking }: Props) {
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  const isLoading = accept.isPending || reject.isPending;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(booking.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora mismo';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  })();

  return (
    <div className={cn(
      'bg-card rounded-2xl border p-4 space-y-3 transition-all',
      booking.channel === 'qr_web' ? 'border-gold-light/40' : 'border-green-500/30',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn(
            'text-[10px] px-2 py-0.5 font-medium',
            booking.channel === 'qr_web'
              ? 'bg-gold/10 text-gold border-gold/30'
              : 'bg-green-500/10 text-green-600 border-green-500/30',
          )}>
            {booking.channel === 'qr_web'
              ? <><Smartphone className="h-3 w-3 inline mr-1" />QR Web</>
              : <><MessageCircle className="h-3 w-3 inline mr-1" />WhatsApp</>
            }
          </Badge>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-gold/50 hover:text-gold">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Client */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-sm font-semibold text-gold shrink-0">
          {booking.client_name[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{booking.client_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />{booking.phone}
          </p>
        </div>
      </div>

      {/* Service + date */}
      <div className="bg-gold/5 rounded-xl p-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">💆</span>
          <span className="font-medium text-foreground">{booking.services?.name ?? '—'}</span>
          <span className="ml-auto flex items-center gap-0.5 text-gold font-serif font-semibold">
            <Euro className="h-3 w-3" />{booking.services?.price ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(booking.requested_date)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.requested_time}</span>
        </div>
      </div>

      {/* Expanded: notes + email */}
      {expanded && (
        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-gold-light/20">
          {booking.email && <p>📧 {booking.email}</p>}
          {booking.notes && <p>📝 {booking.notes}</p>}
        </div>
      )}

      {/* Reject note */}
      {showRejectNote && (
        <Textarea
          placeholder="Motivo del rechazo (opcional, se enviará al cliente)..."
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
          rows={2}
          className="text-xs rounded-xl border-gold-light/30 bg-card"
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => {
            if (!showRejectNote) { setShowRejectNote(true); return; }
            reject.mutate({ id: booking.id, phone: booking.phone, notes: rejectNote });
          }}
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 text-xs"
        >
          {showRejectNote ? 'Confirmar rechazo' : 'Rechazar'}
        </Button>
        <Button
          variant="luxury"
          size="sm"
          disabled={isLoading}
          onClick={() => accept.mutate(booking)}
          className="flex-1 text-xs"
        >
          {accept.isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Aceptando...
            </span>
          ) : '✅ Aceptar'}
        </Button>
      </div>

      {showRejectNote && (
        <button
          onClick={() => { setShowRejectNote(false); setRejectNote(''); }}
          className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}

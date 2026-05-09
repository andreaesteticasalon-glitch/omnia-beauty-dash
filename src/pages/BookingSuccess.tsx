import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fmt(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return `${days[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export default function BookingSuccess() {
  const { state } = useLocation() as { state: { clientName: string; serviceName: string; date: string; time: string } | null };

  return (
    <div className="min-h-screen marble-bg flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Logo */}
        <img src="/LOGO ANDREA.jpg" alt="AS Belleza y Bienestar" className="h-24 w-auto mx-auto object-contain" />

        {/* Success icon */}
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-gold" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            ¡Solicitud enviada!
          </h1>
          {state?.clientName && (
            <p className="text-gold mt-1">Hola, {state.clientName} 🌸</p>
          )}
        </div>

        {/* Booking details */}
        {state && (
          <div className="bg-card rounded-2xl border border-gold-light/30 p-5 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <span className="text-sm">💆</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tratamiento</p>
                <p className="font-medium text-foreground text-sm">{state.serviceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium text-foreground text-sm capitalize">{fmt(state.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hora</p>
                <p className="font-medium text-foreground text-sm">{state.time}</p>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp notice */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Recibirás un <strong>mensaje de WhatsApp</strong> cuando Andrea confirme tu reserva.
          </p>
        </div>

        <p className="text-xs text-muted-foreground px-4">
          Si tienes alguna duda puedes escribirnos directamente por WhatsApp.
        </p>

        {/* New booking button */}
        <Link to="/book">
          <Button variant="outline" className="w-full border-gold-light/50 text-gold hover:bg-gold/5">
            Hacer otra reserva
          </Button>
        </Link>
      </div>
    </div>
  );
}

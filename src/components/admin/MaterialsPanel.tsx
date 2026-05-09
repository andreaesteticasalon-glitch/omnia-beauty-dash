import { Package, Printer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpcomingAppointments } from '@/hooks/useBookingRequests';
import { useServiceMaterials } from '@/hooks/useServiceMaterials';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (d === today) return 'Hoy';
  if (d === tomorrow) return 'Mañana';
  return `${days[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

function AppointmentMaterials({ serviceId, clientName, time, date }: {
  serviceId: string; clientName: string; time: string; date: string;
}) {
  const { data: materials = [] } = useServiceMaterials(serviceId);

  return (
    <div className="border border-gold-light/20 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs font-semibold text-gold">{time}</span>
          <span className="text-xs text-muted-foreground">· {clientName}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{fmtDate(date)}</span>
      </div>
      {materials.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sin materiales registrados</p>
      ) : (
        <ul className="space-y-0.5">
          {materials.map(m => (
            <li key={m.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-gold shrink-0" />
                {m.brand ? `${m.product} (${m.brand})` : m.product}
              </span>
              {m.quantity && (
                <span className="text-muted-foreground">{m.quantity} {m.unit ?? ''}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MaterialsPanel() {
  const { data: appointments = [], isLoading } = useUpcomingAppointments(2);

  const handlePrint = () => window.print();

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gold" />
          <h3 className="font-medium text-foreground text-sm">Materiales próximas 48h</h3>
        </div>
        {appointments.length > 0 && (
          <Button onClick={handlePrint} variant="outline" size="sm"
            className="text-xs border-gold-light/40 text-gold hover:bg-gold/5 gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="h-16 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="bg-card rounded-2xl border border-gold-light/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">Sin citas en las próximas 48h</p>
        </div>
      )}

      {!isLoading && Object.entries(grouped).map(([date, apts]) => (
        <div key={date} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            {fmtDate(date)}
          </p>
          {apts.map(a => {
            const client = (a as unknown as { clients?: { name: string } }).clients;
            const service = (a as unknown as { services?: { id: string; name: string } }).services;
            if (!service) return null;
            return (
              <AppointmentMaterials
                key={a.id}
                serviceId={service.id}
                clientName={client?.name ?? 'Cliente'}
                time={a.time}
                date={a.date}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

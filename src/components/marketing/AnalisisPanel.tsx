import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Star, ImageIcon, Euro, Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { usePaymentRecords } from '@/hooks/useCaja';
import { useProductos } from '@/hooks/useInventario';
import { useRecentEvidencias } from '@/hooks/useEvidencias';
import { useSeguimientosPendientes } from '@/hooks/useSeguimiento';
import { analizarNegocio, AnalisisNegocio } from '@/lib/marketingEngine';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────

const PRIORIDAD_COLOR = {
  alta:  'border-rose-300/50 bg-rose-50/50 dark:bg-rose-400/5',
  media: 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-400/5',
  baja:  'border-blue-300/50 bg-blue-50/50 dark:bg-blue-400/5',
};
const PRIORIDAD_DOT = { alta: 'bg-rose-500', media: 'bg-amber-400', baja: 'bg-blue-400' };

// ── Componente ───────────────────────────────────────────────

interface AnalisisPanelProps {
  onGenerarPlan: (analisis: AnalisisNegocio, periodo: number) => void;
}

export function AnalisisPanel({ onGenerarPlan }: AnalisisPanelProps) {
  const [periodo, setPeriodo] = useState('14');
  const { appointments, services } = useData();
  const { data: payments = [] } = usePaymentRecords();
  const { data: inventario = [] } = useProductos();
  const { data: evidencias = [] } = useRecentEvidencias(50);
  const { data: seguimientos = [] } = useSeguimientosPendientes();

  const analisis = useMemo(() => analizarNegocio({
    appointments: appointments.map(a => ({
      id: a.id, clientId: a.clientId, serviceId: a.serviceId,
      date: a.date, time: a.time, price: a.price, status: a.status,
    })),
    payments: payments.map(p => ({
      id: p.id, service_name: p.service_name, amount: p.amount,
      created_at: p.created_at, service_id: p.service_id,
    })),
    services: services.map(s => ({ id: s.id, name: s.name, price: s.price, category: s.category })),
    inventario: inventario.map(i => ({
      id: i.id, nombre: i.nombre, stock_actual: i.stock_actual,
      stock_minimo: i.stock_minimo, stock_optimo: i.stock_optimo,
      precio_coste: i.precio_coste, categoria: i.categoria,
    })),
    evidencias: evidencias.map(e => ({
      id: e.id, tipo: e.tipo, url: e.url,
      tratamiento: e.tratamiento, uso_marketing: e.uso_marketing,
      client_id: e.client_id, appointment_id: e.appointment_id, service_id: e.service_id,
    })),
    seguimientos: seguimientos.map(s => ({ satisfaccion: s.satisfaccion })),
    periodoDias: parseInt(periodo),
  }), [appointments, payments, services, inventario, evidencias, seguimientos, periodo]);

  return (
    <div className="space-y-5">
      {/* Selector periodo */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Periodo de análisis:</span>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-36 h-8 text-xs border-gold-light/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="14">Últimos 14 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="60">Últimos 60 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-gold-light/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Euro className="h-4 w-4 text-gold" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Ingreso periodo</span>
          </div>
          <p className="text-xl font-serif font-bold text-gold">{analisis.ingresoTotal.toFixed(0)} €</p>
          <p className="text-[10px] text-muted-foreground">Ticket medio: {analisis.ticketMedio.toFixed(0)} €</p>
        </div>
        <div className="bg-card border border-gold-light/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-gold" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Satisfacción</span>
          </div>
          <p className="text-xl font-serif font-bold text-gold">
            {analisis.satisfaccionMedia ? analisis.satisfaccionMedia.toFixed(1) + ' ★' : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">{analisis.totalValoraciones} valoraciones</p>
        </div>
        <div className="bg-card border border-gold-light/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="h-4 w-4 text-gold" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Fotos marketing</span>
          </div>
          <p className="text-xl font-serif font-bold text-gold">{analisis.fotosMarketing.length}</p>
          <p className="text-[10px] text-muted-foreground">Disponibles para publicar</p>
        </div>
        <div className="bg-card border border-gold-light/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-gold" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Día más rentable</span>
          </div>
          <p className="text-xl font-serif font-bold text-gold">{analisis.diaMasRentable}</p>
          <p className="text-[10px] text-muted-foreground">Mayor volumen de ingresos</p>
        </div>
      </div>

      {/* Servicios más demandados */}
      {analisis.serviciosMasDemandados.length > 0 && (
        <div className="bg-card border border-gold-light/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground">Servicios más demandados</h3>
          </div>
          {analisis.serviciosMasDemandados.map(({ servicio, citas, ingresos }) => (
            <div key={servicio.id} className="flex items-center justify-between py-2 border-b border-gold-light/10 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{servicio.name}</p>
                <p className="text-xs text-muted-foreground">{citas} cita{citas !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-sm font-semibold text-gold">{ingresos.toFixed(0)} €</span>
            </div>
          ))}
        </div>
      )}

      {/* Servicios menos demandados */}
      {analisis.serviciosMenosDemandados.length > 0 && (
        <div className="bg-card border border-amber-300/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground">Servicios a impulsar</h3>
          </div>
          {analisis.serviciosMenosDemandados.map(({ servicio, citas }) => (
            <div key={servicio.id} className="flex items-center justify-between py-2 border-b border-gold-light/10 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{servicio.name}</p>
                <p className="text-xs text-amber-600">{citas} cita{citas !== 1 ? 's' : ''} — baja demanda</p>
              </div>
              <span className="text-xs text-muted-foreground">{servicio.price} €</span>
            </div>
          ))}
        </div>
      )}

      {/* Oportunidades detectadas */}
      {analisis.recomendaciones.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="h-4 w-4 text-gold" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground">Oportunidades detectadas</h3>
          </div>
          {analisis.recomendaciones.map((rec, i) => (
            <div key={i} className={cn('rounded-2xl border p-4 space-y-1', PRIORIDAD_COLOR[rec.prioridad])}>
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORIDAD_DOT[rec.prioridad])} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {rec.prioridad === 'alta' ? 'Urgente' : rec.prioridad === 'media' ? 'Recomendado' : 'Opcional'}
                </span>
              </div>
              <p className="text-sm text-foreground font-medium">{rec.motivo}</p>
              <p className="text-xs text-muted-foreground">{rec.sugerencia}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA Generar plan */}
      <Button
        onClick={() => onGenerarPlan(analisis, parseInt(periodo))}
        variant="luxury"
        className="w-full"
        size="lg"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Generar Plan a 10 días basado en este análisis
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

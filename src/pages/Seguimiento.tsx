import { useState } from 'react';
import { Bell, Phone, Mail, MessageCircle, Check, Star, Clock, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useSeguimientosPendientes, useKPIsSeguimiento, useUpdateSeguimiento,
  SeguimientoConCliente,
} from '@/hooks/useSeguimiento';
import { EstadoSeguimiento, CanalSeguimiento } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoSeguimiento, { label: string; color: string; bg: string }> = {
  pendiente:    { label: 'Pendiente',      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-300/50 dark:bg-amber-400/10' },
  contactado:   { label: 'Contactado',     color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-300/50 dark:bg-blue-400/10'    },
  respondido:   { label: 'Respondido',     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300/50 dark:bg-emerald-400/10' },
  sin_respuesta:{ label: 'Sin respuesta',  color: 'text-rose-500',    bg: 'bg-rose-50 border-rose-300/50 dark:bg-rose-400/10'    },
  cerrado:      { label: 'Cerrado',        color: 'text-muted-foreground', bg: 'bg-muted/30 border-muted'                        },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

function diasRestantes(fechaObj: string): number {
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const obj  = new Date(fechaObj); obj.setHours(0,0,0,0);
  return Math.ceil((obj.getTime() - hoy.getTime()) / 86400000);
}

function UrgencyChip({ dias }: { dias: number }) {
  if (dias < 0)  return <span className="text-[10px] font-bold text-rose-500">Vencido {Math.abs(dias)}d</span>;
  if (dias === 0) return <span className="text-[10px] font-bold text-amber-500">Hoy</span>;
  if (dias <= 2)  return <span className="text-[10px] font-bold text-amber-400">En {dias}d</span>;
  return               <span className="text-[10px] text-muted-foreground">En {dias}d</span>;
}

// ── KPI Card ─────────────────────────────────────────────────

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-gold-light/20 rounded-2xl p-4 text-center">
      <p className="text-2xl font-serif font-bold text-gold">{value}</p>
      <p className="text-xs text-foreground font-medium mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Estrellas de satisfacción ─────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}>
          <Star className={cn('h-6 w-6 transition-colors', n <= value ? 'text-gold fill-gold' : 'text-muted-foreground/30')} />
        </button>
      ))}
    </div>
  );
}

// ── Tarjeta de seguimiento ────────────────────────────────────

function SeguimientoCard({ seg }: { seg: SeguimientoConCliente }) {
  const [expanded, setExpanded]   = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sat, setSat]             = useState(0);
  const [notas, setNotas]         = useState('');
  const update = useUpdateSeguimiento();

  const client  = seg.clients;
  const apt     = seg.appointments;
  const cfg     = ESTADO_CONFIG[seg.estado] ?? ESTADO_CONFIG.pendiente;
  const dias    = diasRestantes(seg.fecha_objetivo);
  const nombre  = client?.name ?? 'Cliente';
  const telefono = client?.phone;
  const email    = client?.email;
  const servicio = (apt as { services?: { name: string } | null } | null)?.services?.name ?? 'Tratamiento';

  const marcarContactado = (canal: CanalSeguimiento) =>
    update.mutate({ id: seg.id, estado: 'contactado', canal });

  const marcarRespondido = () => {
    update.mutate({ id: seg.id, estado: 'respondido', satisfaccion: sat || null, notas: notas || null });
    setDialogOpen(false); setSat(0); setNotas('');
  };

  const marcarSinRespuesta = () =>
    update.mutate({ id: seg.id, estado: 'sin_respuesta' });

  return (
    <>
      <div className={cn('bg-card border rounded-2xl overflow-hidden transition-all', cfg.bg)}>
        {/* Cabecera */}
        <div className="flex items-center gap-3 p-4">
          {/* Avatar inicial */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold/20 to-rosegold/10 border border-gold-light/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-serif font-semibold text-gold">{nombre[0].toUpperCase()}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">{nombre}</p>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', cfg.color, cfg.bg)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{servicio}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Cita: {fmtDate(seg.fecha_cita)}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <UrgencyChip dias={dias} />
            </div>
          </div>

          <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Acciones rápidas — siempre visibles si pendiente/contactado */}
        {(seg.estado === 'pendiente' || seg.estado === 'contactado') && (
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            {telefono && (
              <a href={`https://wa.me/${telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-emerald-400/40 text-emerald-600 hover:bg-emerald-50 gap-1"
                  onClick={() => marcarContactado('whatsapp')}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </a>
            )}
            {telefono && (
              <a href={`tel:${telefono}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-blue-400/40 text-blue-600 hover:bg-blue-50 gap-1"
                  onClick={() => marcarContactado('llamada')}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Llamar
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-gold/40 text-gold hover:bg-gold/10 gap-1"
              onClick={() => setDialogOpen(true)}
            >
              <Check className="h-3.5 w-3.5" />
              Respondió
            </Button>
          </div>
        )}

        {/* Expandido */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-gold-light/10 space-y-2 text-xs text-muted-foreground">
            {email    && <p>📧 {email}</p>}
            {telefono && <p>📱 {telefono}</p>}
            {seg.canal && <p>Canal: {seg.canal}</p>}
            {seg.satisfaccion && (
              <div className="flex items-center gap-1">
                Satisfacción:
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn('h-3.5 w-3.5', n <= seg.satisfaccion! ? 'text-gold fill-gold' : 'text-muted-foreground/30')} />
                ))}
              </div>
            )}
            {seg.notas && <p className="italic">"{seg.notas}"</p>}
            {(seg.estado === 'pendiente' || seg.estado === 'contactado') && (
              <button
                onClick={marcarSinRespuesta}
                className="text-rose-500 hover:underline mt-1"
              >
                Marcar como sin respuesta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dialog satisfacción */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border border-gold-light/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">Registrar respuesta</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Indica la valoración y notas del cliente tras el seguimiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Valoración del cliente</p>
              <StarRating value={sat} onChange={setSat} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas (opcional)</p>
              <Textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Comentarios del cliente, estado del resultado…"
                rows={3}
                className="rounded-xl border-gold-light/50"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gold-light/50">
              Cancelar
            </Button>
            <Button onClick={marcarRespondido} variant="luxury">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────

export default function Seguimiento() {
  const { data: seguimientos = [], isLoading } = useSeguimientosPendientes();
  const { data: kpis }                         = useKPIsSeguimiento();
  const [filtroEstado, setFiltroEstado]        = useState<'todos' | EstadoSeguimiento>('todos');

  const filtrados = filtroEstado === 'todos'
    ? seguimientos
    : seguimientos.filter(s => s.estado === filtroEstado);

  const satMedia = kpis?.satMedia;

  return (
    <div className="pb-2">
      <Header title="Seguimiento" />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Pendientes"       value={kpis?.pendientes ?? 0}       sub="de contactar" />
          <KPI label="Contactados hoy"  value={kpis?.contactadosHoy ?? 0}   />
          <KPI label="Satisfacción"
            value={satMedia != null ? satMedia.toFixed(1) + ' ★' : '—'}
            sub="media valoraciones"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'pendiente', 'contactado', 'sin_respuesta'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filtroEstado === f
                  ? 'border-gold/50 bg-gold/10 text-foreground'
                  : 'border-gold-light/20 text-muted-foreground hover:border-gold/30',
              )}
            >
              {f === 'todos' ? 'Todos' :
               f === 'pendiente' ? 'Pendiente' :
               f === 'contactado' ? 'Contactado' : 'Sin respuesta'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {isLoading ? (
          <p className="text-center py-10 text-sm text-muted-foreground">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">
              {filtroEstado === 'todos'
                ? 'No hay seguimientos activos'
                : 'No hay seguimientos con este estado'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(seg => (
              <SeguimientoCard key={seg.id} seg={seg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

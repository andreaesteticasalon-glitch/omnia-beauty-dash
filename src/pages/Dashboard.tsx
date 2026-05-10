import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus, Wallet, Users, Sparkles, Bell,
  Package, ShoppingCart, ChevronRight, TrendingUp,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useCajaTotals } from '@/hooks/useCaja';
import { useRecentEvidencias } from '@/hooks/useEvidencias';
import { useCountPendientes } from '@/hooks/useSeguimiento';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const STATUS_STYLE = {
  scheduled: { label: 'Pendiente',  bg: 'hsl(var(--info-soft))',   color: 'hsl(var(--info))',  dot: 'hsl(var(--info))'  },
  completed:  { label: 'Completada', bg: 'hsl(var(--sage-soft))',   color: 'hsl(var(--sage))',  dot: 'hsl(var(--sage))'  },
  cancelled:  { label: 'Cancelada',  bg: 'hsl(var(--muted))',       color: 'hsl(var(--muted-foreground))', dot: 'hsl(var(--muted-foreground))' },
};

const TIPO_STYLE: Record<string, string> = {
  antes:     'hsl(var(--warn))',
  despues:   'hsl(var(--sage))',
  proceso:   'hsl(var(--info))',
  resultado: 'hsl(var(--primary))',
};

// ── Sparkline SVG ────────────────────────────────────────────

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 32; const w = 120;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(p => h - ((p - min) / (max - min || 1)) * h);
  const d  = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={d} stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Accesos rápidos ──────────────────────────────────────────

const QUICK = [
  { icon: CalendarPlus, label: 'Nueva cita',  desc: 'Agendar',   to: '/calendar'   },
  { icon: Wallet,       label: 'Caja',         desc: 'Cobros',    to: '/caja'        },
  { icon: Users,        label: 'Clientes',     desc: 'Fichas',    to: '/clients'     },
  { icon: Sparkles,     label: 'Servicios',    desc: 'Catálogo',  to: '/services'    },
  { icon: Package,      label: 'Inventario',   desc: 'Stock',     to: '/inventario'  },
  { icon: ShoppingCart, label: 'Pedidos',      desc: 'Compras',   to: '/pedidos'     },
];

// ── Página ───────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments, clients, getServiceById, getClientById } = useData();
  const { data: totals }         = useCajaTotals();
  const { data: evidencias = [] } = useRecentEvidencias(4);
  const { data: pendientes = 0 }  = useCountPendientes();

  const hoy     = new Date();
  const hoyStr  = hoy.toISOString().slice(0, 10);
  const diaStr  = `${DIAS[hoy.getDay()]} · ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  const citasHoy = useMemo(() =>
    appointments
      .filter(a => a.date === hoyStr)
      .sort((a, b) => a.time.localeCompare(b.time)),
  [appointments, hoyStr]);

  const completadasHoy = citasHoy.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6 pb-4">

      {/* Page head */}
      <div className="flex items-end justify-between gap-4 pt-1 pb-6 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--primary))' }}>
            {diaStr}
          </p>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 38, lineHeight: 1, margin: 0 }}>
            Buenos días, Andrea
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {citasHoy.length} citas programadas hoy · {citasHoy.filter(a => a.status === 'scheduled').length} pendientes
          </p>
        </div>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-foreground bg-foreground text-card hover:bg-primary hover:border-primary transition-colors shrink-0"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva cita
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Feature KPI */}
        <button
          onClick={() => navigate('/caja')}
          className="col-span-2 lg:col-span-1 text-left p-5 rounded-2xl border flex flex-col gap-3 transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--foreground))', borderColor: 'hsl(var(--foreground))' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,252,247,0.65)', letterSpacing: '0.15em' }}>
            Caja de hoy
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: '#FFFCF7', fontWeight: 400 }}>
            {(totals?.today ?? 0).toFixed(0)}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500, color: 'rgba(255,252,247,0.55)', marginLeft: 4 }}>€</span>
          </p>
          <Sparkline points={[2,4,3,6,5,8,7,10,8,12]} />
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#B6CDB6', fontFamily: 'var(--font-mono)' }}>
            <TrendingUp className="h-3.5 w-3.5" /> Pulsa para ver cobros
          </p>
        </button>

        {/* Citas hoy */}
        <button
          onClick={() => navigate('/calendar')}
          className="text-left p-5 rounded-2xl border border-border bg-card flex flex-col gap-2 hover:border-primary/30 transition-colors"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Citas hoy</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, fontWeight: 400 }}>{citasHoy.length}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {completadasHoy} completadas · {citasHoy.length - completadasHoy} próximas
          </p>
        </button>

        {/* Clientes */}
        <button
          onClick={() => navigate('/clients')}
          className="text-left p-5 rounded-2xl border border-border bg-card flex flex-col gap-2 hover:border-primary/30 transition-colors"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Clientes</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, fontWeight: 400 }}>{clients.length}</p>
          <p className="text-xs text-muted-foreground">Registrados</p>
        </button>

        {/* Seguimientos */}
        <button
          onClick={() => navigate('/seguimiento')}
          className="text-left p-5 rounded-2xl border border-border bg-card flex flex-col gap-2 hover:border-primary/30 transition-colors"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Seguimiento</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, fontWeight: 400, color: pendientes > 0 ? 'hsl(var(--warn))' : undefined }}>{pendientes}</p>
          <p className="text-xs text-muted-foreground">Pendientes contactar</p>
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">

        {/* Citas del día */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: 0 }}>
                Citas de hoy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sage inline-block" style={{ animation: 'pulse 1.6s ease-in-out infinite' }} />
                En vivo
              </p>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
            >
              Ver agenda <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {citasHoy.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                <CalendarPlus className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-medium text-primary border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
              >
                Abrir agenda
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {citasHoy.map(apt => {
                const client  = getClientById(apt.clientId);
                const service = getServiceById(apt.serviceId);
                const st      = STATUS_STYLE[apt.status] ?? STATUS_STYLE.scheduled;
                return (
                  <div key={apt.id} className={cn('grid items-center gap-3 px-5 py-3.5', apt.status === 'cancelled' && 'opacity-40')}
                    style={{ gridTemplateColumns: '60px 1fr auto auto' }}>
                    {/* Hora */}
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--foreground))' }}>
                      {apt.time}
                    </span>
                    {/* Info */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{client?.name ?? 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground truncate">{service?.name ?? 'Servicio'}</p>
                    </div>
                    {/* Pill */}
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0"
                      style={{ background: st.bg, color: st.color, borderColor: 'transparent' }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                    {/* Precio */}
                    <span className="text-sm font-semibold shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>
                      {apt.price}€
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Accesos rápidos */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: '0 0 16px' }}>
              Acceso rápido
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {QUICK.map(({ icon: Icon, label, desc, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-start gap-2.5 p-3 rounded-xl border border-border text-left transition-all hover:border-primary/40 hover:bg-primary/5 group"
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/60 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Banner seguimiento */}
          {pendientes > 0 && (
            <button
              onClick={() => navigate('/seguimiento')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:border-primary/40"
              style={{ background: 'hsl(var(--warn-soft))', borderColor: 'rgba(198,138,60,0.25)' }}
            >
              <div className="h-9 w-9 rounded-full bg-white/60 flex items-center justify-center shrink-0" style={{ color: 'hsl(var(--warn))' }}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">
                  {pendientes} cliente{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''} de seguimiento
                </p>
                <p className="text-xs text-muted-foreground">Post-tratamiento de últimos 7 días</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Evidencias recientes */}
      {evidencias.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: 0 }}>
                Últimas evidencias
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Fotos antes / después del tratamiento</p>
            </div>
            <button
              onClick={() => navigate('/clients')}
              className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
            >
              Galería completa <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {evidencias.map(ev => (
              <div key={ev.id} className="relative aspect-[1/1.05] rounded-xl overflow-hidden border border-border bg-muted/30">
                {ev.url ? (
                  <img src={ev.url} alt={ev.tratamiento ?? ev.tipo} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, hsl(var(--muted)/0.4) 0 8px, hsl(var(--background)) 8px 16px)' }} />
                )}
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-card/90 border border-border">
                  {ev.tipo.toUpperCase().slice(0, 4)}
                </span>
                {ev.clients && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1.5">
                    <p className="text-[9px] text-white/80 truncate">{(ev.clients as { name: string }).name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Calendar, Users, CalendarPlus, Sparkles,
  Clock, Check, X, ImageIcon, Bell, ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useCajaTotals } from '@/hooks/useCaja';
import { useRecentEvidencias } from '@/hooks/useEvidencias';
import { useCountPendientes } from '@/hooks/useSeguimiento';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  scheduled: { label: 'Pendiente', bg: 'bg-blue-500/10 border-blue-300/50', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  completed:  { label: 'Completada', bg: 'bg-emerald-500/10 border-emerald-300/50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelada', bg: 'bg-muted/40 border-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

const TIPO_COLOR: Record<string, string> = {
  antes:     'bg-amber-400',
  despues:   'bg-emerald-500',
  proceso:   'bg-blue-500',
  resultado: 'bg-rosegold',
};

// ── Accesos rápidos ──────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: CalendarPlus, label: 'Nueva cita',  desc: 'Agendar',     to: '/calendar',   color: 'from-rosegold/20 to-gold/10'      },
  { icon: Calendar,     label: 'Agenda',       desc: 'Ver hoy',     to: '/calendar',   color: 'from-sky-500/10 to-blue-400/10'   },
  { icon: Users,        label: 'Clientes',     desc: 'Fichas',      to: '/clients',    color: 'from-violet-500/10 to-purple-400/10' },
  { icon: Wallet,       label: 'Caja',         desc: 'Cobros',      to: '/caja',       color: 'from-emerald-500/10 to-green-400/10' },
  { icon: Sparkles,     label: 'Servicios',    desc: 'Catálogo',    to: '/services',   color: 'from-amber-500/10 to-yellow-400/10' },
  { icon: Bell,         label: 'Seguimiento',  desc: 'Post-tto.',   to: '/seguimiento',color: 'from-pink-500/10 to-rose-400/10'  },
];

// ── Componente ───────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments, clients, getServiceById, getClientById } = useData();
  const { data: totals }          = useCajaTotals();
  const { data: recientes = [] }  = useRecentEvidencias(4);
  const { data: pendientes = 0 }  = useCountPendientes();

  // Citas del día de hoy, ordenadas por hora
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoy = useMemo(() =>
    appointments
      .filter(a => a.date === hoy)
      .sort((a, b) => a.time.localeCompare(b.time)),
  [appointments, hoy]);

  const totalClients = clients.length;

  return (
    <div className="min-h-screen marble-bg pb-28">
      <Header />

      <main className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center pt-2 pb-1 animate-fade-in">
          <img
            src="/LOGO ANDREA.jpg"
            alt="AS Belleza y Bienestar"
            className="h-24 w-auto object-contain drop-shadow-md rounded-2xl"
          />
        </div>

        {/* KPI Caja — clicable */}
        <button onClick={() => navigate('/caja')} className="w-full text-left animate-fade-in group">
          <KPICard
            title="Caja de hoy"
            value={`${(totals?.today ?? 0).toFixed(2)} €`}
            subtitle="Pulsa para registrar cobros →"
            icon={Wallet}
            variant="premium"
            className="transition-all duration-200 group-hover:shadow-luxury group-hover:scale-[1.01]"
          />
        </button>

        {/* KPIs secundarios */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <button onClick={() => navigate('/calendar')} className="text-left group">
            <KPICard
              title="Citas hoy"
              value={citasHoy.length.toString()}
              subtitle={`${citasHoy.filter(c => c.status === 'scheduled').length} pendientes →`}
              icon={Calendar}
              className="transition-all duration-200 group-hover:shadow-luxury group-hover:scale-[1.01]"
            />
          </button>
          <button onClick={() => navigate('/clients')} className="text-left group">
            <KPICard
              title="Clientes"
              value={totalClients.toString()}
              subtitle="registrados →"
              icon={Users}
              className="transition-all duration-200 group-hover:shadow-luxury group-hover:scale-[1.01]"
            />
          </button>
        </div>

        {/* Panel citas del día */}
        <div className="bg-card rounded-3xl border border-gold-light/30 shadow-luxury overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gold-light/15">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <h2 className="font-serif font-semibold text-foreground text-sm">Citas de hoy</h2>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-gold hover:text-gold-dark flex items-center gap-0.5 transition-colors"
            >
              Ver agenda <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {citasHoy.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 px-5">
              <div className="h-14 w-14 rounded-full bg-gold/10 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-gold/50" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground text-center">No hay citas programadas para hoy</p>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs text-gold border border-gold/40 rounded-full px-4 py-1.5 hover:bg-gold/5 transition-colors"
              >
                Abrir agenda
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gold-light/10">
              {citasHoy.map(apt => {
                const client  = getClientById(apt.clientId);
                const service = getServiceById(apt.serviceId);
                const cfg     = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.scheduled;
                return (
                  <div key={apt.id} className={cn('flex items-center gap-3 px-5 py-3', apt.status === 'cancelled' && 'opacity-50')}>
                    {/* Hora */}
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-sm font-semibold text-gold font-mono">{apt.time}</p>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{client?.name ?? 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground truncate">{service?.name ?? 'Servicio'}</p>
                    </div>
                    {/* Estado */}
                    <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0', cfg.bg, cfg.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </div>
                    {/* Precio */}
                    <p className="text-sm font-semibold text-gold shrink-0">{apt.price}€</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="animate-fade-in">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold/60 mb-3 px-1">
            Acceso rápido
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map(({ icon: Icon, label, desc, to, color }) => (
              <button
                key={to + label}
                onClick={() => navigate(to)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border border-gold-light/20',
                  'hover:border-gold/30 transition-all duration-200 hover:shadow-sm bg-card',
                )}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br', color)}>
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mini-galería evidencias */}
        {recientes.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gold/60">
                  Últimas evidencias
                </h2>
              </div>
              <button
                onClick={() => navigate('/clients')}
                className="text-xs text-gold hover:text-gold-dark flex items-center gap-0.5 transition-colors"
              >
                Ver todas <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {recientes.map(ev => (
                <div key={ev.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted border border-gold-light/15">
                  <img src={ev.url} alt={ev.tratamiento ?? ev.tipo} className="w-full h-full object-cover" />
                  <span className={cn(
                    'absolute top-0.5 left-0.5 px-1 py-0.5 rounded-full text-[8px] font-bold text-white',
                    TIPO_COLOR[ev.tipo] ?? 'bg-gold',
                  )}>
                    {ev.tipo.toUpperCase().slice(0, 3)}
                  </span>
                  {ev.clients && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-1">
                      <p className="text-[8px] text-white/80 truncate">{ev.clients.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner seguimiento pendiente */}
        {pendientes > 0 && (
          <button
            onClick={() => navigate('/seguimiento')}
            className="w-full animate-fade-in"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-400/5 hover:border-amber-400/70 transition-colors">
              <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  {pendientes} cliente{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''} de seguimiento
                </p>
                <p className="text-xs text-muted-foreground">Toca para gestionar el seguimiento post-tratamiento</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </button>
        )}

      </main>
    </div>
  );
}

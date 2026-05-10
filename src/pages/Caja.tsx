import { useState, useMemo } from 'react';
import { Wallet, CreditCard, Smartphone, ArrowRightLeft, Plus, Trash2, TrendingUp, Euro, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SmartSelect } from '@/components/SmartSelect';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { useTodayPayments, useCajaTotals, useRegisterPayment, useDeletePayment, usePaymentRecords } from '@/hooks/useCaja';
import { PaymentMethod } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// ── Método de pago ───────────────────────────────────────────

const METHODS: { key: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'efectivo',       label: 'Efectivo',       icon: Wallet,         color: 'from-emerald-500/20 to-green-400/10 border-emerald-500/40 text-emerald-600' },
  { key: 'tarjeta',        label: 'Tarjeta',         icon: CreditCard,     color: 'from-blue-500/20 to-sky-400/10 border-blue-500/40 text-blue-600' },
  { key: 'bizum',          label: 'Bizum',            icon: Smartphone,     color: 'from-violet-500/20 to-purple-400/10 border-violet-500/40 text-violet-600' },
  { key: 'transferencia',  label: 'Transferencia',    icon: ArrowRightLeft, color: 'from-amber-500/20 to-yellow-400/10 border-amber-500/40 text-amber-600' },
];

const fmtEur = (n: number) => `${n.toFixed(2)} €`;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

// ── Formulario de cobro ──────────────────────────────────────

function CobrarSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients, services } = useData();
  const register  = useRegisterPayment();
  const navigate  = useNavigate();

  const [clientId,  setClientId]  = useState('');
  const [serviceId, setServiceId] = useState('');
  const [amount,    setAmount]    = useState('');
  const [method,    setMethod]    = useState<PaymentMethod>('efectivo');
  const [notes,     setNotes]     = useState('');

  const selectedClient  = clients.find(c => c.id === clientId);
  const selectedService = services.find(s => s.id === serviceId);

  const onServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.find(s => s.id === id);
    if (svc) setAmount(svc.price.toString());
  };

  const reset = () => { setClientId(''); setServiceId(''); setAmount(''); setMethod('efectivo'); setNotes(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !serviceId || !amount) return;
    await register.mutateAsync({
      client_id:    clientId,
      service_id:   serviceId,
      client_name:  selectedClient?.name ?? '',
      service_name: selectedService?.name ?? '',
      amount:       parseFloat(amount),
      payment_method: method,
      notes:        notes || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto bg-card border-t border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="font-serif text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gold" />
            Registrar Cobro
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 pb-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-gold-dark">Cliente *</Label>
            <SmartSelect
              value={clientId}
              onChange={setClientId}
              options={clients.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: c.phone ?? undefined,
              }))}
              placeholder="Seleccionar cliente..."
              createLabel="Añadir nueva cliente"
              onCreateNew={() => { onClose(); navigate('/clients'); }}
            />
          </div>

          {/* Tratamiento */}
          <div className="space-y-2">
            <Label className="text-gold-dark">Tratamiento *</Label>
            <SmartSelect
              value={serviceId}
              onChange={onServiceChange}
              options={services.map(s => ({
                value: s.id,
                label: s.name,
                subtitle: `${s.price} € · ${s.duration} min`,
              }))}
              placeholder="Seleccionar tratamiento..."
              createLabel="Crear nuevo servicio"
              onCreateNew={() => { onClose(); navigate('/services'); }}
            />
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label className="text-gold-dark">Método de pago *</Label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(m => {
                const Icon = m.icon;
                const active = method === m.key;
                return (
                  <button
                    key={m.key} type="button"
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all',
                      active
                        ? 'bg-gradient-to-r ' + m.color + ' shadow-sm'
                        : 'border-gold-light/20 bg-card hover:bg-gold/5 text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Importe */}
          <div className="space-y-2">
            <Label className="text-gold-dark">Importe (€) *</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <Input
                type="number" step="0.01" min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-9"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-gold-dark">Notas (opcional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Descuento aplicado, observaciones..." className="rounded-2xl border-gold-light/50 bg-card" />
          </div>

          <Button type="submit" variant="luxury" className="w-full" size="lg" disabled={!clientId || !serviceId || !amount || register.isPending}>
            {register.isPending ? 'Registrando...' : `Cobrar ${amount ? fmtEur(parseFloat(amount)) : '—'}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Página principal ─────────────────────────────────────────

export default function Caja() {
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const { data: today = []  } = useTodayPayments();
  const { data: totals }      = useCajaTotals();
  const deletePayment         = useDeletePayment();

  // Weekly chart data (last 7 days)
  const { data: weekPayments = [] } = usePaymentRecords(
    (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString(); })(),
  );

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return days.map(date => ({
      name: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
      total: weekPayments.filter(p => p.created_at.startsWith(date)).reduce((s, p) => s + Number(p.amount), 0),
    }));
  }, [weekPayments]);

  const methodBadge = (m: PaymentMethod) => {
    const found = METHODS.find(x => x.key === m);
    return (
      <Badge variant="secondary" className={cn('text-[10px] border bg-gradient-to-r', found?.color ?? '')}>
        {found?.label ?? m}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <KPICard title="Hoy" value={fmtEur(totals?.today ?? 0)}    icon={Wallet}     variant="premium" className="col-span-3 sm:col-span-1" />
          <KPICard title="Esta semana" value={fmtEur(totals?.week ?? 0)} icon={TrendingUp} />
          <KPICard title="Este mes"    value={fmtEur(totals?.month ?? 0)} icon={Euro} />
        </div>

        {/* Botón cobrar */}
        <Button onClick={() => setCobrarOpen(true)} variant="luxury" size="lg" className="w-full animate-fade-in gap-2">
          <Plus className="h-5 w-5" />
          Registrar Cobro
        </Button>

        {/* Tabs */}
        <Tabs defaultValue="hoy" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30">
            {['hoy','metodos','estadisticas'].map(t => (
              <TabsTrigger key={t} value={t} className="rounded-xl text-xs capitalize data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
                {t === 'hoy' ? 'Cobros de hoy' : t === 'metodos' ? 'Por método' : 'Evolución'}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Hoy */}
          <TabsContent value="hoy" className="mt-4 space-y-2">
            {today.length === 0 && (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <Wallet className="h-8 w-8 text-gold/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin cobros registrados hoy</p>
              </div>
            )}
            {today.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-gold-light/20 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm truncate">{p.client_name}</p>
                    {methodBadge(p.payment_method)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.service_name} · {fmtTime(p.created_at)}</p>
                  {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif font-semibold text-gold">{fmtEur(Number(p.amount))}</p>
                  <button onClick={() => { if (confirm('¿Eliminar este cobro?')) deletePayment.mutate(p.id); }}
                    className="text-destructive/60 hover:text-destructive mt-1 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {today.length > 0 && (
              <div className="bg-gradient-to-r from-gold/10 to-rosegold/10 rounded-2xl border border-gold-light/30 p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total del día</span>
                <span className="font-serif font-bold text-gold text-lg">{fmtEur(totals?.today ?? 0)}</span>
              </div>
            )}
          </TabsContent>

          {/* Por método */}
          <TabsContent value="metodos" className="mt-4 space-y-3">
            {METHODS.map(m => {
              const Icon = m.icon;
              const val = totals?.todayByMethod?.[m.key] ?? 0;
              const total = totals?.today ?? 1;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={m.key} className="bg-card rounded-2xl border border-gold-light/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br border', m.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">{m.label}</p>
                        <p className="font-serif font-semibold text-gold">{fmtEur(val)}</p>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Evolución */}
          <TabsContent value="estadisticas" className="mt-4">
            <div className="bg-card rounded-2xl border border-gold-light/30 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-4">Últimos 7 días</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cajaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--gold))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={v => `${v}€`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                      formatter={(v: number) => [`${v.toFixed(2)} €`, 'Total']} />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--gold))" strokeWidth={2} fill="url(#cajaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gold-light/20">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Hoy</p>
                  <p className="font-serif font-semibold text-gold">{totals?.count?.today ?? 0} cobros</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Semana</p>
                  <p className="font-serif font-semibold text-gold">{totals?.count?.week ?? 0} cobros</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Mes</p>
                  <p className="font-serif font-semibold text-gold">{totals?.count?.month ?? 0} cobros</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CobrarSheet open={cobrarOpen} onClose={() => setCobrarOpen(false)} />
    </div>
  );
}

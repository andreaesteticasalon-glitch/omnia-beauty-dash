import { useState, useMemo } from 'react';
import { Wallet, Calendar, TrendingUp, Users } from 'lucide-react';
import Header from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { RevenueChart } from '@/components/RevenueChart';
import { PopularServicesChart } from '@/components/PopularServicesChart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';

type Period = 'daily' | 'weekly' | 'monthly';

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('daily');
  const { appointments, clients } = useData();

  const stats = useMemo(() => {
    const today = new Date();
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    
    // Calculate based on period
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    
    if (period === 'daily') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else if (period === 'weekly') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 28);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 28);
      prevEndDate = new Date(startDate);
    } else {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 6);
      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 6);
      prevEndDate = new Date(startDate);
    }

    const periodAppointments = completedAppointments.filter(a => new Date(a.date) >= startDate);
    const prevPeriodAppointments = completedAppointments.filter(a => {
      const date = new Date(a.date);
      return date >= prevStartDate && date < prevEndDate;
    });

    const totalRevenue = periodAppointments.reduce((sum, a) => sum + a.price, 0);
    const prevRevenue = prevPeriodAppointments.reduce((sum, a) => sum + a.price, 0);
    const revenueTrend = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    const totalAppointments = periodAppointments.length;
    const avgTicket = totalAppointments > 0 ? Math.round(totalRevenue / totalAppointments) : 0;

    const periodClients = new Set(periodAppointments.map(a => a.clientId)).size;

    return { totalRevenue, totalAppointments, avgTicket, periodClients, revenueTrend };
  }, [appointments, clients, period]);

  const periodLabel = period === 'daily' ? 'últimos 7 días' : period === 'weekly' ? 'últimas 4 semanas' : 'últimos 6 meses';

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-serif font-semibold text-foreground">Ingresos</h1>
          <p className="text-sm text-gold">Análisis de {periodLabel}</p>
        </div>

        {/* Period Toggle */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30 shadow-soft">
            <TabsTrigger value="daily" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300">
              Diario
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300">
              Semanal
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300">
              Mensual
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <KPICard
            title="Ingresos"
            value={`${stats.totalRevenue} €`}
            icon={Wallet}
            trend={{ value: stats.revenueTrend, label: 'vs anterior' }}
            variant="premium"
          />
          <KPICard
            title="Citas"
            value={stats.totalAppointments.toString()}
            subtitle="completadas"
            icon={Calendar}
          />
          <KPICard
            title="Ticket medio"
            value={`${stats.avgTicket} €`}
            icon={TrendingUp}
          />
          <KPICard
            title="Clientes"
            value={stats.periodClients.toString()}
            subtitle="atendidos"
            icon={Users}
          />
        </div>

        {/* Charts */}
        <div className="space-y-4 animate-fade-in">
          <div className="bg-card rounded-3xl p-4 border border-gold-light/30 shadow-luxury">
            <RevenueChart period={period} />
          </div>
          <div className="bg-card rounded-3xl p-4 border border-gold-light/30 shadow-luxury">
            <PopularServicesChart />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useMemo } from 'react';
import { Wallet, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewAppointmentForm from '@/components/NewAppointmentForm';
import NewServiceForm from '@/components/NewServiceForm';
import { useData } from '@/contexts/DataContext';
import { useCajaTotals } from '@/hooks/useCaja';

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments, clients } = useData();
  const { data: totals } = useCajaTotals();

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    const scheduledToday = todayAppointments.filter(a => a.status === 'scheduled').length;
    return { scheduledToday, totalClients: clients.length };
  }, [appointments, clients]);

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />

      <main className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Logo bienvenida */}
        <div className="flex flex-col items-center pt-2 pb-1 animate-fade-in">
          <img src="/LOGO ANDREA.jpg" alt="AS Belleza y Bienestar"
            className="h-28 w-auto object-contain drop-shadow-md rounded-2xl" />
        </div>

        {/* KPI Caja — clicable → /caja */}
        <button
          onClick={() => navigate('/caja')}
          className="w-full text-left animate-fade-in group"
        >
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
              title="Citas"
              value={todayStats.scheduledToday.toString()}
              subtitle="pendientes hoy →"
              icon={Calendar}
              className="transition-all duration-200 group-hover:shadow-luxury group-hover:scale-[1.01]"
            />
          </button>
          <button onClick={() => navigate('/clients')} className="text-left group">
            <KPICard
              title="Clientes"
              value={todayStats.totalClients.toString()}
              subtitle="registrados →"
              icon={Users}
              className="transition-all duration-200 group-hover:shadow-luxury group-hover:scale-[1.01]"
            />
          </button>
        </div>

        {/* Acciones rápidas */}
        <Tabs defaultValue="appointment" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-2 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30 shadow-soft">
            <TabsTrigger value="appointment"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300">
              Nueva Cita
            </TabsTrigger>
            <TabsTrigger value="service"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300">
              Nuevo Servicio
            </TabsTrigger>
          </TabsList>
          <TabsContent value="appointment" className="mt-5">
            <div className="bg-card rounded-3xl p-6 border border-gold-light/30 shadow-luxury">
              <NewAppointmentForm />
            </div>
          </TabsContent>
          <TabsContent value="service" className="mt-5">
            <div className="bg-card rounded-3xl p-6 border border-gold-light/30 shadow-luxury">
              <NewServiceForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

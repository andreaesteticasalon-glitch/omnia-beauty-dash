import { useMemo } from 'react';
import { Wallet, Calendar, Users } from 'lucide-react';
import Header from '@/components/Header';
import { KPICard } from '@/components/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewAppointmentForm from '@/components/NewAppointmentForm';
import NewServiceForm from '@/components/NewServiceForm';
import { useData } from '@/contexts/DataContext';

export default function Dashboard() {
  const { appointments, clients } = useData();

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    const completedToday = todayAppointments.filter(a => a.status === 'completed');
    const todayRevenue = completedToday.reduce((sum, a) => sum + a.price, 0);
    const scheduledToday = todayAppointments.filter(a => a.status === 'scheduled').length;
    
    return { todayRevenue, scheduledToday, totalClients: clients.length };
  }, [appointments, clients]);

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Logo bienvenida */}
        <div className="flex flex-col items-center pt-2 pb-1 animate-fade-in">
          <img
            src="/LOGO ANDREA.jpg"
            alt="AS Belleza y Bienestar"
            className="h-28 w-auto object-contain drop-shadow-md rounded-2xl"
          />
        </div>

        {/* Premium KPI Card - Caja de hoy */}
        <KPICard
          title="Caja de hoy"
          value={`${todayStats.todayRevenue} €`}
          subtitle="Ingresos del día"
          icon={Wallet}
          variant="premium"
          className="animate-fade-in"
        />
        
        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            title="Citas"
            value={todayStats.scheduledToday.toString()}
            subtitle="pendientes hoy"
            icon={Calendar}
            className="animate-fade-in"
          />
          <KPICard
            title="Clientes"
            value={todayStats.totalClients.toString()}
            subtitle="registrados"
            icon={Users}
            className="animate-fade-in"
          />
        </div>

        {/* Quick Actions */}
        <Tabs defaultValue="appointment" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30 shadow-soft">
            <TabsTrigger 
              value="appointment"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Nueva Cita
            </TabsTrigger>
            <TabsTrigger 
              value="service"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold-light/40 data-[state=active]:shadow-sm transition-all duration-300"
            >
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

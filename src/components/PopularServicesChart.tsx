import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useData } from '@/contexts/DataContext';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--sage))',
  'hsl(350, 30%, 70%)',
  'hsl(30, 40%, 75%)',
  'hsl(200, 30%, 70%)',
];

export function PopularServicesChart() {
  const { appointments, services } = useData();

  const chartData = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    
    completedAppointments.forEach(apt => {
      serviceCounts[apt.serviceId] = (serviceCounts[apt.serviceId] || 0) + 1;
    });

    return Object.entries(serviceCounts)
      .map(([serviceId, count]) => {
        const service = services.find(s => s.id === serviceId);
        return {
          name: service?.name || 'Desconocido',
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [appointments, services]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Servicios Populares</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Servicios Populares</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`${value} citas`, 'Total']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

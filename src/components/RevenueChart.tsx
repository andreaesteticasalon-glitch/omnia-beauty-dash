import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '@/contexts/DataContext';

interface RevenueChartProps {
  period: 'daily' | 'weekly' | 'monthly';
}

export function RevenueChart({ period }: RevenueChartProps) {
  const { appointments } = useData();

  const chartData = useMemo(() => {
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const today = new Date();
    
    if (period === 'daily') {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayRevenue = completedAppointments
          .filter(a => a.date === dateStr)
          .reduce((sum, a) => sum + a.price, 0);
        return {
          name: date.toLocaleDateString('es-ES', { weekday: 'short' }),
          revenue: dayRevenue,
        };
      });
    } else if (period === 'weekly') {
      // Last 4 weeks
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() - (3 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekRevenue = completedAppointments
          .filter(a => {
            const aDate = new Date(a.date);
            return aDate >= weekStart && aDate <= weekEnd;
          })
          .reduce((sum, a) => sum + a.price, 0);
        return {
          name: `Sem ${4 - (3 - i)}`,
          revenue: weekRevenue,
        };
      });
    } else {
      // Last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const monthRevenue = completedAppointments
          .filter(a => {
            const aDate = new Date(a.date);
            return aDate.getMonth() === monthDate.getMonth() && 
                   aDate.getFullYear() === monthDate.getFullYear();
          })
          .reduce((sum, a) => sum + a.price, 0);
        return {
          name: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
          revenue: monthRevenue,
        };
      });
    }
  }, [appointments, period]);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Tendencia de Ingresos</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`${value} €`, 'Ingresos']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

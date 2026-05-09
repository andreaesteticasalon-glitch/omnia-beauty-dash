import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/calendar', icon: Calendar, label: 'Agenda' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/services', icon: Sparkles, label: 'Servicios' },
  { to: '/analytics', icon: TrendingUp, label: 'Ingresos' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-gold-light/40 safe-area-inset-bottom shadow-luxury">
      <div className="flex justify-around items-center h-18 max-w-lg mx-auto px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[64px]',
                isActive
                  ? 'text-rosegold bg-rosegold/10 shadow-sm'
                  : 'text-gold/70 hover:text-gold hover:bg-gold/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

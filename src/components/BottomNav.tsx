import { NavLink } from 'react-router-dom';
import { Home, Calendar, ClipboardList, Wallet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePendingCount } from '@/hooks/useBookingRequests';

// 5 items más usados — resto en hamburguesa
const navItems = [
  { to: '/',          icon: Home,          label: 'Inicio'   },
  { to: '/calendar',  icon: Calendar,      label: 'Agenda'   },
  { to: '/bookings',  icon: ClipboardList, label: 'Reservas', badge: true },
  { to: '/caja',      icon: Wallet,        label: 'Caja'     },
  { to: '/clients',   icon: Users,         label: 'Clientes' },
];

export function BottomNav() {
  const { data: pending = 0 } = usePendingCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-gold-light/40 shadow-luxury">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-300 min-w-[56px]',
                isActive
                  ? 'text-rosegold bg-rosegold/10 shadow-sm'
                  : 'text-gold/70 hover:text-gold hover:bg-gold/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={cn('h-5 w-5 transition-all duration-300', isActive && 'scale-110')}
                    strokeWidth={isActive ? 2.5 : 1.5} />
                  {badge && pending > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rosegold text-white text-[9px] flex items-center justify-center font-bold">
                      {pending > 9 ? '9+' : pending}
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px] font-medium transition-all duration-300', isActive && 'font-semibold')}>
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

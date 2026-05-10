import { NavLink } from 'react-router-dom';
import { Home, Calendar, ClipboardList, Wallet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePendingCount } from '@/hooks/useBookingRequests';

const navItems = [
  { to: '/',          icon: Home,          label: 'Inicio'            },
  { to: '/calendar',  icon: Calendar,      label: 'Agenda'            },
  { to: '/bookings',  icon: ClipboardList, label: 'Reservas', badge: true },
  { to: '/caja',      icon: Wallet,        label: 'Caja'              },
  { to: '/clients',   icon: Users,         label: 'Clientes'          },
];

export function BottomNav() {
  const { data: pending = 0 } = usePendingCount();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-2"
      style={{
        background: 'rgba(255,252,247,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid hsl(var(--border))',
      }}
    >
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                {badge && pending > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                    {pending > 9 ? '9+' : pending}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

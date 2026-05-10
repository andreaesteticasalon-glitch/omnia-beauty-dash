import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Menu, X,
  Home, Calendar, Users, Sparkles,
  ClipboardList, QrCode, Building2, ShoppingCart, Wallet, Package, Bell, Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePendingCount } from '@/hooks/useBookingRequests';

// ── Módulos disponibles en el menú rápido ───────────────────

const MODULES = [
  { to: '/',             icon: Home,          label: 'Inicio',       color: 'from-rosegold/20 to-gold/10'          },
  { to: '/calendar',     icon: Calendar,      label: 'Agenda',       color: 'from-sky-500/10 to-blue-400/10'       },
  { to: '/bookings',     icon: ClipboardList, label: 'Reservas',     color: 'from-rosegold/20 to-gold/10', badge: true },
  { to: '/caja',         icon: Wallet,         label: 'Caja',         color: 'from-emerald-500/10 to-green-400/10'  },
  { to: '/clients',      icon: Users,          label: 'Clientes',     color: 'from-violet-500/10 to-purple-400/10'  },
  { to: '/services',     icon: Sparkles,       label: 'Servicios',    color: 'from-amber-500/10 to-yellow-400/10'   },
  { to: '/proveedores',  icon: Building2,      label: 'Proveedores',  color: 'from-pink-500/10 to-rose-400/10'      },
  { to: '/pedidos',      icon: ShoppingCart,   label: 'Pedidos',      color: 'from-teal-500/10 to-cyan-400/10'      },
  { to: '/inventario',   icon: Package,        label: 'Inventario',   color: 'from-orange-500/10 to-amber-400/10'   },
  { to: '/seguimiento',  icon: Bell,           label: 'Seguimiento',  color: 'from-pink-500/10 to-rose-400/10'      },
  { to: '/marketing',   icon: Megaphone,      label: 'Marketing',    color: 'from-violet-500/10 to-purple-400/10'  },
  { to: '/qr-code',      icon: QrCode,         label: 'QR',           color: 'from-indigo-500/10 to-blue-400/10'    },
];

// ── Menú rápido (hamburguesa) ────────────────────────────────

function QuickNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: pending = 0 } = usePendingCount();

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menú de navegación"
        className={cn(
          'fixed top-3 left-3 z-[100]',
          'h-9 w-9 rounded-full flex items-center justify-center',
          'border border-gold/50 shadow-luxury',
          'bg-card/95 backdrop-blur-md',
          'transition-all duration-300 hover:scale-110 hover:border-gold hover:shadow-glow',
          'active:scale-95',
        )}
      >
        <div className="relative">
          <Menu className="h-5 w-5 text-gold" strokeWidth={1.5} />
          {pending > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-rosegold text-white text-[8px] flex items-center justify-center font-bold">
              {pending > 9 ? '9+' : pending}
            </span>
          )}
        </div>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer lateral */}
      <div className={cn(
        'fixed top-0 left-0 z-[120] h-full w-72 max-w-[85vw]',
        'bg-card border-r border-gold-light/30 shadow-elevated',
        'flex flex-col transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Cabecera del drawer */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gold-light/20">
          <img
            src="/LOGO ANDREA.jpg"
            alt="AS Belleza y Bienestar"
            className="h-10 w-auto object-contain"
          />
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Módulos */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gold/60 mb-3 px-1">
            Acceso rápido
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MODULES.map(({ to, icon: Icon, label, color, badge }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200',
                    isActive
                      ? 'border-gold/50 bg-gradient-to-br ' + color + ' shadow-sm'
                      : 'border-gold-light/20 hover:border-gold/30 hover:bg-gold/5',
                  )}
                >
                  <div className="relative">
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br ' + color,
                      isActive && 'shadow-sm',
                    )}>
                      <Icon className={cn('h-5 w-5', isActive ? 'text-gold' : 'text-gold/70')} strokeWidth={1.5} />
                    </div>
                    {badge && pending > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rosegold text-white text-[9px] flex items-center justify-center font-bold">
                        {pending > 9 ? '9+' : pending}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gold-light/20">
          <p className="text-[10px] text-muted-foreground text-center">
            AS · Belleza y Bienestar
          </p>
        </div>
      </div>
    </>
  );
}

// ── Botón atrás ──────────────────────────────────────────────

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Volver atrás"
      className={cn(
        'fixed top-3 left-3 z-[100]',
        'h-9 w-9 rounded-full flex items-center justify-center',
        'border border-gold/50 shadow-luxury',
        'bg-card/95 backdrop-blur-md',
        'transition-all duration-300 hover:scale-110 hover:border-gold hover:shadow-glow',
        'active:scale-95',
      )}
    >
      <ChevronLeft className="h-5 w-5 text-gold" strokeWidth={1.5} />
    </button>
  );
}

// ── Exportación principal ────────────────────────────────────
// Renderiza hamburguesa en dashboard, atrás en el resto.
// No renderiza nada en rutas públicas /book.

export function LeftAction() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/book')) return null;

  const isDashboard = pathname === '/' || pathname === '/dashboard';
  return isDashboard ? <QuickNav /> : <BackButton />;
}

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home, Calendar, ClipboardList, Wallet, Users, Sparkles,
  Building2, ShoppingCart, Package, Bell, Megaphone, QrCode,
  X, ChevronLeft, BarChart3,
} from 'lucide-react';
import { usePendingCount } from '@/hooks/useBookingRequests';
import { useCountNotificacionesPendientes } from '@/hooks/useMarketingNotificaciones';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';

// ── Definición de navegación ─────────────────────────────────

const SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/',          icon: Home,          label: 'Inicio'      },
      { to: '/calendar',  icon: Calendar,      label: 'Agenda'      },
      { to: '/bookings',  icon: ClipboardList, label: 'Reservas',   badge: 'bookings' },
      { to: '/caja',      icon: Wallet,        label: 'Caja'        },
      { to: '/analytics', icon: BarChart3,     label: 'Analíticas'  },
    ],
  },
  {
    label: 'Clientes & Servicios',
    items: [
      { to: '/clients',   icon: Users,     label: 'Clientes'   },
      { to: '/services',  icon: Sparkles,  label: 'Servicios'  },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/proveedores', icon: Building2,   label: 'Proveedores' },
      { to: '/pedidos',     icon: ShoppingCart, label: 'Pedidos'    },
      { to: '/inventario',  icon: Package,      label: 'Inventario' },
    ],
  },
  {
    label: 'Marketing & Seguimiento',
    items: [
      { to: '/marketing',   icon: Megaphone, label: 'Marketing',   badge: 'marketing'   },
      { to: '/seguimiento', icon: Bell,      label: 'Seguimiento'  },
      { to: '/qr-code',     icon: QrCode,    label: 'Código QR'    },
    ],
  },
];

// ── Sidebar ──────────────────────────────────────────────────

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { data: pendingBookings = 0 } = usePendingCount();
  const { data: pendingMarketing = 0 } = useCountNotificacionesPendientes();

  const getBadge = (key?: string) => {
    if (key === 'bookings')  return pendingBookings;
    if (key === 'marketing') return pendingMarketing;
    return 0;
  };

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' || pathname === '/dashboard' : pathname.startsWith(to);

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside className={cn('app-sidebar', open && 'open')}>
        {/* Marca */}
        <div className="flex items-center gap-3 px-2 pb-5 mb-2 border-b border-border">
          <div className="h-9 w-9 rounded-full bg-foreground text-card flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
            A
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1, letterSpacing: '0.01em' }}>
              Andrea
            </p>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
              Belleza y Bienestar
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-4">
          {SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-3 pt-4 pb-1.5">
                {section.label}
              </p>
              {section.items.map(({ to, icon: Icon, label, badge }) => {
                const count = getBadge(badge);
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={cn('nav-item', active && 'active')}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{label}</span>
                    {count > 0 && (
                      <span className="nav-badge">{count > 9 ? '9+' : count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border px-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
            >
              AS
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">Andrea</p>
              <p className="text-[10px] text-muted-foreground">Administradora</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

// ── Header móvil ─────────────────────────────────────────────

function MobileHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDashboard = pathname === '/' || pathname === '/dashboard';

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 gap-3">
      {isDashboard ? (
        <button
          onClick={onOpenSidebar}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <img src="/LOGO ANDREA.jpg" alt="AS Belleza" className="h-8 w-auto object-contain" />
    </header>
  );
}

// ── AppLayout principal ───────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const isPublic = pathname.startsWith('/book');

  if (isPublic) return <Outlet />;

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-content flex flex-col min-h-screen">
        <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1">
          <div className="page-content mx-auto">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

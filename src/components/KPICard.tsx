import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title:     string;
  value:     string;
  subtitle?: string;
  icon:      LucideIcon;
  trend?:    { value: number; label: string };
  className?: string;
  variant?:  'default' | 'premium';
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className, variant = 'default' }: KPICardProps) {
  const isPremium = variant === 'premium';

  return (
    <div className={cn(
      'rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] border',
      isPremium
        ? 'border-foreground'
        : 'border-border bg-card shadow-card',
      isPremium && 'text-card',
      className,
    )}
      style={isPremium ? { background: 'hsl(var(--foreground))' } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: isPremium ? 'rgba(255,252,247,0.65)' : 'hsl(var(--muted-foreground))' }}>
          {title}
        </span>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: isPremium ? 'rgba(255,252,247,0.12)' : 'hsl(var(--muted) / 0.6)' }}>
          <Icon className="h-4 w-4" strokeWidth={1.5}
            style={{ color: isPremium ? 'rgba(255,252,247,0.8)' : 'hsl(var(--primary))' }} />
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 400,
        fontSize: 36,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: isPremium ? '#FFFCF7' : 'hsl(var(--foreground))',
      }}>
        {value}
      </p>

      {subtitle && (
        <p className="text-xs mt-1.5"
          style={{ color: isPremium ? 'rgba(255,252,247,0.55)' : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}>
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium"
          style={{
            fontFamily: 'var(--font-mono)',
            color: trend.value >= 0
              ? (isPremium ? '#B6CDB6' : 'hsl(var(--sage))')
              : 'hsl(var(--destructive))',
          }}>
          {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}

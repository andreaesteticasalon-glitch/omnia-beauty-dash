import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  variant?: 'default' | 'premium';
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className, variant = 'default' }: KPICardProps) {
  return (
    <div className={cn(
      'rounded-3xl p-4 transition-all duration-300 hover:scale-[1.02]',
      variant === 'premium' 
        ? 'bg-gradient-to-br from-card via-card to-gold/5 border-2 border-gold-light/50 shadow-luxury'
        : 'bg-card border border-gold-light/30 shadow-card',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gold-dark font-medium uppercase tracking-wider">
          {title}
        </span>
        <div className={cn(
          "p-2.5 rounded-2xl",
          variant === 'premium'
            ? 'bg-gradient-to-br from-gold/20 to-rosegold/20'
            : 'bg-gold/10'
        )}>
          <Icon className={cn(
            "h-4 w-4",
            variant === 'premium' ? 'text-gold' : 'text-gold'
          )} strokeWidth={1.5} />
        </div>
      </div>
      <p className={cn(
        "text-2xl font-serif font-semibold",
        variant === 'premium' ? 'text-gold-dark' : 'text-foreground'
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend.value >= 0 ? 'text-sage' : 'text-destructive'
        )}>
          <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

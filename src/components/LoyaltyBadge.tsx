import { Crown, Award, Star, Gem } from 'lucide-react';
import { LoyaltyTier } from '@/lib/sampleData';
import { cn } from '@/lib/utils';

interface LoyaltyBadgeProps {
  tier?: LoyaltyTier;
  points?: number;
  showPoints?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  bronze: {
    icon: Award,
    label: 'Bronce',
    gradient: 'from-amber-600 to-amber-800',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  silver: {
    icon: Star,
    label: 'Plata',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  gold: {
    icon: Crown,
    label: 'Oro',
    gradient: 'from-gold to-gold-dark',
    bg: 'bg-gold/10',
    text: 'text-gold-dark',
    border: 'border-gold-light',
  },
  platinum: {
    icon: Gem,
    label: 'Platino',
    gradient: 'from-violet-400 to-violet-600',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-300',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

export function LoyaltyBadge({ tier = 'bronze', points = 0, showPoints = true, size = 'md' }: LoyaltyBadgeProps) {
  const config = tierConfig[tier];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        sizes.container,
        tier === 'gold' && 'animate-glow',
        tier === 'platinum' && 'animate-sparkle'
      )}
    >
      <Icon className={cn(sizes.icon, tier === 'gold' && 'text-gold')} strokeWidth={1.5} />
      <span>{config.label}</span>
      {showPoints && (
        <span className="opacity-70">• {points} pts</span>
      )}
    </div>
  );
}
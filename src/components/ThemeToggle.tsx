import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={cn(
        'fixed top-3 right-3 z-[100]',
        'h-9 w-9 rounded-full flex items-center justify-center',
        'border border-gold/50 shadow-luxury',
        'bg-card/95 backdrop-blur-md dark:bg-card/95',
        'transition-all duration-300 hover:scale-110 hover:border-gold hover:shadow-glow',
        'active:scale-95',
      )}
    >
      <span className="relative h-5 w-5">
        {/* Sun — visible en dark */}
        <Sun
          className={cn(
            'absolute inset-0 h-5 w-5 text-gold transition-all duration-300',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50',
          )}
          strokeWidth={1.5}
        />
        {/* Moon — visible en light */}
        <Moon
          className={cn(
            'absolute inset-0 h-5 w-5 text-gold transition-all duration-300',
            isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100',
          )}
          strokeWidth={1.5}
        />
      </span>
    </button>
  );
}

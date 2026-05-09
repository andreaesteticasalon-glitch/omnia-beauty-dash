import { cn } from '@/lib/utils';

interface FloralFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function FloralFrame({ children, className }: FloralFrameProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Corner decorations */}
      <svg 
        className="absolute -top-2 -left-2 w-12 h-12 text-gold/60" 
        viewBox="0 0 50 50" 
        fill="none"
      >
        <path 
          d="M5 25 C5 12, 12 5, 25 5 M25 5 C20 15, 15 20, 5 25" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path 
          d="M8 18 C12 14, 14 12, 18 8" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.5"/>
        <path 
          d="M3 20 Q8 20, 10 15 M20 3 Q20 8, 15 10" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      
      <svg 
        className="absolute -top-2 -right-2 w-12 h-12 text-gold/60 scale-x-[-1]" 
        viewBox="0 0 50 50" 
        fill="none"
      >
        <path 
          d="M5 25 C5 12, 12 5, 25 5 M25 5 C20 15, 15 20, 5 25" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path 
          d="M8 18 C12 14, 14 12, 18 8" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.5"/>
        <path 
          d="M3 20 Q8 20, 10 15 M20 3 Q20 8, 15 10" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      
      <svg 
        className="absolute -bottom-2 -left-2 w-12 h-12 text-gold/60 scale-y-[-1]" 
        viewBox="0 0 50 50" 
        fill="none"
      >
        <path 
          d="M5 25 C5 12, 12 5, 25 5 M25 5 C20 15, 15 20, 5 25" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path 
          d="M8 18 C12 14, 14 12, 18 8" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.5"/>
        <path 
          d="M3 20 Q8 20, 10 15 M20 3 Q20 8, 15 10" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      
      <svg 
        className="absolute -bottom-2 -right-2 w-12 h-12 text-gold/60 scale-[-1]" 
        viewBox="0 0 50 50" 
        fill="none"
      >
        <path 
          d="M5 25 C5 12, 12 5, 25 5 M25 5 C20 15, 15 20, 5 25" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path 
          d="M8 18 C12 14, 14 12, 18 8" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.5"/>
        <path 
          d="M3 20 Q8 20, 10 15 M20 3 Q20 8, 15 10" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Dashed border */}
      <div className="border-2 border-dashed border-gold/40 rounded-2xl p-6">
        {children}
      </div>
    </div>
  );
}

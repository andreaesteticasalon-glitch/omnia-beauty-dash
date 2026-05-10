import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans:    ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif:   ['Instrument Serif', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        rosegold: {
          DEFAULT: "hsl(var(--rosegold))",
          light: "hsl(var(--rosegold-light))",
          dark: "hsl(var(--rosegold-dark))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          soft: "hsl(var(--sage-soft))",
          foreground: "hsl(140, 25%, 25%)",
        },
        terracota: {
          DEFAULT: "#B86E54",
          soft:    "#F4E3DB",
          dark:    "#8A4E3A",
        },
        warn: {
          DEFAULT: "hsl(var(--warn))",
          soft:    "hsl(var(--warn-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft:    "hsl(var(--info-soft))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsla(12, 55%, 60%, 0.3)" },
          "50%": { boxShadow: "0 0 30px hsla(12, 55%, 60%, 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer-subtle": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer-subtle": "shimmer-subtle 4s ease-in-out infinite",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
      },
      boxShadow: {
        'soft':     '0 1px 2px rgba(43,39,34,0.04)',
        'card':     '0 6px 24px -12px rgba(43,39,34,0.10), 0 1px 2px rgba(43,39,34,0.04)',
        'elevated': '0 24px 48px -28px rgba(43,39,34,0.18), 0 2px 4px rgba(43,39,34,0.04)',
        'luxury':   '0 10px 32px -10px rgba(184,110,84,0.16)',
        'glow':     '0 0 24px rgba(184,110,84,0.20)',
        'gold':     '0 4px 16px -4px rgba(184,110,84,0.22)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

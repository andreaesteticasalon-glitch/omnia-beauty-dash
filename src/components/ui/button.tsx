import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-card active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-gold-light/50 bg-card hover:bg-gold/10 hover:border-gold hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft border border-gold-light/30",
        ghost: "hover:bg-gold/10 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        elegant: "bg-gradient-to-r from-primary via-rosegold to-primary text-primary-foreground shadow-card hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98] border border-rosegold-light/30",
        luxury: [
          "relative overflow-hidden text-primary-foreground font-semibold",
          "bg-gradient-to-r from-rosegold via-primary to-rosegold-dark",
          "shadow-glow hover:shadow-elevated",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
          "hover:scale-[1.02] active:scale-[0.98]",
          "border border-rosegold-light/40",
        ].join(" "),
        soft: "bg-muted text-muted-foreground hover:bg-muted/80 shadow-soft",
        gold: "bg-gradient-to-r from-gold via-gold-light to-gold text-gold-dark font-semibold shadow-gold hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-8 text-base",
        xl: "h-16 rounded-3xl px-10 text-lg font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

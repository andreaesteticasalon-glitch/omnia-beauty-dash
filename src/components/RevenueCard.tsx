import { Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RevenueCardProps {
  amount: number;
}

const RevenueCard = ({ amount }: RevenueCardProps) => {
  return (
    <Card className="glass-card border-0 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 gradient-blush opacity-50" />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Caja de hoy
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-semibold text-foreground">
                {amount}
              </span>
              <span className="text-2xl font-serif text-primary">€</span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            +12%
          </span>
          <span>vs. ayer</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;

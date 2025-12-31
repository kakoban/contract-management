import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, className, delay = 0 }: StatCardProps) {
  return (
    <div 
      className={cn(
        "gradient-card rounded-xl p-5 border border-border/50 shadow-card opacity-0 animate-fade-in hover:border-primary/30 transition-all duration-300",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}

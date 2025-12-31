import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw,
  Settings,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "داشبورد", active: false },
  { icon: FileText, label: "قراردادها", active: true },
  { icon: Clock, label: "موارد اضطراری", active: false },
  { icon: DollarSign, label: "بودجه", active: false },
  { icon: CheckCircle2, label: "پیشرفت", active: false },
];

const bottomItems: NavItem[] = [
  { icon: Settings, label: "تنظیمات" },
  { icon: HelpCircle, label: "راهنما" },
];

export function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 h-screen w-16 bg-sidebar border-l border-sidebar-border flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center mb-8 shadow-glow animate-pulse-glow">
        <span className="text-primary-foreground font-bold text-lg">م</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 group relative",
              item.active 
                ? "bg-primary text-primary-foreground shadow-glow" 
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {/* Tooltip */}
            <span className="absolute left-full mr-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Refresh Button */}
      <button className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 mb-4">
        <RefreshCw className="h-5 w-5" />
      </button>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-2 border-t border-sidebar-border pt-4">
        {bottomItems.map((item, index) => (
          <button
            key={index}
            className="h-11 w-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300"
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </aside>
  );
}

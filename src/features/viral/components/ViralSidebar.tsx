import {
  Home,
  Flame,
  Search,
  Moon,
  Sun,
  Bookmark,
  HelpCircle,
  LogOut,
  User,
  LayoutDashboard,
  Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViralView = "home" | "viral" | "videos" | "saved" | "tools" | "glossary" | "search";

interface ViralSidebarProps {
  view: ViralView;
  onChangeView: (view: ViralView) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: any;
  onLogout: () => void;
}

import { useNavigate, useLocation } from "react-router-dom";

export function ViralSidebar({
  view,
  onChangeView,
  isDark,
  onToggleTheme,
  user,
  onLogout
}: ViralSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({
    id,
    icon: Icon,
    label
  }: {
    id: ViralView;
    icon: any;
    label: string
  }) => (
    <button
      onClick={() => onChangeView(id)}
      className={cn(
        "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
        view === id
          ? "bg-primary/10 text-primary shadow-glow-sm"
          : "text-muted-foreground hover:bg-surface hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
          view === id ? "text-primary" : "text-muted-foreground"
        )}
        strokeWidth={view === id ? 2.5 : 2}
      />
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );

  return (
    <aside className="hidden h-screen w-[90px] flex-col items-center justify-between border-r border-border/50 bg-background/95 py-6 backdrop-blur-xl transition-all sm:flex z-50">
      {/* Top: Logo simplificado o Home */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => onChangeView("home")}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-glow transition-transform hover:scale-105"
        >
          <Flame className="h-6 w-6 text-white fill-white" />
        </button>

        <nav className="flex flex-col gap-3 mt-4">
          <NavItem id="viral" icon={Home} label="Inicio" />

          <NavItem id="search" icon={Search} label="Buscar" />
          <NavItem id="saved" icon={Bookmark} label="Guardado" />

          <button
            onClick={() => navigate('/studio')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/studio')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <Clapperboard
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/studio') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/studio') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Studio</span>
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/analytics')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <LayoutDashboard
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/analytics') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/analytics') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Analytics</span>
          </button>
        </nav>
      </div>
    </aside >
  );
}
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
  LayoutDashboard
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
          <NavItem id="home" icon={Home} label="Inicio" />

          <NavItem id="search" icon={Search} label="Buscar" />
          <NavItem id="saved" icon={Bookmark} label="Guardado" />
          <NavItem id="glossary" icon={HelpCircle} label="Glosario" />

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

      {/* Bottom: User, Settings & Theme */}
      <div className="flex flex-col gap-4 items-center mb-2">

        {/* User Profile */}
        {user && (
          <div className="group relative flex flex-col items-center gap-2">
            <div
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 bg-surface shadow-glow-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title={`Conectado como ${user.email}`}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="group flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Interruptor de Tema */}
        <button
          onClick={onToggleTheme}
          className="group flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface hover:text-yellow-400"
          title={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
        >
          {isDark ? (
            <Sun className="h-6 w-6 transition-transform group-hover:rotate-90 group-hover:scale-110" />
          ) : (
            <Moon className="h-6 w-6 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
          )}
        </button>
      </div>
    </aside>
  );
}
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
  Clapperboard,
  Target,
  Key,
  Plug,
  ShieldCheck
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ViralView = "viral" | "videos" | "saved" | "tools" | "glossary";

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
      onClick={() => {
        if (location.pathname !== '/' && ['viral', 'saved', 'glossary', 'tools'].includes(id)) {
          navigate('/', { state: { view: id } });
        } else {
          onChangeView(id);
        }
      }}
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
          onClick={() => {
            onChangeView("viral");
            navigate('/');
          }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-glow transition-transform hover:scale-105"
        >
          <Flame className="h-6 w-6 text-white fill-white" />
        </button>

        <nav className="flex flex-col gap-3 mt-4">
          <NavItem id="viral" icon={Home} label="Inicio" />



          <button
            onClick={() => navigate('/outliers')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/outliers')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <Target
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/outliers') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/outliers') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Outliers</span>
          </button>

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

          <button
            onClick={() => navigate('/integrations')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/integrations')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
            title="Integraciones y Conexiones"
          >
            <Plug
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/integrations') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/integrations') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Integración</span>
          </button>

          <button
            onClick={() => navigate('/policies')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/policies')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
            title="Políticas Oficiales y Normas de YouTube"
          >
            <ShieldCheck
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/policies') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/policies') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Políticas</span>
          </button>
        </nav>
      </div>

      {/* Bottom: User, Settings & Theme */}
      <div className="flex flex-col gap-3 items-center mb-2 w-full">

        {/* Bottom Utils */}
        <div className="flex flex-col gap-1 w-full px-2">
          <NavItem id="glossary" icon={HelpCircle} label="Glosario" />
          <button
            onClick={() => navigate('/profile')}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all duration-300",
              location.pathname.startsWith('/profile')
                ? "bg-primary/10 text-primary shadow-glow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
            title="Mi Perfil"
          >
            <User
              className={cn(
                "h-6 w-6 transition-transform duration-300 group-hover:scale-110",
                location.pathname.startsWith('/profile') ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2}
            />
            <span className="text-[10px] font-bold tracking-wide">Perfil</span>
          </button>
        </div>

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
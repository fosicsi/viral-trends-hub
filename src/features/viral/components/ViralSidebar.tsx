import {
  Home,
  Flame,
  Search,
  Settings,
  Moon,
  Sun,
  Bookmark,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViralView = "home" | "viral" | "videos" | "saved" | "tools" | "glossary";

interface ViralSidebarProps {
  view: ViralView;
  onChangeView: (view: ViralView) => void;
  onOpenSettings: () => void; // Cambiamos nombre: de ApiKey a Settings
  isDark: boolean;
  onToggleTheme: () => void;
}

export function ViralSidebar({
  view,
  onChangeView,
  onOpenSettings,
  isDark,
  onToggleTheme
}: ViralSidebarProps) {

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
          <NavItem id="viral" icon={Flame} label="Viral" />
          <NavItem id="videos" icon={Search} label="Buscar" />
          <NavItem id="saved" icon={Bookmark} label="Saved" />
          <NavItem id="glossary" icon={HelpCircle} label="Glosario" />
        </nav>
      </div>

      {/* Bottom: Settings & Theme */}
      <div className="flex flex-col gap-4 items-center mb-2">

        {/* Interruptor de Tema */}
        <button
          onClick={onToggleTheme}
          className="group flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface hover:text-yellow-400"
          title={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
        >
          {isDark ? (
            // Estamos en Dark, mostramos SOL para ir a Light
            <Sun className="h-6 w-6 transition-transform group-hover:rotate-90 group-hover:scale-110" />
          ) : (
            // Estamos en Light, mostramos LUNA para ir a Dark
            <Moon className="h-6 w-6 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
          )}
        </button>

        <div className="h-px w-8 bg-border/50" />

        {/* Botón de Ajustes (Rueda Dentada) */}
        <button
          onClick={onOpenSettings}
          className="group flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface hover:text-primary"
          title="Configuración y API Keys"
        >
          <Settings className="h-6 w-6 transition-transform duration-500 group-hover:rotate-180" />
        </button>
      </div>
    </aside>
  );
}
import * as React from "react";
import { cn } from "@/lib/utils";
import { Bookmark, Grid3X3, Home, KeyRound, Search, Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export type ViralView = "home" | "videos" | "viral" | "saved" | "tools";

type Props = {
  view: ViralView;
  onChangeView: (v: ViralView) => void;
  onOpenApiKey: () => void;
};

function SidebarItem({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-xl grid place-items-center transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
        active && "bg-primary text-primary-foreground shadow-glow",
      )}
    >
      {children}
    </button>
  );
}

export function ViralSidebar({ view, onChangeView, onOpenApiKey }: Props) {
  return (
    <aside className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 z-20 shrink-0">
      <button
        onClick={() => onChangeView("home")}
        className={cn(
          "mb-8 p-3 rounded-xl shadow-glow",
          "bg-gradient-to-br from-primary via-primary to-brand-2",
        )}
        aria-label="Ir a inicio"
      >
        <Zap className="text-primary-foreground" size={20} />
      </button>

      <div className="flex-1 w-full flex flex-col items-center px-2 gap-3">
        <SidebarItem ariaLabel="Inicio" active={view === "home"} onClick={() => onChangeView("home")}>
          <Home size={22} />
        </SidebarItem>
        <SidebarItem ariaLabel="Buscar" active={view === "videos"} onClick={() => onChangeView("videos")}>
          <Search size={22} />
        </SidebarItem>
        <SidebarItem ariaLabel="Viral" active={view === "viral"} onClick={() => onChangeView("viral")}>
          <Zap size={22} />
        </SidebarItem>
        <SidebarItem ariaLabel="Guardados" active={view === "saved"} onClick={() => onChangeView("saved")}>
          <Bookmark size={22} />
        </SidebarItem>
        <SidebarItem ariaLabel="Herramientas" active={view === "tools"} onClick={() => onChangeView("tools")}>
          <Grid3X3 size={22} />
        </SidebarItem>
      </div>

      <div className="mt-auto w-full flex flex-col items-center px-2 gap-3">
        <ThemeToggle />
        <SidebarItem ariaLabel="Configurar API" onClick={onOpenApiKey}>
          <KeyRound size={22} />
        </SidebarItem>
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "w-12 h-12 rounded-xl grid place-items-center transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {isDark ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}

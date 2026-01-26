import type { ViralView } from "./ViralSidebar";

const labels: Record<ViralView, string> = {
  home: "Inicio",
  videos: "Buscador",
  viral: "Explorador Viral",
  saved: "Guardados",
  tools: "Herramientas",
};

export function ViralTopbar({ view }: { view: ViralView }) {
  return (
    <header className="h-20 border-b border-border flex items-center justify-between px-6 md:px-8 bg-background/40 backdrop-blur shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight">{labels[view]}</h1>
      </div>
      <div className="hidden md:block text-sm text-muted-foreground">
        Encuentra temas virales en YouTube con señales rápidas (views/h, ratio, subs).
      </div>
    </header>
  );
}

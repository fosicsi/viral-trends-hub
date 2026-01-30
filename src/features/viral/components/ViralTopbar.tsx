import { Zap } from "lucide-react";

interface ViralTopbarProps {
  view: string;
}

export function ViralTopbar({ view }: ViralTopbarProps) {
  return (
    <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-2">
        {/* Isotipo: Cuadrado con icono de energía */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow-sm">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        {/* Logotipo */}
        <span className="text-lg font-bold tracking-tight">ViralTrends</span>
      </div>

      {/* Área derecha limpia: Aquí estaba el texto que borramos */}
      <div className="flex items-center gap-4">
        {/* Badge de versión discreto */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          System Online
        </div>
      </div>
    </div>
  );
}
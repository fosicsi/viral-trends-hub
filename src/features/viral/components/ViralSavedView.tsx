import * as React from "react";
import type { VideoItem } from "../types";
import { ViralVideoCard } from "./ViralVideoCard";
import { ScriptDisplayModal } from "./ScriptDisplayModal";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Clock, Gem, TrendingUp, Users } from "lucide-react";

type SortOption = "recent" | "potential" | "subs_low" | "views";

export function ViralSavedView({
  saved,
  onOpen,
  onToggleSave,
  onGoSearch,
  onClear,
  onTagClick,
  onGenerateScript,
}: {
  saved: VideoItem[];
  onOpen: (v: VideoItem) => void;
  onToggleSave: (v: VideoItem) => void;
  onGoSearch: () => void;
  onClear: () => void;
  onGenerateScript?: (v: VideoItem) => void;
  onTagClick?: (tag: string) => void;
}) {
  const [sortBy, setSortBy] = React.useState<SortOption>("recent");

  // Lógica de ordenamiento inteligente
  const sortedVideos = React.useMemo(() => {
    // Creamos una copia para no mutar el original
    const data = [...saved];

    switch (sortBy) {
      case "potential":
        // Ordenar por Ratio de Crecimiento (Views / Subs)
        return data.sort((a, b) => {
          const ratioA = a.growthRatio || (a.channelSubscribers > 0 ? a.views / a.channelSubscribers : 0);
          const ratioB = b.growthRatio || (b.channelSubscribers > 0 ? b.views / b.channelSubscribers : 0);
          return ratioB - ratioA; // De mayor a menor
        });
      case "subs_low":
        // Ordenar por Suscriptores (Ascendente: de menos a más)
        return data.sort((a, b) => a.channelSubscribers - b.channelSubscribers);
      case "views":
        // Ordenar por Vistas (Descendente)
        return data.sort((a, b) => b.views - a.views);
      case "recent":
      default:
        // Asumimos que la DB ya los devuelve por fecha de creación, o usamos el orden original
        return data;
    }
  }, [saved, sortBy]);

  const [viewingScriptVideo, setViewingScriptVideo] = React.useState<VideoItem | null>(null);

  const handleScriptAction = (video: VideoItem) => {
    if (video.scriptStatus === 'done') {
      setViewingScriptVideo(video);
    } else {
      if (onGenerateScript) {
        onGenerateScript(video);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Guardados</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Tu colección de oportunidades. <span className="text-primary font-bold">Sincronizado en la nube ☁️</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" className="rounded-2xl" onClick={onGoSearch}>
              Buscar más
            </Button>
            <Button
              variant="glowOutline"
              className="rounded-2xl"
              onClick={onClear}
              disabled={saved.length === 0}
            >
              Limpiar lista
            </Button>
          </div>
        </div>

        {/* Barra de Filtros de Ordenamiento */}
        {saved.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mr-2">
              Ordenar por:
            </p>

            <Button
              variant={sortBy === "recent" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className="rounded-xl text-xs font-bold"
            >
              <Clock size={14} className="mr-2" /> Recientes
            </Button>

            <Button
              variant={sortBy === "potential" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("potential")}
              className={sortBy === "potential" ? "rounded-xl text-xs font-bold bg-primary/20 text-primary hover:bg-primary/30" : "rounded-xl text-xs font-bold"}
            >
              <Gem size={14} className="mr-2" /> Mayor Potencial 💎
            </Button>

            <Button
              variant={sortBy === "subs_low" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("subs_low")}
              className="rounded-xl text-xs font-bold"
            >
              <Users size={14} className="mr-2" /> Canales Pequeños
            </Button>

            <Button
              variant={sortBy === "views" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("views")}
              className="rounded-xl text-xs font-bold"
            >
              <TrendingUp size={14} className="mr-2" /> Más Vistas
            </Button>
          </div>
        )}
      </div>

      {sortedVideos.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card p-10 shadow-elev text-center animate-in fade-in zoom-in duration-500">
          <p className="text-lg font-extrabold">Todavía no guardaste nada</p>
          <p className="text-muted-foreground mt-2">
            Explora videos y toca el botón <span className="font-bold">Guardar</span> para armar tu colección.
          </p>
          <div className="mt-6">
            <Button variant="hero" className="rounded-2xl" onClick={onGoSearch}>
              Ir al buscador
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedVideos.map((v) => (
            <ViralVideoCard
              key={v.id}
              video={v}
              onOpen={onOpen}
              saved
              onToggleSave={onToggleSave}
              onGenerateScript={handleScriptAction}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      )}

      {/* Script Modal */}
      <ScriptDisplayModal
        isOpen={!!viewingScriptVideo}
        onClose={() => setViewingScriptVideo(null)}
        scriptData={viewingScriptVideo?.scriptContent}
        videoTitle={viewingScriptVideo?.title}
      />
    </div>
  );
}
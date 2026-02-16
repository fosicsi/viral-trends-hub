import * as React from "react";
import type { VideoItem } from "../types";
import { ViralVideoCard } from "./ViralVideoCard";
import { ScriptDisplayModal } from "./ScriptDisplayModal";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Clock, Gem, TrendingUp, Users, Lightbulb, Video, LayoutGrid } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SortOption = "recent" | "potential" | "subs_low" | "views";

// Move EmptyState outside to prevent re-mounting on every render
const EmptyState = ({ tab, onGoSearch }: { tab: "ideas" | "refs", onGoSearch: () => void }) => (
  <div className="rounded-[28px] border border-border bg-card p-12 shadow-elev text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      {tab === "ideas" ? <Lightbulb className="w-8 h-8 text-muted-foreground" /> : <Video className="w-8 h-8 text-muted-foreground" />}
    </div>
    <p className="text-xl font-black text-foreground">
      {tab === "ideas" ? "Sin ideas guardadas" : "Sin referencias guardadas"}
    </p>
    <p className="text-muted-foreground mt-2 max-w-sm">
      {tab === "ideas"
        ? "Usa 'Estratega IA' para generar y guardar ideas de contenido validadas."
        : "Explora videos en 'Viral Search' y guárdalos aquí para inspirarte después."}
    </p>
    <div className="mt-8">
      <Button variant="hero" className="rounded-2xl" onClick={onGoSearch}>
        {tab === "ideas" ? "Ir a Estratega IA" : "Ir al Buscador"}
      </Button>
    </div>
  </div>
);

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

  // Separate content - memoized
  const ideas = React.useMemo(() => saved.filter(item => item.sourceTable === 'content_creation_plan'), [saved]);
  const references = React.useMemo(() => saved.filter(item => item.sourceTable !== 'content_creation_plan'), [saved]);

  // Sorting logic helper
  const sortData = React.useCallback((data: VideoItem[]) => {
    const list = [...data];
    switch (sortBy) {
      case "potential":
        return list.sort((a, b) => {
          const ratioA = a.growthRatio || (a.channelSubscribers > 0 ? a.views / a.channelSubscribers : 0);
          const ratioB = b.growthRatio || (b.channelSubscribers > 0 ? b.views / b.channelSubscribers : 0);
          return ratioB - ratioA;
        });
      case "subs_low":
        return list.sort((a, b) => a.channelSubscribers - b.channelSubscribers);
      case "views":
        return list.sort((a, b) => b.views - a.views);
      case "recent":
      default:
        // Assuming DB order or fallback to index
        return list;
    }
  }, [sortBy]);

  const sortedIdeas = React.useMemo(() => sortData(ideas), [ideas, sortData]);
  const sortedReferences = React.useMemo(() => sortData(references), [references, sortData]);

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
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Biblioteca Creativa</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona tus futuras producciones y referencias. <span className="text-primary font-bold">☁️ Sincronizado</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={saved.length === 0}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpiar Todo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="ideas" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Lightbulb className="w-4 h-4 mr-2" /> Mis Ideas ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="refs" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <LayoutGrid className="w-4 h-4 mr-2" /> Referencias ({references.length})
          </TabsTrigger>
        </TabsList>

        {/* CONTROLS BAR (Shared Sort) */}
        {saved.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 ml-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-2">Ordenar:</p>
            <Button variant={sortBy === "recent" ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy("recent")} className="h-7 rounded-lg text-xs font-bold"><Clock size={12} className="mr-1.5" /> Recientes</Button>
            <Button variant={sortBy === "potential" ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy("potential")} className={`h-7 rounded-lg text-xs font-bold ${sortBy === "potential" ? "bg-primary/20 text-primary" : ""}`}><Gem size={12} className="mr-1.5" /> Potencial</Button>
            <Button variant={sortBy === "views" ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy("views")} className="h-7 rounded-lg text-xs font-bold"><TrendingUp size={12} className="mr-1.5" /> Vistas</Button>
          </div>
        )}

        <TabsContent value="ideas" className="space-y-6 focus-visible:ring-0 outline-none mt-0">
          {sortedIdeas.length === 0 ? (
            <EmptyState tab="ideas" onGoSearch={onGoSearch} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedIdeas.map((v) => (
                <ViralVideoCard
                  key={v.id}
                  video={v}
                  onOpen={onOpen} // In ideas, this might open the script modal directly or a preview
                  saved
                  onToggleSave={onToggleSave}
                  onGenerateScript={handleScriptAction} // For ideas, this is "Ver Idea"
                  onTagClick={onTagClick}
                  isIdeaMode
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="refs" className="space-y-6 focus-visible:ring-0 outline-none mt-0">
          {sortedReferences.length === 0 ? (
            <EmptyState tab="refs" onGoSearch={onGoSearch} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedReferences.map((v) => (
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
        </TabsContent>
      </Tabs>

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
import * as React from "react";
import { ViralSidebar, type ViralView } from "./components/ViralSidebar";
import { ViralTopbar } from "./components/ViralTopbar";
import { ViralSearchHeader } from "./components/ViralSearchHeader";
import { ViralVideoCard } from "./components/ViralVideoCard";
import { ViralFiltersDialog } from "./components/ViralFiltersDialog";
import { ApiKeyDialog } from "./components/ApiKeyDialog";
import type { ViralFilters, VideoItem } from "./types";
import { mockVideos } from "./mock";
import { Button } from "@/components/ui/button";

const LS_API_KEY = "viradrian_api_key";

export default function ViralApp() {
  const [view, setView] = React.useState<ViralView>("home");
  const [query, setQuery] = React.useState<string>("");
  const [selected, setSelected] = React.useState<VideoItem | null>(null);
  const [apiKey, setApiKey] = React.useState<string>("");
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<ViralFilters>({
    minViews: 10_000,
    maxSubs: 500_000,
    date: "year",
    type: "all",
  });

  React.useEffect(() => {
    // dark-first by default
    document.documentElement.classList.add("dark");
  }, []);

  React.useEffect(() => {
    const k = localStorage.getItem(LS_API_KEY);
    if (k) setApiKey(k);
  }, []);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockVideos
      .filter((v) => (q ? `${v.title} ${v.channel}`.toLowerCase().includes(q) : true))
      .filter((v) => v.views >= filters.minViews && v.channelSubscribers <= filters.maxSubs)
      .sort((a, b) => b.growthRatio - a.growthRatio);
  }, [query, filters]);

  const handleSearch = () => {
    // UI-only v1: when we wire the real search we will require apiKey.
    setView("videos");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ViralSidebar view={view} onChangeView={setView} onOpenApiKey={() => setShowApiKey(true)} />

      <div className="flex-1 min-w-0 flex flex-col bg-background relative">
        <div className="pointer-events-none absolute inset-0 bg-hero-field opacity-70" />
        <ViralTopbar view={view} />

        <main className="flex-1 overflow-y-auto relative">
          {view === "home" && (
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.02] tracking-tight">
                    Encuentra temas virales <span className="text-primary">antes</span> de que revienten.
                  </h1>
                  <p className="text-muted-foreground text-lg md:text-xl max-w-xl">
                    Un tablero para descubrir oportunidades en YouTube con señales rápidas: vistas, velocidad y relación
                    views/subs.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="hero" size="xl" className="rounded-2xl" onClick={() => setView("videos")}>
                      Empezar a buscar
                    </Button>
                    <Button
                      variant="glowOutline"
                      size="xl"
                      className="rounded-2xl"
                      onClick={() => {
                        setQuery("IA");
                        setView("videos");
                      }}
                    >
                      Probar con “IA”
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {apiKey ? (
                      <span>
                        API Key detectada en tu navegador. Cuando quieras, conectamos el buscador real.
                      </span>
                    ) : (
                      <span>
                        Aún no hay API Key: puedes cargarla desde el icono de llave. (UI v1 funciona con datos de ejemplo.)
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="rounded-[28px] border border-border bg-card shadow-glow p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Vista previa</p>
                        <p className="text-lg font-extrabold">Señales de oportunidad</p>
                      </div>
                      <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 grid place-items-center animate-float-y">
                        <span className="text-primary font-black">V</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {results.slice(0, 2).map((v) => (
                        <ViralVideoCard key={v.id} video={v} onOpen={setSelected} />
                      ))}
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button variant="soft" className="rounded-xl" onClick={() => setShowFilters(true)}>
                        Ajustar filtros
                      </Button>
                      <Button variant="glowOutline" className="rounded-xl" onClick={() => setView("videos")}
                      >
                        Ver grid completo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "videos" && (
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-8">
              <ViralSearchHeader
                query={query}
                onChangeQuery={setQuery}
                onSearch={handleSearch}
                filters={filters}
                onOpenFilters={() => setShowFilters(true)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((v) => (
                  <ViralVideoCard key={v.id} video={v} onOpen={setSelected} />
                ))}
                {results.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    No hay resultados con estos filtros. Prueba bajando el mínimo de vistas o subiendo el máximo de subs.
                  </div>
                )}
              </div>
            </section>
          )}

          {(view === "viral" || view === "saved" || view === "tools") && (
            <section className="max-w-6xl mx-auto px-6 md:px-10 py-16">
              <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
                <h2 className="text-2xl font-extrabold">En construcción</h2>
                <p className="text-muted-foreground mt-2">
                  En v2 conectamos el flujo real del video (viralyt.ai): explorador viral, guardados y herramientas.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="hero" className="rounded-xl" onClick={() => setView("videos")}>
                    Ir al buscador
                  </Button>
                  <Button variant="glowOutline" className="rounded-xl" onClick={() => setShowApiKey(true)}>
                    Configurar API Key
                  </Button>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Simple “details” for v1 */}
        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur p-4">
            <div className="w-full max-w-3xl rounded-3xl border border-border bg-card shadow-glow overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Señales</p>
                  <p className="text-lg font-extrabold line-clamp-1">{selected.title}</p>
                </div>
                <Button variant="soft" className="rounded-xl" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-surface border-t border-border md:border-t-0 md:border-r p-5">
                  <img
                    src={selected.thumbnail}
                    alt={`Miniatura de ${selected.title}`}
                    className="w-full rounded-2xl border border-border object-cover"
                    loading="lazy"
                  />
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-sm font-bold text-primary hover:underline"
                  >
                    Abrir en YouTube
                  </a>
                </div>
                <div className="p-5 space-y-3">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Idea</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      En v2 aquí mostramos tags, velocidad real (views/h), y alertas de “canal pequeño con muchas vistas”.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Siguiente paso</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Conectar el buscador real con YouTube Data API (mejor via backend para no exponer la key).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ViralFiltersDialog
        open={showFilters}
        onOpenChange={setShowFilters}
        value={filters}
        onChange={setFilters}
        onApply={() => setShowFilters(false)}
      />

      <ApiKeyDialog
        open={showApiKey}
        onOpenChange={setShowApiKey}
        value={apiKey}
        onSave={(k) => {
          setApiKey(k);
          localStorage.setItem(LS_API_KEY, k);
        }}
      />
    </div>
  );
}

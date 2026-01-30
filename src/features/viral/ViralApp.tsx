import * as React from "react";
import { ViralSidebar, type ViralView } from "./components/ViralSidebar";
import { ViralTopbar } from "./components/ViralTopbar";
import { ViralSearchHeader } from "./components/ViralSearchHeader";
import { ViralVideoCard } from "./components/ViralVideoCard";
import { NicheInsightsBar } from "./components/NicheInsightsBar";
import { ViralFiltersDialog } from "./components/ViralFiltersDialog";
import { ViralSettingsDialog } from "./components/ViralSettingsDialog";
import { ViralSavedView } from "./components/ViralSavedView";
import { ViralToolsView } from "./components/ViralToolsView";
import { ViralSortControl, type SortOption } from "./components/ViralSortControl";
import type { ViralFilters, VideoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Flame, TrendingUp, AlertCircle, Award, CheckCircle2, Wand2, Copy, ArrowLeft } from "lucide-react";
import { youtubeSearch } from "@/lib/api/youtube";
import { aiViralTopic } from "@/lib/api/ai-viral-topics";
import { generateViralScript, type ViralScript } from "@/lib/api/generate-script"; // IMPORTAR ESTO
import { useSavedVideos } from "./hooks/useSavedVideos";
import { formatNumber, getRelativeTime } from "@/lib/format";

const VIRAL_TOPICS = [
  "inteligencia artificial", "finanzas personales", "fitness en casa", "recetas rápidas",
  "motivación", "productividad", "misterios y datos curiosos", "tecnología gadgets",
  "historias reales", "animales y mascotas", "gaming", "emprendimiento",
];

export default function ViralApp() {
  const [view, setView] = React.useState<ViralView>("home");
  const [query, setQuery] = React.useState<string>("");
  const [selected, setSelected] = React.useState<VideoItem | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [liveResults, setLiveResults] = React.useState<VideoItem[]>([]);
  const [sortBy, setSortBy] = React.useState<SortOption>("views");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Estados para IA
  const [aiLoading, setAiLoading] = React.useState(false);
  const [scriptLoading, setScriptLoading] = React.useState(false);
  const [generatedScript, setGeneratedScript] = React.useState<ViralScript | null>(null);

  const [isDark, setIsDark] = React.useState(true); 

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    if (nextState) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  React.useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  // Estados del Explorador
  const [viralTopic, setViralTopic] = React.useState<string>(VIRAL_TOPICS[0]);
  const [viralInput, setViralInput] = React.useState<string>(""); 
  const [viralResults, setViralResults] = React.useState<VideoItem[]>([]);
  const [viralSortBy, setViralSortBy] = React.useState<SortOption>("views");
  const [viralLoading, setViralLoading] = React.useState(false);
  const [viralError, setViralError] = React.useState<string | null>(null);
  const [aiCriteria, setAiCriteria] = React.useState<string | null>(null);
  const [showViralFilters, setShowViralFilters] = React.useState(false);
  
  const [viralFilters, setViralFilters] = React.useState<ViralFilters>({ minViews: 10_000, maxSubs: 200_000, date: "week", type: "short", order: "viewCount", });
  const [filters, setFilters] = React.useState<ViralFilters>({ minViews: 10_000, maxSubs: 500_000, date: "year", type: "short", order: "viewCount", });

  const { saved, isSaved, toggleSaved, clearSaved } = useSavedVideos();

  // Resetear el script cuando se cierra o cambia el video
  React.useEffect(() => {
    setGeneratedScript(null);
    setScriptLoading(false);
  }, [selected]);

  // --- LÓGICA DE GENERACIÓN DE SCRIPT ---
  const handleGenerateScript = async () => {
    if (!selected) return;
    
    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      alert("⚠️ Primero configura tu API Key de OpenAI en Ajustes (⚙️)");
      setShowSettings(true);
      return;
    }

    setScriptLoading(true);
    try {
      const res = await generateViralScript(selected.title, selected.channelTitle, apiKey);
      if ("error" in res) {
        alert("Error: " + res.error);
      } else {
        setGeneratedScript(res);
      }
    } catch (e) {
      alert("Error inesperado al generar el guion.");
    } finally {
      setScriptLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Podríamos poner un toast aquí, pero por simpleza:
    const btn = document.getElementById("copy-btn");
    if(btn) btn.innerText = "¡Copiado!";
    setTimeout(() => { if(btn) btn.innerText = "Copiar Guion"; }, 2000);
  };

  // ... (getSignals, sortVideos, y demás funciones de búsqueda se mantienen igual)
  const getSignals = React.useCallback((v: VideoItem) => {
    const now = Date.now();
    const publishedMs = Date.parse(v.publishedAt);
    const ageHours = Number.isFinite(publishedMs) ? Math.max(1, (now - publishedMs) / (1000 * 60 * 60)) : 72;
    const viewsPerHour = Math.max(1, Math.round(v.views / ageHours));
    
    let score = 0;
    if (v.growthRatio > 1) score += 20;
    if (v.growthRatio > 5) score += 20;
    if (v.growthRatio > 10) score += 20;
    if (viewsPerHour > 100) score += 10;
    if (viewsPerHour > 1000) score += 10;
    if (v.channelSubscribers < 50000) score += 20;
    score = Math.min(100, score);

    let verdict = "Video Standard";
    let verdictColor = "text-muted-foreground";
    let verdictBg = "bg-surface";
    let badges = [];

    if (score >= 80) {
      verdict = "💎 NICHO DE ORO";
      verdictColor = "text-yellow-400";
      verdictBg = "bg-yellow-500/10 border-yellow-500/50";
      badges.push({ icon: <Award className="w-3 h-3" />, text: "Top Tier", color: "text-yellow-400 bg-yellow-400/10" });
    } else if (score >= 50) {
      verdict = "🚀 OPORTUNIDAD ALTA";
      verdictColor = "text-primary";
      verdictBg = "bg-primary/10 border-primary/50";
      badges.push({ icon: <TrendingUp className="w-3 h-3" />, text: "Trending", color: "text-primary bg-primary/10" });
    } else {
      badges.push({ icon: <CheckCircle2 className="w-3 h-3" />, text: "Estable", color: "text-slate-400 bg-slate-400/10" });
    }

    if (viewsPerHour > 500) badges.push({ icon: <Flame className="w-3 h-3" />, text: "Muy Viral", color: "text-orange-500 bg-orange-500/10" });
    if (v.growthRatio > 10) badges.push({ icon: <AlertCircle className="w-3 h-3" />, text: "Outlier", color: "text-red-400 bg-red-400/10" });

    return { ageLabel: getRelativeTime(v.publishedAt), viewsPerHour, score, verdict, verdictColor, verdictBg, badges, ratio: v.growthRatio };
  }, []);

  const sortVideos = React.useCallback((videos: VideoItem[], sort: SortOption): VideoItem[] => {
    const sorted = [...videos];
    switch (sort) {
      case "views": return sorted.sort((a, b) => b.views - a.views);
      case "subs": return sorted.sort((a, b) => a.channelSubscribers - b.channelSubscribers);
      case "recent": return sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      case "growth": return sorted.sort((a, b) => b.growthRatio - a.growthRatio);
      default: return sorted;
    }
  }, []);

  const sortedLiveResults = React.useMemo(() => sortVideos(liveResults, sortBy), [liveResults, sortBy, sortVideos]);
  const sortedViralResults = React.useMemo(() => sortVideos(viralResults, viralSortBy), [viralResults, viralSortBy, sortVideos]);

  const handleSearchGeneric = async (q: string, f: ViralFilters, isViral: boolean) => {
    const targetSetResults = isViral ? setViralResults : setLiveResults;
    const targetSetError = isViral ? setViralError : setError;
    const targetSetLoading = isViral ? setViralLoading : setLoading;
    if (!q.trim()) return;
    targetSetLoading(true);
    targetSetError(null);
    try {
      const res = await youtubeSearch(q.trim(), f);
      if ("error" in res) { targetSetError(res.error); targetSetResults([]); } 
      else { targetSetResults(res.data); }
    } catch (e) { targetSetError(e instanceof Error ? e.message : "Error inesperado"); targetSetResults([]); } 
    finally { targetSetLoading(false); }
  };

  const handleAiViral = async () => {
    const preset: ViralFilters = { minViews: 10_000, maxSubs: 200_000, date: "week", type: "short", order: "date" };
    setAiLoading(true);
    setAiCriteria(null);
    try {
      const res = await aiViralTopic();
      if (!res.success) { setViralError(res.error || "Error IA"); return; }
      setViralFilters(preset); setViralTopic(res.topic); setViralInput(res.topic);
      setAiCriteria(res.criteria || `Topic sugerido: ${res.topic}`);
      setView("viral"); await handleSearchGeneric(res.topic, preset, true);
    } catch (e) { setViralError("Error conectando con IA"); } 
    finally { setAiLoading(false); }
  };

  const runViralSearch = (topic?: string) => { const q = topic || viralInput || viralTopic; handleSearchGeneric(q, viralFilters, true); };
  const handleSearch = () => handleSearchGeneric(query, filters, false);
  const handleTagClick = (tag: string) => { setQuery(tag); setView("videos"); handleSearchGeneric(tag, filters, false); };
  React.useEffect(() => { if (view === "viral" && viralResults.length === 0 && !viralLoading) { runViralSearch(viralTopic); } }, [view]);

  return (
    <div className="flex h-screen overflow-hidden">
      <ViralSidebar view={view} onChangeView={setView} onOpenSettings={() => setShowSettings(true)} isDark={isDark} onToggleTheme={toggleTheme} />
      <div className="flex-1 min-w-0 flex flex-col bg-background relative transition-colors duration-500">
        <div className="pointer-events-none absolute inset-0 bg-hero-field opacity-70" />
        <ViralTopbar view={view} />
        <main className="flex-1 overflow-y-auto relative">
          
          {view === "home" && (
            <section className="flex flex-col items-center justify-center min-h-[85vh] px-6 py-12 animate-in fade-in duration-700">
              <div className="text-center space-y-6 max-w-3xl mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Motor de Inteligencia V 2.0
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
                  Deja de adivinar.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-500">Empieza a validar.</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Descubre qué nichos están explotando antes de grabar un solo segundo. Analizamos velocidad, tracción y competencia.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button variant="hero" size="xl" className="rounded-full px-12 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => setView("viral")}>Explorar Nichos Ahora</Button>
                  <Button variant="ghost" size="xl" className="rounded-full h-14 text-lg hover:bg-surface border border-transparent hover:border-border" onClick={handleAiViral} disabled={aiLoading}>{aiLoading ? "Pensando..." : "Pedir idea a la IA"}</Button>
                </div>
              </div>
              <div className="relative w-full max-w-4xl mx-auto perspective-1000">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />
                <div className="grid md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-card/50 backdrop-blur border border-border/50 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-card/80 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400"><Search className="w-6 h-6" /></div>
                        <h3 className="font-bold text-foreground mb-2">Rastreo Profundo</h3>
                        <p className="text-sm text-muted-foreground">Filtramos millones de videos para encontrar canales pequeños con hits recientes.</p>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-3xl shadow-2xl scale-110 relative overflow-hidden group cursor-default">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1"><div className="h-2 w-24 bg-foreground/20 rounded mb-2" /><div className="h-4 w-32 bg-foreground rounded" /></div>
                            <div className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase rounded">Nicho de Oro</div>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 p-3 bg-background/40 rounded-xl"><p className="text-[10px] text-muted-foreground uppercase">Velocidad</p><p className="text-xl font-bold text-foreground">1.2k/h</p></div>
                            <div className="flex-1 p-3 bg-background/40 rounded-xl"><p className="text-[10px] text-muted-foreground uppercase">Ratio</p><p className="text-xl font-bold text-primary">15x</p></div>
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden"><div className="h-full w-[85%] bg-primary" /></div>
                        <p className="text-xs text-center mt-3 text-muted-foreground">Ejemplo de análisis</p>
                    </div>
                    <div className="bg-card/50 backdrop-blur border border-border/50 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-card/80 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400"><Award className="w-6 h-6" /></div>
                        <h3 className="font-bold text-foreground mb-2">Insights IA</h3>
                        <p className="text-sm text-muted-foreground">No solo datos. Recibe un veredicto claro y scripts generados al instante.</p>
                    </div>
                </div>
              </div>
            </section>
          )}

          {view === "videos" && (
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-8">
              <ViralSearchHeader query={query} onChangeQuery={setQuery} onSearch={handleSearch} filters={filters} onOpenFilters={() => setShowFilters(true)} />
              {!loading && liveResults.length > 0 && (
                <>
                  <ViralSortControl value={sortBy} onChange={setSortBy} />
                  <NicheInsightsBar items={liveResults} onKeywordClick={handleTagClick} />
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[360px] rounded-[20px] border border-border bg-card/40 animate-pulse" />)}
                {!loading && sortedLiveResults.map((v) => <ViralVideoCard key={v.id} video={v} onOpen={setSelected} saved={isSaved(v.id)} onToggleSave={toggleSaved} onTagClick={handleTagClick} />)}
              </div>
            </section>
          )}

          {(view === "viral" || view === "saved" || view === "tools") && (
            <section className="max-w-6xl mx-auto px-6 md:px-10 py-16">
              {view === "viral" ? (
                <div className="space-y-8">
                  <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
                    <div className="space-y-6">
                      <div><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Explorador Viral</h2><p className="text-muted-foreground mt-2 max-w-2xl">“Sorpréndeme” detecta oportunidades en canales pequeños.</p></div>
                      <div className="flex gap-2 w-full">
                        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" /><Input placeholder="Busca un nicho..." className="pl-10 h-14 text-lg rounded-2xl bg-surface/50 border-border" value={viralInput} onChange={(e) => setViralInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runViralSearch()} /></div>
                        <Button className="h-14 rounded-2xl px-6 font-bold" onClick={() => runViralSearch()} disabled={viralLoading}>{viralLoading ? "..." : "Explorar"}</Button>
                        <Button variant="glowOutline" className="h-14 rounded-2xl px-6" onClick={() => setShowViralFilters(true)}>Filtros</Button>
                      </div>
                      {aiCriteria && (<div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Criterio IA</p><p className="mt-1 text-sm"><span className="font-extrabold">Topic:</span> {viralTopic}</p><p className="mt-2 text-sm text-muted-foreground">{aiCriteria}</p></div>)}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-wrap gap-2">{VIRAL_TOPICS.slice(0, 10).map((t) => (<button key={t} onClick={() => { setViralTopic(t); setViralInput(t); runViralSearch(t); }} className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${t === viralTopic ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface text-muted-foreground'}`}>{t}</button>))}</div>
                        <Button variant="hero" className="rounded-xl shrink-0" onClick={() => { const next = VIRAL_TOPICS[Math.floor(Math.random() * VIRAL_TOPICS.length)]; setViralTopic(next); setViralInput(next); runViralSearch(next); }}>Sorpréndeme</Button>
                      </div>
                    </div>
                  </div>
                  {!viralLoading && viralResults.length > 0 && (
                    <>
                      <ViralSortControl value={viralSortBy} onChange={setViralSortBy} />
                      <NicheInsightsBar items={viralResults} onKeywordClick={handleTagClick} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {sortedViralResults.map((v) => <ViralVideoCard key={v.id} video={v} onOpen={setSelected} saved={isSaved(v.id)} onToggleSave={toggleSaved} onTagClick={handleTagClick} />)}
                      </div>
                    </>
                  )}
                </div>
              ) : view === "saved" ? (
                <ViralSavedView saved={saved} onOpen={setSelected} onToggleSave={toggleSaved} onGoSearch={() => setView("videos")} onClear={clearSaved} onTagClick={handleTagClick} />
              ) : (
                <ViralToolsView onOpenApiKey={() => setShowSettings(true)} onOpenSearchFilters={() => setShowFilters(true)} onOpenExplorerFilters={() => setShowViralFilters(true)} onGoSearch={() => setView("videos")} onExportSaved={() => {}} savedCount={saved.length} />
              )}
            </section>
          )}
        </main>

        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* LADO IZQUIERDO: VIDEO */}
                <div className="w-full md:w-3/5 bg-zinc-950 p-6 flex flex-col justify-center relative">
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                         {(() => {
                            const rawId = selected.youtubeVideoId || selected.id;
                            let cleanId = rawId;
                            if (typeof rawId === 'string') {
                                if (rawId.includes('v=')) cleanId = rawId.split('v=')[1]?.split('&')[0];
                                else if (rawId.includes('/shorts/')) cleanId = rawId.split('/shorts/')[1]?.split('?')[0];
                            }
                            if (!cleanId || typeof cleanId !== 'string' || cleanId.length < 5) {
                                return (<div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col"><AlertCircle className="w-8 h-8 opacity-50 mb-2" /><p>Video no disponible</p></div>);
                            }
                            return (<iframe src={`https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0`} title={selected.title} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />);
                         })()}
                    </div>
                    <div className="mt-4 space-y-2">
                        <h3 className="font-bold text-lg leading-tight text-white line-clamp-2">{selected.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">{selected.channelTitle}</span><span>•</span><span>{formatNumber(selected.views)} vistas</span></div>
                    </div>
                </div>

                {/* LADO DERECHO: CONTENIDO DINÁMICO (STATS o GUION) */}
                <div className="w-full md:w-2/5 border-l border-border bg-surface p-6 overflow-y-auto">
                    
                    {generatedScript ? (
                      // --- VISTA DE GUION GENERADO ---
                      <div className="space-y-5 animate-in slide-in-from-right duration-300">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> Viral Kit</h3>
                            <Button variant="ghost" size="sm" onClick={() => setGeneratedScript(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
                         </div>

                         <div className="space-y-4">
                            <div className="bg-card p-4 rounded-xl border border-border">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Título Ganador</p>
                              <p className="font-bold text-primary text-lg">{generatedScript.titleSuggestion}</p>
                            </div>

                            <div className="bg-card p-4 rounded-xl border border-border">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Guion (60s)</p>
                              <div className="space-y-3 text-sm">
                                <p><span className="font-bold text-white">🔥 Hook (0-3s):</span> {generatedScript.hook}</p>
                                <p><span className="font-bold text-white">📝 Cuerpo:</span> {generatedScript.script}</p>
                                <p><span className="font-bold text-white">📣 CTA:</span> {generatedScript.cta}</p>
                              </div>
                            </div>

                            <div className="bg-card p-3 rounded-xl border border-border">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Hashtags</p>
                              <p className="text-xs text-muted-foreground">{generatedScript.hashtags.join(" ")}</p>
                            </div>
                         </div>

                         <Button id="copy-btn" onClick={() => copyToClipboard(`${generatedScript.titleSuggestion}\n\n${generatedScript.script}`)} className="w-full rounded-xl font-bold">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Guion
                         </Button>
                      </div>
                    ) : (
                      // --- VISTA DE ESTADÍSTICAS ---
                      (() => {
                          const s = getSignals(selected);
                          return (
                              <div className="space-y-6 animate-in fade-in">
                                  <div className={`rounded-2xl border p-4 text-center ${s.verdictBg}`}>
                                      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Análisis de Viralidad</p>
                                      <p className={`text-2xl font-black ${s.verdictColor}`}>{s.verdict}</p>
                                      <div className="flex justify-center gap-2 mt-3">
                                          {s.badges.map((b, i) => (<div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${b.color}`}>{b.icon} {b.text}</div>))}
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div className="p-3 bg-card rounded-xl border border-border">
                                          <div className="flex items-center gap-2 mb-1 text-muted-foreground"><Flame className="w-4 h-4" /><span className="text-xs font-bold uppercase">Velocidad</span></div>
                                          <p className="text-2xl font-black text-foreground">{formatNumber(s.viewsPerHour)}</p><p className="text-[10px] text-muted-foreground">vistas / hora</p>
                                      </div>
                                      <div className="p-3 bg-card rounded-xl border border-border">
                                          <div className="flex items-center gap-2 mb-1 text-muted-foreground"><TrendingUp className="w-4 h-4" /><span className="text-xs font-bold uppercase">Multiplicador</span></div>
                                          <p className={`text-2xl font-black ${s.ratio > 5 ? 'text-primary' : 'text-foreground'}`}>{s.ratio.toFixed(1)}x</p><p className="text-[10px] text-muted-foreground">vs. suscriptores</p>
                                      </div>
                                  </div>
                                  <div className="space-y-3">
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl"><span className="text-muted-foreground">Antigüedad</span><span className="font-bold text-foreground">{s.ageLabel}</span></div>
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl"><span className="text-muted-foreground">Suscriptores</span><span className="font-bold text-foreground">{formatNumber(selected.channelSubscribers)}</span></div>
                                  </div>
                                  <div className="pt-4 border-t border-border">
                                      <Button 
                                        className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" 
                                        variant="hero"
                                        onClick={handleGenerateScript}
                                        disabled={scriptLoading}
                                      >
                                          {scriptLoading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> Creando Magia...</> : "Generar Kit Viral (IA) ✨"}
                                      </Button>
                                      <Button variant="ghost" className="w-full mt-2 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>Cerrar informe</Button>
                                  </div>
                              </div>
                          );
                      })()
                    )}
                </div>

            </div>
          </div>
        )}
      </div>

      <ViralFiltersDialog open={showFilters} onOpenChange={setShowFilters} value={filters} onChange={setFilters} onApply={() => { setShowFilters(false); if (view === "videos") handleSearch(); }} />
      <ViralFiltersDialog open={showViralFilters} onOpenChange={setShowViralFilters} value={viralFilters} onChange={setViralFilters} onApply={() => { setShowViralFilters(false); runViralSearch(viralTopic); }} />
      <ViralSettingsDialog open={showSettings} onOpenChange={setShowSettings} isDark={isDark} onToggleTheme={toggleTheme} />
    </div>
  );
}
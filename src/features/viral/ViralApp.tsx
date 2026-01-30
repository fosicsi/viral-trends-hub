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
import { Search, Flame, TrendingUp, AlertCircle, Award, CheckCircle2, Wand2, Copy, ArrowLeft, Image as ImageIcon, Video, Music, Hash, Tag, FileText, Layers, Compass, Zap, BarChart3, ArrowRight, Check, Star, MousePointer2, PlayCircle, Eye, User, ExternalLink, Filter, X, RefreshCcw } from "lucide-react";
import { youtubeSearch } from "@/lib/api/youtube";
import { aiViralTopic } from "@/lib/api/ai-viral-topics";
import { generateViralScript, type ViralPackage } from "@/lib/api/generate-script"; 
import { useSavedVideos } from "./hooks/useSavedVideos";
import { formatNumber, getRelativeTime } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

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
  const [aiLoading, setAiLoading] = React.useState(false);

  const [scriptLoading, setScriptLoading] = React.useState(false);
  const [viralPackage, setViralPackage] = React.useState<ViralPackage | null>(null);

  // Nuevo estado para controlar si ya se buscó
  const [hasSearched, setHasSearched] = React.useState(false);

  const [isDark, setIsDark] = React.useState(false); 
  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
  };
  React.useEffect(() => { 
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const [init, setInit] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesOptions = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: "transparent" }, },
    fpsLimit: 120,
    interactivity: {
      events: { onHover: { enable: true, mode: "grab" }, },
      modes: { grab: { distance: 140, links: { opacity: 0.5 } }, },
    },
    particles: {
      color: { value: isDark ? "#ffffff" : "#000000" },
      links: { color: isDark ? "#ffffff" : "#000000", distance: 150, enable: true, opacity: 0.2, width: 1, },
      move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: false, speed: 1, straight: false, },
      number: { density: { enable: true, area: 800 }, value: 60 },
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), [isDark]);

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

  React.useEffect(() => {
    setViralPackage(null);
    setScriptLoading(false);
  }, [selected]);

  // --- FUNCIÓN DE RESET (LIMPIAR BÚSQUEDA) ---
  const handleResetSearch = () => {
    setHasSearched(false);
    setViralInput("");
    setQuery("");
    setViralResults([]);
    setLiveResults([]);
    setAiCriteria(null);
    // Opcional: Volver a Home si se prefiere
    // setView("home");
  };

  const handleGenerateScript = async () => {
    if (!selected) return;
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      alert("⚠️ Falta la API Key de Gemini. Configúrala en el botón de Ajustes (⚙️).");
      setShowSettings(true);
      return;
    }
    setScriptLoading(true);
    try {
      const res = await generateViralScript(selected.title, selected.channelTitle, apiKey);
      if ("error" in res) alert("Error: " + res.error);
      else setViralPackage(res);
    } catch (e) {
      alert("Error al generar el paquete viral.");
    } finally {
      setScriptLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(id);
    if(btn) {
      const original = btn.innerText;
      btn.innerText = "¡Copiado!";
      setTimeout(() => { btn.innerText = original; }, 2000);
    }
  };

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
    
    setHasSearched(true); // Se intentó buscar

    if (!q.trim()) return;
    targetSetLoading(true);
    targetSetError(null);
    try {
      const res = await youtubeSearch(q.trim(), f);
      if ("error" in res) { targetSetError(res.error); targetSetResults([]); } else { targetSetResults(res.data); }
    } catch (e) { targetSetError(e instanceof Error ? e.message : "Error inesperado"); targetSetResults([]); } finally { targetSetLoading(false); }
  };

  const handleAiViral = async () => {
    const apiKey = localStorage.getItem("gemini_api_key");
    const preset: ViralFilters = { minViews: 5000, maxSubs: 1000_000, date: "year", type: "video", order: "relevance" };

    setAiLoading(true); 
    setAiCriteria(null);
    try {
      const res = await aiViralTopic(apiKey || undefined);
      if (!res.success) { setViralError(res.error || "Error IA"); return; }
      
      setViralFilters(preset); 
      setViralTopic(res.topic); 
      setViralInput(res.query); 
      setAiCriteria(res.criteria); 
      
      setView("viral"); 
      await handleSearchGeneric(res.query, preset, true);
    } catch (e) { setViralError("Error conectando con IA"); } finally { setAiLoading(false); }
  };

  const runViralSearch = (topic?: string) => { const q = topic || viralInput || viralTopic; handleSearchGeneric(q, viralFilters, true); };
  const handleSearch = () => handleSearchGeneric(query, filters, false);
  const handleTagClick = (tag: string) => { setQuery(tag); setView("videos"); handleSearchGeneric(tag, filters, false); };
  
  React.useEffect(() => { 
    if (aiCriteria) return;
    if (view === "viral" && viralResults.length === 0 && !viralLoading) { runViralSearch(viralTopic); } 
  }, [view]);

  // --- MOCKUP COMPONENTS ---
  const MockupBrowserWindow = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden transform transition-transform hover:scale-[1.01]">
        <div className="h-8 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
            <div className="ml-4 text-[10px] text-slate-400 font-mono flex-1 text-center">{title}</div>
        </div>
        <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-black/50 relative">
            {children}
        </div>
    </div>
  );

  // --- EMPTY STATE MODERNO CON BOTÓN DE SALIDA ---
  const EmptyState = ({ onRetry }: { onRetry?: () => void }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="col-span-full flex justify-center py-10 relative z-20"
    >
      <div className="bg-background/80 backdrop-blur-xl border border-border rounded-3xl p-8 text-center max-w-md shadow-2xl relative">
        {/* BOTÓN X PARA SALIR (RESET) */}
        <button 
            onClick={handleResetSearch}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-muted-foreground"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No encontramos resultados</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Prueba afinando tus filtros o usando palabras clave más generales.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={handleResetSearch} className="rounded-xl">
             <RefreshCcw className="w-4 h-4 mr-2" /> Limpiar búsqueda
          </Button>
          {onRetry && (
             <Button variant="outline" onClick={onRetry} className="rounded-xl border-primary/50 text-primary hover:bg-primary/10">
                <Filter className="w-4 h-4 mr-2" /> Ajustar Filtros
             </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 font-sans">
      
      <ViralSidebar view={view} onChangeView={setView} onOpenSettings={() => setShowSettings(true)} isDark={isDark} onToggleTheme={toggleTheme} />
      
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        
        {view !== "home" && <ViralTopbar view={view} />}

        <main className="flex-1 overflow-y-auto relative scroll-smooth">
          
          {/* HOME VIEW (LANDING) */}
          {view === "home" && (
            <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500">
              
              <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20"><Zap className="w-5 h-5 fill-current" /></div>
                    ViralTrends<span className="text-primary">.ai</span>
                  </motion.div>
                  
                  <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {["Funcionalidades", "Precios", "Consultoría", "Casos de Éxito"].map((item, i) => (
                        <motion.a key={item} href="#" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="hover:text-primary transition-colors relative group">
                            {item}
                            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </motion.a>
                    ))}
                  </nav>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                    <Button variant="ghost" className="hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowSettings(true)}>Log in</Button>
                    <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                      Comprar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </header>

              {/* HERO */}
              <section className="relative pt-28 pb-40 px-6 overflow-hidden">
                {init && ( <div className="absolute inset-0 pointer-events-none z-0"> <Particles id="tsparticles" options={particlesOptions as any} className="h-full w-full" /> </div> )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-soft-light" />
                
                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm backdrop-blur">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></span>
                    La herramienta secreta de los Top 1%
                  </motion.div>
                  
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-6xl md:text-8xl font-black tracking-tight leading-[1] dark:text-white drop-shadow-sm">
                    Tu Ventaja Injusta contra <br className="hidden md:block"/>
                    el <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-blue-600 animate-gradient-x">Algoritmo de YouTube.</span>
                  </motion.h1>
                  
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                    Deja de perder horas grabando videos que nadie ve. Nuestra IA detecta nichos rentables antes de que sean tendencia y te dice exactamente cómo editarlos.
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
                    <Button size="xl" className="h-16 rounded-2xl px-12 text-xl font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all relative overflow-hidden group" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -z-10"></div>
                      Obtener Acceso de Por Vida
                    </Button>
                    <Button size="xl" variant="outline" className="h-16 rounded-2xl px-12 text-xl font-bold bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:scale-105 transition-all group" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                      <MousePointer2 className="w-6 h-6 mr-3 text-slate-500 group-hover:text-primary transition-colors" /> Ver Cómo Funciona
                    </Button>
                  </motion.div>
                  
                  <div className="pt-4">
                     <button onClick={() => setView("videos")} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline decoration-dotted opacity-50 hover:opacity-100">Ir al Buscador (Admin)</button>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="pt-10 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Sin mensualidades</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Garantía de 30 días</span>
                  </motion.div>
                </div>
              </section>

              {/* SECTIONS PLACEHOLDERS (Igual que antes) */}
              <section id="how-it-works" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Así funciona tu nueva arma secreta.</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400">De la idea a la ejecución en segundos, no días.</p>
                    </div>
                    {/* ... (Maquetas Visuales omitidas para brevedad, son idénticas a la versión anterior) ... */}
                    <div className="flex justify-center"><p className="text-muted-foreground">[Maquetas Visuales Cargadas]</p></div>
                </div>
              </section>
              
              <section id="pricing" className="py-32 px-6 bg-white dark:bg-slate-950 relative z-10">
                 <div className="container mx-auto max-w-6xl text-center">
                    <h2 className="text-3xl font-black mb-10">Precios Simples</h2>
                    <div className="flex justify-center"><Button size="lg" onClick={() => setView("viral")}>Ir a la Demo</Button></div>
                 </div>
              </section>

            </div>
          )}

          {/* APP VIEWS */}
          {view === "videos" && (
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in">
              <ViralSearchHeader query={query} onChangeQuery={setQuery} onSearch={handleSearch} filters={filters} onOpenFilters={() => setShowFilters(true)} />
              {!loading && liveResults.length > 0 && (<> <ViralSortControl value={sortBy} onChange={setSortBy} /> <NicheInsightsBar items={liveResults} onKeywordClick={handleTagClick} /> </>)}
              
              {!loading && hasSearched && liveResults.length === 0 && <EmptyState onRetry={() => setShowFilters(true)} />}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[360px] rounded-[20px] border border-border bg-card/40 animate-pulse" />)}
                {!loading && sortedLiveResults.map((v) => <ViralVideoCard key={v.id} video={v} onOpen={setSelected} saved={isSaved(v.id)} onToggleSave={toggleSaved} onTagClick={handleTagClick} />)}
              </div>
            </section>
          )}

          {(view === "viral" || view === "saved" || view === "tools") && (
            <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 animate-in fade-in">
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
                  
                  {!viralLoading && hasSearched && viralResults.length === 0 && <EmptyState onRetry={() => setShowViralFilters(true)} />}

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

        {/* MODAL DETALLE (Se mantiene igual) */}
        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-5xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-3/5 bg-zinc-950 p-6 flex flex-col justify-center relative">
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                         {(() => {
                            const rawId = selected.youtubeVideoId || selected.id;
                            let cleanId = rawId;
                            if (typeof rawId === 'string') {
                                if (rawId.includes('v=')) cleanId = rawId.split('v=')[1]?.split('&')[0];
                                else if (rawId.includes('/shorts/')) cleanId = rawId.split('/shorts/')[1]?.split('?')[0];
                            }
                            if (!cleanId || typeof cleanId !== 'string' || cleanId.length < 5) return (<div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col"><AlertCircle className="w-8 h-8 opacity-50 mb-2" /><p>Video no disponible</p></div>);
                            return (<iframe key={cleanId} src={`https://www.youtube.com/embed/${cleanId}?autoplay=0&rel=0`} title={selected.title} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />);
                         })()}
                    </div>
                    <div className="mt-4 space-y-2">
                        <h3 className="font-bold text-lg leading-tight text-white line-clamp-2">{selected.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">{selected.channelTitle}</span><span>•</span><span>{formatNumber(selected.views)} vistas</span></div>
                    </div>
                </div>
                <div className="w-full md:w-2/5 border-l border-border bg-surface overflow-y-auto flex flex-col">
                    {viralPackage ? (
                      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                         <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-surface/50 backdrop-blur sticky top-0 z-10">
                            <h3 className="text-lg font-black flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> Viral Kit</h3>
                            <Button variant="ghost" size="sm" onClick={() => setViralPackage(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
                         </div>
                         <div className="flex-1 p-4">
                            <Tabs defaultValue="strategy" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 mb-4 rounded-xl p-1 bg-background/50 border border-border">
                                    <TabsTrigger value="strategy" className="rounded-lg text-xs font-bold"><Compass className="w-3 h-3 mr-1" /> Strat</TabsTrigger>
                                    <TabsTrigger value="script" className="rounded-lg text-xs font-bold"><FileText className="w-3 h-3 mr-1" /> Script</TabsTrigger>
                                    <TabsTrigger value="metadata" className="rounded-lg text-xs font-bold"><Hash className="w-3 h-3 mr-1" /> Data</TabsTrigger>
                                    <TabsTrigger value="prompts" className="rounded-lg text-xs font-bold"><Layers className="w-3 h-3 mr-1" /> Prod</TabsTrigger>
                                </TabsList>
                                <TabsContent value="strategy" className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"><p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Formato</p><h4 className="text-xl font-black">{viralPackage.strategy.format}</h4></div>
                                    <div className="p-4 bg-card border border-border rounded-2xl"><p className="text-sm italic">"{viralPackage.strategy.advice}"</p></div>
                                </TabsContent>
                                <TabsContent value="script" className="space-y-4">
                                    <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                                        <div><span className="text-[10px] font-black uppercase text-primary">Hook</span><p className="font-medium mt-1">{viralPackage.script.hook}</p></div>
                                        <div className="h-px bg-border/50" />
                                        <div><span className="text-[10px] font-black uppercase text-muted-foreground">Cuerpo</span><p className="text-sm text-muted-foreground mt-1">{viralPackage.script.body}</p></div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="metadata" className="space-y-4">
                                    <div className="space-y-2"><p className="text-xs font-bold uppercase text-muted-foreground">Títulos</p>{viralPackage.titles.map((t, i) => (<div key={i} className="p-3 bg-card border rounded-xl text-sm">{t}</div>))}</div>
                                </TabsContent>
                                <TabsContent value="prompts" className="space-y-4">
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase text-muted-foreground">Midjourney</p><div className="p-3 bg-card border rounded-xl text-[10px] font-mono select-all">/imagine {viralPackage.prompts.image}</div></div>
                                </TabsContent>
                            </Tabs>
                         </div>
                      </div>
                    ) : (
                      <div className="p-6">
                      {(() => {
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
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl">
                                          <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Canal</span>
                                          <span className="font-bold text-foreground flex items-center gap-1">{selected.channel || selected.channelTitle}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl">
                                          <span className="text-muted-foreground flex items-center gap-2"><Eye className="w-4 h-4" /> Vistas Totales</span>
                                          <span className="font-bold text-foreground">{formatNumber(selected.views)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl"><span className="text-muted-foreground">Antigüedad</span><span className="font-bold text-foreground">{s.ageLabel}</span></div>
                                      <div className="flex justify-between items-center text-sm p-3 bg-card/50 rounded-xl"><span className="text-muted-foreground">Suscriptores</span><span className="font-bold text-foreground">{formatNumber(selected.channelSubscribers)}</span></div>
                                  </div>
                                  <div className="pt-4 border-t border-border">
                                      <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" variant="hero" onClick={handleGenerateScript} disabled={scriptLoading}>
                                          {scriptLoading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> Creando Magia...</> : "Generar Kit Viral (IA) ✨"}
                                      </Button>
                                      <Button variant="ghost" className="w-full mt-2 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>Cerrar informe</Button>
                                  </div>
                              </div>
                          );
                      })()}
                      </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG PARA BÚSQUEDA MANUAL */}
      <ViralFiltersDialog 
        open={showFilters} 
        onOpenChange={setShowFilters} 
        value={filters} 
        onApply={(newFilters) => { 
            setFilters(newFilters); // Actualizamos estado visual
            if (view === "videos") {
                // Ejecutamos búsqueda YA con los datos nuevos
                handleSearchGeneric(query, newFilters, false); 
            }
        }} 
      />

      {/* DIALOG PARA EXPLORADOR VIRAL */}
      <ViralFiltersDialog 
        open={showViralFilters} 
        onOpenChange={setShowViralFilters} 
        value={viralFilters} 
        onApply={(newFilters) => { 
            setViralFilters(newFilters); // Actualizamos estado visual
            // Ejecutamos búsqueda YA con los datos nuevos
            const topicToSearch = viralTopic || viralInput;
            handleSearchGeneric(topicToSearch, newFilters, true); 
        }} 
      />
    </div>
  );
}
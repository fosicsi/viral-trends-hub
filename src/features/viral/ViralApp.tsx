import * as React from "react";
import { ViralSidebar, type ViralView } from "./components/ViralSidebar";
import { ViralTopbar } from "./components/ViralTopbar";
import { ViralSearchHeader } from "./components/ViralSearchHeader";
import { ViralVideoCard } from "./components/ViralVideoCard";
import { NicheInsightsBar } from "./components/NicheInsightsBar";
import { ViralFiltersDialog } from "./components/ViralFiltersDialog";
import { ViralSavedView } from "./components/ViralSavedView";
import { ViralToolsView } from "./components/ViralToolsView";
import { ViralSortControl, type SortOption } from "./components/ViralSortControl";
import { ViralGlossaryView } from "./components/ViralGlossaryView";
import type { ViralFilters, VideoItem } from "./types";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MorningDashboard } from "./MorningDashboard"; // Import new Dashboard
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Flame, TrendingUp, AlertCircle, Award, CheckCircle2, Wand2, Copy, ArrowLeft, Image as ImageIcon, Video, Music, Hash, Tag, FileText, Layers, Compass, Zap, BarChart3, ArrowRight, Check, Star, MousePointer2, PlayCircle, Eye, User, ExternalLink, Filter, X, RefreshCcw, Smartphone, Instagram, Youtube } from "lucide-react";
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
  "criptomonedas", "marketing digital",
];

export default function ViralApp() {
  const navigate = useNavigate();
  const [session, setSession] = React.useState<any>(null);
  const [view, setView] = React.useState<ViralView | "search">("home"); // Allow "search" view
  const [query, setQuery] = React.useState<string>("");
  const [selected, setSelected] = React.useState<VideoItem | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && view === "home") setView("viral");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && view === "home") setView("viral");
    });

    return () => subscription.unsubscribe();
  }, [view]);

  const [showFilters, setShowFilters] = React.useState(false);
  const [liveResults, setLiveResults] = React.useState<VideoItem[]>([]);
  const [sortBy, setSortBy] = React.useState<SortOption>("views");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [hasVideoSearched, setHasVideoSearched] = React.useState(false);
  const [hasViralSearched, setHasViralSearched] = React.useState(false);

  const [scriptLoading, setScriptLoading] = React.useState(false);
  const [viralPackage, setViralPackage] = React.useState<ViralPackage | null>(null);

  // --- TYPEWRITER STATE ---
  const [typewriterText, setTypewriterText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const typewriterWords = useMemo(() => [
    "Recetas para Shorts...",
    "Trucos de Excel para TikTok...",
    "Estoicismo para Reels...",
    "Fitness para YouTube...",
    "Curiosidades para TikTok...",
    "Finanzas para Reels..."
  ], []);

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % typewriterWords.length;
      const fullText = typewriterWords[i];

      setTypewriterText(isDeleting ? fullText.substring(0, typewriterText.length - 1) : fullText.substring(0, typewriterText.length + 1));

      if (!isDeleting && typewriterText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
        setTypingSpeed(50);
      } else if (isDeleting && typewriterText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(100);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, loopNum, typingSpeed, typewriterWords]);


  // --- LÓGICA DE TEMA ---
  const [isDark, setIsDark] = React.useState(false);
  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
  };
  React.useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView("home");
    navigate("/");
  };

  // --- PARTICLES (ESTABILIZADO: INTERACTIVIDAD OFF) ---
  const [init, setInit] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine) => { await loadSlim(engine); }).then(() => { setInit(true); });
  }, []);

  const particlesOptions = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: "transparent" }, },
    fpsLimit: 60, // Limitado a 60 para estabilidad
    // INTERACTIVIDAD DESACTIVADA PARA EVITAR EL "JITTER" AL HACER HOVER
    interactivity: {
      events: { onHover: { enable: false }, onClick: { enable: false } },
    },
    particles: {
      color: { value: isDark ? "#ffffff" : "#000000" },
      links: { color: isDark ? "#ffffff" : "#000000", distance: 150, enable: true, opacity: 0.15, width: 1, },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: true,
        speed: 0.5, // Movimiento más lento y elegante
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 50 }, // Menos partículas = más rendimiento
      opacity: { value: 0.3 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2 } },
    },
    detectRetina: true,
  }), [isDark]);

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

  React.useEffect(() => {
    setViralPackage(null);
    setScriptLoading(false);
  }, [selected]);

  const handleResetSearch = () => {
    setHasVideoSearched(false);
    setHasViralSearched(false);
    setViralInput("");
    setQuery("");
    setViralResults([]);
    setLiveResults([]);
    setAiCriteria(null);
  };

  const handleGenerateScript = async () => {
    if (!selected) return;

    setScriptLoading(true);
    try {
      const res = await generateViralScript(selected.title, selected.channelTitle);
      if ("error" in res) {
        if (res.error?.includes("401") || res.error?.includes("account")) {
          alert("⚠️ Conecta tu cuenta de Google en Integraciones para usar esta función.");
          navigate("/integrations");
        } else {
          alert("Error: " + res.error);
        }
      } else {
        setViralPackage(res);
      }
    } catch (e) {
      alert("Error al generar el paquete viral.");
    } finally {
      setScriptLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(id);
    if (btn) {
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
    if (v.growthRatio > 10) {
      badges.push({ icon: <AlertCircle className="w-3 h-3" />, text: "OUTLIER", color: "text-red-400 bg-red-400/10" });
      verdict = "🚨 OUTLIER TOTAL";
      verdictColor = "text-red-500";
      verdictBg = "bg-red-500/10 border-red-500/50";
    }
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
    // Set the specific search state
    if (isViral) {
      setHasViralSearched(true);
    } else {
      setHasVideoSearched(true);
    }

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

  const runViralSearch = (topic?: string, overrideFilters?: ViralFilters) => {
    const q = topic || viralInput || viralTopic;
    handleSearchGeneric(q, overrideFilters || viralFilters, true);
  };

  const handleSearch = async () => {
    handleSearchGeneric(query, filters, false);
  };

  const handleTagClick = (tag: string) => { setQuery(tag); setView("videos"); handleSearchGeneric(tag, filters, false); };

  const handleOutlierSearch = () => {
    const aggressiveFilters: ViralFilters = {
      minViews: 1000,
      maxSubs: 20000, // Relaxed from 10k to find more candidates
      minRatio: 3, // Relaxed from 10x to ensure results, then sort by ratio
      date: "month",
      type: "short",
      order: "relevance"
    };
    setViralFilters(aggressiveFilters);
    const q = viralInput || "curiosidades";
    setViralInput(q);
    setViralTopic(q);
    // setView("viral"); // This might cause a loop if not careful, but let's see. logic was: setView("viral")
    setView("viral");
    handleSearchGeneric(q, aggressiveFilters, true);
    // toast.success("Modo Outlier Activado"); // toast needs import or use generic alert for now?
    // Using alert for now as I don't see 'sonner' or 'toast' in imports.
    // Actually, I saw 'alert' being used in handleGenerateScript.
    // But a toast is better. Let's see if we can import toast.
    // I'll stick to no toast for now to avoid import errors, or check imports.
  };

  React.useEffect(() => {
    if (aiCriteria) return;
    if (view === "viral" && viralResults.length === 0 && !viralLoading) { runViralSearch(viralTopic); }
  }, [view]);

  // --- COMPONENTES AUXILIARES ---

  // MOCKUP BROWSER: Eliminado hover:scale para evitar saltos
  const MockupBrowserWindow = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
      <div className="h-8 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
        <div className="ml-4 text-[10px] text-slate-400 font-mono flex-1 text-center">{title}</div>
      </div>
      <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-black/50 relative">{children}</div>
    </div>
  );

  const FloatingData = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      animate={{ y: [0, -10, 0] }}
      transition={{
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 0.5, delay: 0.5 + delay }
      }}
      className={`absolute z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );

  const EmptyState = ({ onRetry }: { onRetry?: () => void }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full flex justify-center py-10 relative z-20">
      <div className="bg-background/80 backdrop-blur-xl border border-border rounded-3xl p-8 text-center max-w-md shadow-2xl relative">
        <button onClick={handleResetSearch} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-muted-foreground"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No encontramos resultados</h3>
        <p className="text-muted-foreground mb-6 text-sm">Prueba afinando tus filtros o usando palabras clave más generales.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={handleResetSearch} className="rounded-xl"><RefreshCcw className="w-4 h-4 mr-2" /> Limpiar búsqueda</Button>
          {onRetry && (<Button variant="outline" onClick={onRetry} className="rounded-xl border-primary/50 text-primary hover:bg-primary/10"><Filter className="w-4 h-4 mr-2" /> Ajustar Filtros</Button>)}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 font-sans">
      {view !== "home" && (
        <ViralSidebar
          view={view}
          onChangeView={setView}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          user={session?.user}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {view !== "home" && <ViralTopbar view={view} />}

        <main className="flex-1 overflow-y-auto relative scroll-smooth">

          {view === "home" && (
            <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500">

              {/* NAVBAR */}
              <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20"><Zap className="w-5 h-5 fill-current" /></div>
                    ViralTrends<span className="text-primary">.ai</span>
                  </motion.div>
                  <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {[
                      { label: "Funcionalidades", href: "#features" },
                      { label: "Precios", href: "#pricing" },
                      { label: "Consultoría", href: "#consultancy" },
                      { label: "Casos de Éxito", href: "#success-stories" }
                    ].map((item, i) => (
                      <motion.a key={item.label} href={item.href} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="hover:text-primary transition-colors relative group">{item.label}<span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span></motion.a>
                    ))}
                  </nav>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                    <Button variant="ghost" className="hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800 font-bold tracking-wider" onClick={() => navigate("/auth")}>LOGIN</Button>
                    <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 tracking-wider" onClick={() => navigate("/auth")}>REGISTRARSE <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </motion.div>
                </div>
              </header>

              {/* HERO SECTION DE VENTAS CON TYPEWRITER */}
              <section className="relative pt-28 pb-40 px-6 overflow-hidden">
                {init && (<div className="absolute inset-0 pointer-events-none z-0"> <Particles id="tsparticles" options={particlesOptions as any} className="h-full w-full" /> </div>)}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-soft-light" />

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm backdrop-blur">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></span>
                    La herramienta secreta de los Top 1%
                  </motion.div>

                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-6xl md:text-8xl font-black tracking-tight leading-[1] dark:text-white drop-shadow-sm">
                    Tu Ventaja Injusta contra <br className="hidden md:block" />
                    el <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-blue-600 animate-gradient-x">Algoritmo de YouTube.</span>
                  </motion.h1>

                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                    Deja de perder horas grabando. Nuestra IA detecta nichos rentables en <strong>YouTube</strong> que funcionan perfectamente para <strong>TikTok</strong> y <strong>Reels</strong>.
                  </motion.p>



                  {/* QUICK START CARDS (Inspirado en Webflow/Notion) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4"
                  >
                    {[
                      { icon: <Zap className="w-5 h-5" />, title: "Inspiración IA", desc: "Nichos detectados por nuestra IA.", color: "text-amber-500 bg-amber-500/10", border: "border-amber-500/20", action: handleAiViral },
                      { icon: <Flame className="w-5 h-5" />, title: "Detector de Oportunidades", desc: "Videos con 3x más vistas que subs (Outliers).", color: "text-red-500 bg-red-500/10", border: "border-red-500/20", action: handleOutlierSearch },
                      { icon: <Wand2 className="w-5 h-5" />, title: "Kit Viral", desc: "Guiones y prompts listos para usar.", color: "text-purple-500 bg-purple-500/10", border: "border-purple-500/20", action: () => setView("saved") },
                    ].map((card, i) => (
                      <div key={i} onClick={card.action} className={`p-4 rounded-2xl border ${card.border} bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col items-center text-center group cursor-pointer hover:scale-105 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-xl`}>
                        <div className={`p-2 rounded-xl ${card.color} mb-3 group-hover:scale-110 transition-transform`}>{card.icon}</div>
                        <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{card.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{card.desc}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* BARRA DE BÚSQUEDA SIMULADA (TYPEWRITER) */}
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex items-center shadow-2xl relative overflow-hidden"
                  >
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 px-4 text-left font-mono text-slate-500 dark:text-slate-400 text-lg">
                      {typewriterText}
                      <span className="animate-pulse">|</span>
                    </div>
                    <div className="absolute right-2 top-2 bottom-2 bg-gradient-to-l from-white dark:from-slate-900 to-transparent w-16 pointer-events-none"></div>
                  </motion.div>

                  {/* BADGES MULTI-PLATAFORMA */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-4 opacity-80 pt-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <Youtube className="w-4 h-4 text-red-500 fill-current" /> YouTube Shorts
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <Instagram className="w-4 h-4 text-pink-500" /> Instagram Reels
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px] font-black">T</span> TikTok
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
                    <Button size="xl" className="h-16 rounded-2xl px-12 text-xl font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all relative overflow-hidden group" onClick={() => navigate("/auth")}>
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -z-10"></div>
                      Comenzar Ahora
                    </Button>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="pt-10 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Sin mensualidades</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Garantía de 30 días</span>
                  </motion.div>
                </div>
              </section>

              {/* LOGOS / SOCIAL PROOF (Inspirado en Notion/Webflow) */}
              <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="container mx-auto px-6">
                  <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Utilizado por creadores en las mejores plataformas</p>
                  <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 font-bold text-xl"><Youtube className="w-8 h-8 text-red-600" /> YouTube</div>
                    <div className="flex items-center gap-2 font-bold text-xl"><Instagram className="w-8 h-8 text-pink-500" /> Instagram</div>
                    <div className="flex items-center gap-2 font-bold text-xl"><span className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center text-sm">T</span> TikTok</div>
                    <div className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Twitter X</div>
                  </div>
                </div>
              </section>

              {/* SECTION: BENTO GRID FEATURES (Inspirado en Linear) */}
              <section id="features" className="py-24 px-6 bg-white dark:bg-slate-950">
                <div className="container mx-auto max-w-7xl">
                  <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">Potencia tus decisiones con Data Viral.</h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">No adivines qué será tendencia. Míralo ocurrir en tiempo real.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[auto] md:h-[600px]">
                    {/* Tarjeta 1: Outliers (Grande) */}
                    <motion.div whileHover={{ y: -5 }} className="md:col-span-2 md:row-span-1 bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 overflow-hidden relative group">
                      <div className="relative z-10">
                        <Badge className="bg-primary text-white mb-4">Radar de Gems</Badge>
                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Detector de Outliers</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">Encuentra videos con 10x más vistas que suscriptores.</p>
                      </div>
                      <div className="absolute right-[-20px] bottom-[-20px] w-64 h-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-black text-xs">YT</div>
                          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                          <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] font-black text-primary">15.4x GROWTH</span>
                            <Flame className="w-4 h-4 text-orange-500" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tarjeta 2: VPH (Pequeña) */}
                    <motion.div whileHover={{ y: -5 }} className="md:col-span-1 md:row-span-1 bg-blue-500 text-white rounded-[32px] p-8 flex flex-col justify-between overflow-hidden relative">
                      <div className="relative z-10">
                        <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
                        <h3 className="text-xl font-bold">VPH Real</h3>
                      </div>
                      <div className="mt-8 relative z-10">
                        <div className="text-4xl font-black tabular-nums">1,240 <span className="text-sm font-normal opacity-70">/h</span></div>
                        <p className="text-xs opacity-80 mt-1">Vistas por hora detectadas ahora</p>
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    </motion.div>

                    {/* Tarjeta 3: Kit Viral (Vertical) */}
                    <motion.div whileHover={{ y: -5 }} className="md:col-span-1 md:row-span-2 bg-slate-900 text-white rounded-[32px] p-8 border border-white/10 flex flex-col overflow-hidden">
                      <Wand2 className="w-8 h-8 mb-6 text-purple-400" />
                      <h3 className="text-2xl font-bold mb-4">Kit IA Pro</h3>
                      <div className="space-y-4 flex-1">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Hook Sugerido</p>
                          <p className="text-xs leading-relaxed italic">"Nadie te dice esto sobre..."</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Thumbnail Prompt</p>
                          <p className="text-[10px] opacity-60 font-mono">/imagine realistic cinematic...</p>
                        </div>
                        <div className="bg-primary/20 rounded-xl p-3 border border-primary/30 mt-4">
                          <p className="text-xs font-bold text-center">Generar Pack Completo</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tarjeta 4: Multi-Plataforma */}
                    <motion.div whileHover={{ y: -5 }} className="md:col-span-2 md:row-span-1 bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Multi-Plataforma</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[200px]">Detecta en YouTube y escala a TikTok e Instagram Reels.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-red-500"><Youtube /></div>
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-pink-500"><Instagram /></div>
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-black">T</div>
                      </div>
                    </motion.div>

                    {/* Tarjeta 5: Filtros (Pequeña) */}
                    <motion.div whileHover={{ y: -5 }} className="md:col-span-1 md:row-span-1 bg-purple-600 text-white rounded-[32px] p-8 flex flex-col justify-center items-center text-center">
                      <Filter className="w-10 h-10 mb-4 opacity-80" />
                      <h3 className="text-xl font-bold">Filtros Pro</h3>
                      <p className="text-[10px] opacity-80 mt-2">Segmentación por nicho y competencia</p>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* SECCIÓN: MAQUETAS VISUALES / "CÓMO FUNCIONA" */}
              <section id="how-it-works" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800 relative">
                <div className="container mx-auto max-w-7xl">
                  <div className="text-center mb-24 space-y-4">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-primary font-black uppercase tracking-widest text-xs">Metodología Viral</motion.div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">Así funciona tu nueva <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">arma secreta.</span></h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">De la detección de un nicho a la creación del contenido en minutos.</p>
                  </div>

                  {/* ESCENA 1: EL RADAR (BÚSQUEDA) */}
                  <div className="grid md:grid-cols-2 gap-20 items-center mb-40">
                    <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-[28px] flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10">
                        <Compass className="w-8 h-8" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black">01. El Radar de Gems</h3>
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                          Nuestro algoritmo escanea miles de canales cada minuto buscando **"Outliers"**: videos que rompen el techo de vistas comparado con los suscriptores del canal.
                        </p>
                      </div>
                      <ul className="space-y-4">
                        {[
                          { text: "Detección de VPH (Vistas por hora) en tiempo real.", color: "text-blue-500" },
                          { text: "Filtros por tamaño de canal para evitar saturación.", color: "text-blue-500" }
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className={`w-6 h-6 ${item.color}`} /> {item.text}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    <div className="relative group">
                      <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <FloatingData className="-top-10 -right-4" delay={0}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500"><Flame className="w-4 h-4" /></div>
                          <div><p className="text-[10px] font-black uppercase opacity-50">Trend Spike</p><p className="font-bold text-sm">+450% VPH</p></div>
                        </div>
                      </FloatingData>
                      <MockupBrowserWindow title="ViralTrends - Opportunity Detector">
                        <div className="space-y-6">
                          <div className="flex gap-2">
                            <div className="h-12 flex-1 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex items-center px-4 text-xs font-bold text-slate-400">Nicho: Recetas con Airfryer...</div>
                            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white"><Search className="w-5 h-5" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[1].map((i) => (
                              <div key={i} className="col-span-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                                <div className="flex gap-4">
                                  <div className="w-32 aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-400" /></div>
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <div className="pt-2 flex gap-4">
                                      <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">VPH</span><span className="font-black text-primary">1.2k</span></div>
                                      <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">RATIO</span><span className="font-black text-green-500">12.5x</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </MockupBrowserWindow>
                    </div>
                  </div>

                  {/* ESCENA 2: EL CEREBRO (IA) */}
                  <div className="grid md:grid-cols-2 gap-20 items-center">
                    <div className="relative order-2 md:order-1 group cursor-default">
                      <div className="absolute -inset-10 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <FloatingData className="-bottom-8 -left-6" delay={1}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500"><Wand2 className="w-4 h-4" /></div>
                          <p className="text-sm font-black">Guion Generado ✨</p>
                        </div>
                      </FloatingData>
                      <MockupBrowserWindow title="ViralTrends - AI Studio">
                        <div className="flex gap-4 h-64">
                          <div className="w-1/3 bg-black rounded-lg relative overflow-hidden flex items-center justify-center group/video">
                            <div className="w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center group-hover/video:scale-110 transition-transform"><PlayCircle className="text-white w-6 h-6" /></div>
                            <div className="absolute bottom-2 left-2 right-2 bg-white/10 backdrop-blur-md p-2 rounded-lg">
                              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-primary"></div></div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex gap-2">
                              <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                              <div className="w-8 h-3 bg-primary/30 rounded-full"></div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full opacity-50"></div>
                              <div className="h-2 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-full opacity-50"></div>
                              <div className="h-2 w-full bg-primary/20 rounded-full"></div>
                            </div>
                            <div className="h-10 w-full bg-purple-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white px-2">Exportar Kit para Shorts</div>
                          </div>
                        </div>
                      </MockupBrowserWindow>
                    </div>

                    <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8 order-1 md:order-2">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-[28px] flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xl shadow-purple-500/10">
                        <Zap className="w-8 h-8" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black">02. El Cerebro IA</h3>
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                          No solo encuentras la idea, **la ejecutas**. Nuestra IA analiza el video original y te entrega un paquete completo de producción optimizado para retención.
                        </p>
                      </div>
                      <ul className="space-y-4">
                        {[
                          { text: "Guiones con hooks probados por el algoritmo.", color: "text-purple-500" },
                          { text: "Prompts de imágenes para miniaturas virales.", color: "text-purple-500" }
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className={`w-6 h-6 ${item.color}`} /> {item.text}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* SUCCESS STORY - PREMIUM REBRANDING */}
              <section id="success-stories" className="py-40 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                  <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-10">
                        <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border">Caso de Éxito</Badge>
                        <h3 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">"El ROI es <span className="text-primary">simplemente ridículo</span>."</h3>
                        <p className="text-slate-400 text-xl leading-relaxed font-medium">
                          Martín pasó de ser un creador más a dominar su nicho tech usando nuestra validación de datos. Ya no adivina qué subir, lo sabe.
                        </p>
                        <div className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 border border-white/10 w-fit backdrop-blur-sm">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">MG</div>
                          <div>
                            <p className="font-bold text-xl">Martín G.</p>
                            <p className="text-primary font-black uppercase tracking-widest text-[10px]">Tech Creator (150k+ Subs)</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
                        <div className="bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-3xl">
                          <div className="flex justify-between items-center mb-8">
                            <h4 className="font-black tracking-tight text-xl">Impacto en Métricas Real</h4>
                            <div className="flex gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500"><TrendingUp className="w-4 h-4" /></div>
                            </div>
                          </div>
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Antes de ViralTrends</span><span className="text-slate-200">2.4k vistas/mes</span></div>
                              <div className="h-4 w-full bg-slate-700/50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "15%" }} transition={{ duration: 1.5 }} className="h-full bg-slate-500"></motion.div></div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between text-sm font-bold"><span className="text-primary">Después de ViralTrends</span><span className="text-white">185.0k vistas/mes</span></div>
                              <div className="h-4 w-full bg-slate-700/50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} whileInView={{ width: "95%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></motion.div></div>
                            </div>
                          </div>
                          <div className="mt-10 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Crecimiento</p><p className="text-3xl font-black text-primary">+7,200%</p></div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">ROI</p><p className="text-3xl font-black text-green-400">Besta</p></div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION: CONSULTANCY (NUEVO) */}
              <section id="consultancy" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="container mx-auto max-w-6xl">
                  <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                      <Badge className="bg-primary/10 text-primary border-primary/20 mb-6">Servicio Exclusivo</Badge>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Consultoría Estratégica para Creadores.</h2>
                      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        No solo te damos los datos. Te ayudamos a interpretarlos y a construir un sistema de producción que escale tu audiencia de forma predecible.
                      </p>
                      <ul className="space-y-4 mb-10">
                        {[
                          "Auditoría profunda de nicho y competencia.",
                          "Optimización de retención basada en psicología viral.",
                          "Implementación de flujos de trabajo con IA (Scripts + Edición)."
                        ].map((text, i) => (
                          <li key={i} className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-200">
                            <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" /> {text}
                          </li>
                        ))}
                      </ul>
                      <Button size="xl" variant="outline" className="rounded-2xl border-primary text-primary hover:bg-primary/10 font-bold" onClick={() => window.open('mailto:hola@viraltrends.ai')}>Reservar Sesión de Estrategia</Button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="bg-white dark:bg-slate-950 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl relative"
                    >
                      <div className="absolute -top-4 -right-4 bg-primary text-white p-4 rounded-2xl shadow-xl rotate-12">
                        <Star className="w-6 h-6 fill-current" />
                      </div>
                      <h4 className="font-black text-xl mb-6">Plan de Acción 90 Días</h4>
                      <div className="space-y-6">
                        {[
                          { step: "01", title: "Análisis de Datos", desc: "Identificamos tus 'Outliers' históricos.", status: "Done" },
                          { step: "02", title: "Diseño de Formato", desc: "Creamos un estilo visual único y optimizado.", status: "In Progress" },
                          { step: "03", title: "Escalado Viral", desc: "Producción masiva apoyada en nuestra IA.", status: "Next" }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary shrink-0">{item.step}</div>
                            <div>
                              <h5 className="font-bold text-sm">{item.title}</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Disponibilidad</p>
                          <p className="text-sm font-bold text-green-500">2 Cupos para Marzo</p>
                        </div>
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800"></div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* PRICING SECTION - MODERN CARDS */}
              <section id="pricing" className="py-40 px-6 bg-white dark:bg-slate-950">
                <div className="container mx-auto max-w-6xl">
                  <div className="text-center mb-24 space-y-6">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">Acceso <span className="text-primary italic">ilimitado</span>.</h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">Una inversión única para dominar el algoritmo para siempre.</p>
                  </div>

                  <div className="flex justify-center max-w-xl mx-auto">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="p-12 rounded-[40px] border-4 border-primary bg-white dark:bg-slate-900 shadow-3xl shadow-primary/20 flex flex-col items-center text-center relative overflow-hidden z-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                      <div className="absolute -top-6 inset-x-0 flex justify-center">
                        <div className="bg-primary text-white text-xs font-black px-6 py-2 rounded-full shadow-xl uppercase tracking-widest">Oferta Lifetime</div>
                      </div>
                      <h3 className="font-black text-2xl mb-2 italic">Lifetime Access</h3>
                      <p className="text-sm text-primary mb-8 font-black uppercase tracking-widest">Acceso de por vida</p>
                      <div className="text-6xl font-black mb-10 text-slate-900 dark:text-white">$149</div>
                      <ul className="space-y-4 mb-10 text-sm font-bold text-slate-900 dark:text-white">
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Búsquedas Ilimitadas</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> IA Studio Full (Scripts+Prompts)</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Soporte VIP</li>
                      </ul>
                      <Button size="xl" className="w-full rounded-2xl h-16 font-black text-xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all bg-primary" onClick={() => navigate("/auth")}>Comprar Ahora</Button>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* FOOTER - MINIMALIST */}
              <footer className="py-24 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
                <div className="container mx-auto px-6 max-w-6xl">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><Zap className="w-6 h-6 fill-current" /></div>
                      ViralTrends<span className="text-primary">.ai</span>
                    </div>
                    <nav className="flex gap-10 text-sm font-black uppercase tracking-widest text-slate-400 group">
                      {["Privacidad", "Términos", "Contacto", "Twitter"].map(item => (
                        <a key={item} href="#" className="hover:text-primary transition-colors">{item}</a>
                      ))}
                    </nav>
                  </div>
                  <div className="mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    © 2026 ViralTrends AI. Hecho con pasión para creadores.
                  </div>
                </div>
              </footer>
            </div>
          )}

          {view === "videos" && (
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in">
              <ViralSearchHeader
                query={query}
                onChangeQuery={setQuery}
                onSearch={handleSearch}
                filters={filters}
                onOpenFilters={() => setShowFilters(true)}
              />

              {!loading && liveResults.length > 0 && (<> <ViralSortControl value={sortBy} onChange={setSortBy} /> <NicheInsightsBar items={liveResults} onKeywordClick={handleTagClick} /> </>)}

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[360px] rounded-[20px] border border-border bg-card/40 animate-pulse" />)}
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-bold text-sm">{error}</p>
                  <Button variant="ghost" size="sm" className="ml-auto hover:bg-red-500/10" onClick={() => setError(null)}><X className="w-4 h-4" /></Button>
                </div>
              )}

              {!loading && !error && hasVideoSearched && liveResults.length === 0 && <EmptyState onRetry={() => setShowFilters(true)} />}

              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedLiveResults.map((item) => (
                    <ViralVideoCard
                      key={item.id}
                      video={item}
                      onOpen={() => setSelected(item)}
                      saved={isSaved(item.id)}
                      onToggleSave={toggleSaved}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          {(view === "viral" || view === "search" || view === "saved" || view === "tools" || view === "glossary") && (
            <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 animate-in fade-in">
              {view === "viral" ? (
                <MorningDashboard
                  onExploreMore={() => setView("search")}
                  onQuickFilter={(type) => {
                    setView("search");
                    setViralResults([]); // Clear previous
                    setHasViralSearched(false);

                    const newFilters = { ...viralFilters };
                    if (type === 'shorts') newFilters.type = 'short';
                    if (type === 'small') newFilters.maxSubs = 10000;

                    setViralFilters(newFilters);

                    // Trigger search immediately with new configuration
                    runViralSearch(undefined, newFilters);
                  }}
                />
              ) : view === "search" ? (
                <div className="space-y-8">
                  <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
                    <div className="space-y-6">
                      <div><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Buscador de Oportunidades</h2><p className="text-muted-foreground mt-2 max-w-2xl">Encuentra oportunidades específicas.</p></div>
                      <div className="flex gap-2 w-full">
                        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" /><Input placeholder="Busca un nicho..." className="pl-10 h-14 text-lg rounded-2xl bg-surface/50 border-border" value={viralInput} onChange={(e) => setViralInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runViralSearch()} /></div>
                        <Button className="h-14 rounded-2xl px-6 font-bold" onClick={() => runViralSearch()} disabled={viralLoading}>{viralLoading ? "..." : "Buscar"}</Button>
                        <Button variant="glowOutline" className="h-14 rounded-2xl px-6" onClick={() => setShowViralFilters(true)}>Filtros</Button>
                      </div>
                      {aiCriteria && (<div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Criterio IA</p><p className="mt-1 text-sm"><span className="font-extrabold">Topic:</span> {viralTopic}</p><p className="mt-2 text-sm text-muted-foreground">{aiCriteria}</p></div>)}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-wrap gap-2">{VIRAL_TOPICS.map((t) => (<button key={t} onClick={() => { setViralTopic(t); setViralInput(t); runViralSearch(t); }} className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${t === viralTopic ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface text-muted-foreground'}`}>{t}</button>))}</div>
                        <Button variant="hero" className="rounded-xl shrink-0" onClick={() => { const next = VIRAL_TOPICS[Math.floor(Math.random() * VIRAL_TOPICS.length)]; setViralTopic(next); setViralInput(next); runViralSearch(next); }}>Sorpréndeme</Button>
                      </div>
                    </div>
                  </div>

                  {!viralLoading && hasViralSearched && viralResults.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <EmptyState onRetry={() => setShowViralFilters(true)} />
                    </motion.div>
                  )}

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
              ) : view === "glossary" ? (
                <ViralGlossaryView />
              ) : (
                <ViralToolsView onOpenApiKey={() => navigate("/integrations")} onOpenSearchFilters={() => setShowFilters(true)} onOpenExplorerFilters={() => setShowViralFilters(true)} onGoSearch={() => setView("videos")} onExportSaved={() => { }} savedCount={saved.length} />
              )}
            </section>
          )
          }
        </main >

        {/* --- MODAL DETALLE VIDEO --- */}
        {
          selected && (
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
                          <TabsContent value="metadata" className="space-y-6">
                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase text-muted-foreground">Títulos Virales</p>
                              <div className="space-y-2">
                                {viralPackage.titles.map((t, i) => (
                                  <div key={i} className="group relative p-3 bg-card border border-border rounded-xl text-sm hover:bg-surface transition-colors cursor-pointer" onClick={() => copyToClipboard(t, `title-${i}`)}>
                                    {t}
                                    <span id={`title-${i}`} className="absolute right-2 top-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Copiar</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase text-muted-foreground">Hashtags</p>
                              <div className="flex flex-wrap gap-2">
                                {viralPackage.seo?.hashtags?.map((tag, i) => (
                                  <div key={i} onClick={() => copyToClipboard(tag, `hash-${i}`)} className="cursor-pointer px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary text-xs font-medium transition-colors">
                                    {tag}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase text-muted-foreground">Keywords SEO</p>
                              <div className="p-3 bg-card border border-border rounded-xl text-xs text-muted-foreground font-mono leading-relaxed select-all">
                                {viralPackage.seo?.keywords?.join(", ")}
                              </div>
                            </div>
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
          )
        }

        <ViralFiltersDialog open={showFilters} onOpenChange={setShowFilters} value={filters} onApply={(newFilters) => { setFilters(newFilters); if (view === "videos") handleSearchGeneric(query, newFilters, false); }} />
        <ViralFiltersDialog open={showViralFilters} onOpenChange={setShowViralFilters} value={viralFilters} onApply={(newFilters) => { setViralFilters(newFilters); const topicToSearch = viralTopic || viralInput; handleSearchGeneric(topicToSearch, newFilters, true); }} />

      </div ></div >
  );
}
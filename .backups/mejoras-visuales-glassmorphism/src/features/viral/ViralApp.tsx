import * as React from "react";
import { ViralSidebar, type ViralView } from "./components/ViralSidebar";
import { toast } from "sonner";
import { ViralSearchHeader } from "./components/ViralSearchHeader";
import { ViralVideoCard } from "./components/ViralVideoCard";
import { NicheInsightsBar } from "./components/NicheInsightsBar";
import { ViralFiltersDialog } from "./components/ViralFiltersDialog";
import { ViralSavedView } from "./components/ViralSavedView";
import { ViralToolsView } from "./components/ViralToolsView";
import { ViralSortControl, type SortOption } from "./components/ViralSortControl";
import { ViralGlossaryView } from "./components/ViralGlossaryView";
import type { ViralFilters, VideoItem } from "./types";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
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

const VIRAL_TOPICS = [
  "inteligencia artificial", "finanzas personales", "fitness en casa", "recetas rápidas",
  "motivación", "productividad", "misterios y datos curiosos", "tecnología gadgets",
  "historias reales", "animales y mascotas", "gaming", "emprendimiento",
  "criptomonedas", "marketing digital",
];

export default function ViralApp() {
  const navigate = useNavigate();
  const [session, setSession] = React.useState<any>(null);
  const [view, setView] = React.useState<ViralView>("viral"); // Allow "search" view
  const [query, setQuery] = React.useState<string>("");
  const [selected, setSelected] = React.useState<VideoItem | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const location = useLocation();
  React.useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view as ViralView);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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
    setView("viral");
    navigate("/");
  };


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

  const { saved, isSaved, toggleSaved, clearSaved, generateScript } = useSavedVideos();

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

  const handleGenerateScript = async (video: VideoItem) => {
    if (!video) return;

    setScriptLoading(true);
    try {
      // Use the robust generateScript from useSavedVideos hook
      await generateScript(video);

      // Update local state if needed (mostly handled by hook)
      toast.success("Estrategia generada con éxito");
    } catch (e) {
      console.error("Error generating script:", e);
      toast.error("Error al generar el paquete viral.");
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
    const badges = [];
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

  const ensureTopic = async (): Promise<string | null> => {
    // If we already have a valid topic (not the default list one if it's generic, but here we assume entered/AI)
    if (viralTopic && viralTopic.length > 2 && !VIRAL_TOPICS.includes(viralTopic)) return viralTopic;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: identity } = await supabase
        .from('user_channel_identities' as any)
        .select('identity_profile')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const dbTopic = ((identity as any)?.identity_profile as any)?.tema_principal;
      if (dbTopic) {
        setViralTopic(dbTopic);
        return dbTopic;
      }
    } catch (e) {
      console.error("Error fetching topic:", e);
    }
    return null;
  };

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
    const q = topic || viralInput || viralTopic || "viral";
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

  // REMOVED useEffect to prevent Race Condition / Blinking
  // React.useEffect(() => {
  //   if (aiCriteria) return;
  //   if (view === "viral" && viralResults.length === 0 && !viralLoading) { runViralSearch(viralTopic); }
  // }, [view]);

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full flex justify-center py-12 relative z-20">
      <div className="relative bg-gradient-to-b from-white/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-[32px] p-10 text-center max-w-lg shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-violet-500/20 to-transparent rounded-full blur-3xl" />
        <button onClick={handleResetSearch} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-muted-foreground z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-full blur-2xl" />
            <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center border border-white/50 dark:border-white/10 shadow-xl"
            >
              <Search className="w-10 h-10 text-slate-400" />
            </div>
          </motion.div>
          <h3 className="text-2xl font-black mb-3">Sin resultados</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Intentá con términos más amplios o ajustá los filtros para encontrar más oportunidades.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={handleResetSearch} className="rounded-full px-6 border-2 border-dashed"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Limpiar todo
            </Button>
            {onRetry && (
              <Button onClick={onRetry} className="rounded-full px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25"
              >
                <Filter className="w-4 h-4 mr-2" /> Ajustar filtros
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 font-sans">
      {(view as any) !== "home" && (
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
        <DashboardHeader
          user={session?.user}
          toggleTheme={toggleTheme}
          isDark={isDark}
        />

        <main className="flex-1 overflow-y-auto relative scroll-smooth">



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
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[400px] rounded-[28px] overflow-hidden bg-gradient-to-b from-white/60 to-white/30 dark:from-slate-900/60 dark:to-slate-900/30 border border-white/20 dark:border-white/5 shadow-lg">
                      {/* Thumbnail skeleton */}
                      <div className="aspect-video bg-gradient-to-br from-slate-200/80 to-slate-300/50 dark:from-slate-800/80 dark:to-slate-700/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                      {/* Content skeleton */}
                      <div className="p-5 space-y-4">
                        <div className="h-5 bg-slate-200/80 dark:bg-slate-700/50 rounded-lg w-3/4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                        <div className="h-4 bg-slate-200/60 dark:bg-slate-700/30 rounded-lg w-1/2 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <div className="h-10 flex-1 bg-slate-200/70 dark:bg-slate-700/40 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </div>
                          <div className="h-10 flex-1 bg-slate-200/70 dark:bg-slate-700/40 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
          {(view === "viral" || view === "saved" || view === "tools" || view === "glossary") && (
            <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 animate-in fade-in">
              {view === "viral" ? (
                <MorningDashboard
                  onExploreMore={() => navigate('/outliers')}
                  onToggleSave={toggleSaved}
                  isSaved={isSaved}
                  onNavigate={(target) => {
                    if (target === 'analytics') {
                      navigate('/analytics');
                    } else if (target === 'create') {
                      navigate('/studio');
                    } else if (target === 'integrations') {
                      navigate('/integrations');
                    } else {
                      setView(target as any);
                    }
                  }}
                  onQuickFilter={async (type, nicheOverride) => {
                    // Navigate to Standard Search ("videos" view) with Context-Aware Query

                    // Use the overridden niche (from Dashboard), or current topic, or input
                    let baseTopic = nicheOverride || (viralTopic && viralTopic.length > 2 && !VIRAL_TOPICS.includes(viralTopic) ? viralTopic : (viralInput || ""));

                    if (!baseTopic) {
                      const fetched = await ensureTopic();
                      if (fetched) baseTopic = fetched;
                    }

                    if (!baseTopic) {
                      toast.error("Define tu nicho primero", { description: "Escribe tu temática en el buscador o usa la IA para detectar tu nicho." });
                      return;
                    }

                    // Update global topic if we have a strong signal
                    if (nicheOverride && nicheOverride !== viralTopic) {
                      setViralTopic(nicheOverride);
                    }

                    const newFilters = { ...filters }; // Use global filters base
                    let queryTerm = baseTopic;

                    if (type === 'shorts') {
                      newFilters.type = 'short';
                      newFilters.date = 'month'; // Fresh content
                      queryTerm = `${baseTopic} shorts`;
                    }
                    if (type === 'joya oculta' || type === 'small') {
                      newFilters.maxSubs = 20000;
                      newFilters.minViews = 2000;
                      // Relaxed filters to ensure results
                      newFilters.date = 'year';
                      queryTerm = `${baseTopic}`;
                    }

                    setFilters(newFilters);
                    setQuery(queryTerm);
                    setViralInput(baseTopic); // Sync input
                    setView("videos");

                    // Trigger standard search (isViral = false)
                    handleSearchGeneric(queryTerm, newFilters, false);
                  }}
                />
              ) : view === "saved" ? (
                <div className="container mx-auto px-6 py-8">
                  <ViralSavedView
                    saved={saved}
                    onOpen={(v) => { setSelected(v); }}
                    onToggleSave={toggleSaved}
                    onGoSearch={() => { handleResetSearch(); setView('viral'); }}
                    onClear={clearSaved}
                    onTagClick={handleTagClick}
                    onGenerateScript={handleGenerateScript}
                  />
                </div>
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
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={() => setSelected(null)}>
              {/* Efectos de luz de fondo */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px]" />
              </div>

              <div className="relative w-full max-w-5xl rounded-[32px] border border-white/20 dark:border-white/10 bg-gradient-to-b from-white/90 to-white/80 dark:from-slate-900/90 dark:to-slate-900/80 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
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
                              <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" variant="hero" onClick={() => handleGenerateScript(selected)} disabled={scriptLoading}>
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
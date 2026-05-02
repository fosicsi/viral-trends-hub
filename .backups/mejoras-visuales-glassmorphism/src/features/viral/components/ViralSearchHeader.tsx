import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ViralFilters } from "../types";
import { formatNumber } from "@/lib/format";
import { Calendar, SlidersHorizontal, Users, Eye, Search, ArrowUpDown, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  query: string;
  onChangeQuery: (v: string) => void;
  onSearch: () => void;
  filters: ViralFilters;
  onOpenFilters: () => void;
};

export function ViralSearchHeader({ query, onChangeQuery, onSearch, filters, onOpenFilters }: Props) {
  return (
    <section className="space-y-6">
      {/* Header con efecto de gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-cyan-500/20 to-blue-500/5 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
              Buscador Viral
            </h2>
          </div>
          <p className="text-muted-foreground ml-11">
            Descubre videos outliers y oportunidades de nicho con análisis en tiempo real.
          </p>
        </div>
      </motion.div>

      {/* Search Bar mejorada */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex gap-3"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <Input
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Busca un nicho (ej: #recetas, #futbol, #tech)..."
            className="h-14 rounded-2xl pl-12 pr-4 bg-gradient-to-b from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40
                       border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                       focus:ring-2 focus:ring-primary/30 transition-all duration-300 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="xl"
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all duration-300 border-0"
            onClick={onSearch}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </motion.div>
      </motion.div>

      {/* Filtros activos con chips mejorados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-wrap items-center gap-3"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros activos</span>

        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2 hover:border-amber-500/50 transition-colors cursor-default">
            <Eye size={14} /> +{formatNumber(filters.minViews)} vistas
          </div>

          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 hover:border-emerald-500/50 transition-colors cursor-default">
            <Users size={14} /> -{formatNumber(filters.maxSubs)} subs
          </div>

          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2 hover:border-blue-500/50 transition-colors cursor-default">
            <Calendar size={14} />
            {filters.date === "week" ? "Última semana" : filters.date === "month" ? "Último mes" : filters.date === "year" ? "Último año" : "Todo el tiempo"}
          </div>

          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-2 hover:border-violet-500/50 transition-colors cursor-default">
            <ArrowUpDown size={14} />
            {filters.order === "date" ? "Por tendencia" : "Más vistas"}
          </div>
        </div>

        <motion.div className="ml-auto" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            className="rounded-full px-5 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal size={16} className="mr-2" /> Ajustar
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

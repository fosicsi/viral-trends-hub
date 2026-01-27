import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ViralFilters } from "../types";
import { formatNumber } from "@/lib/format";
import { Calendar, SlidersHorizontal, Users, Eye, Search, ArrowUpDown } from "lucide-react";

type Props = {
  query: string;
  onChangeQuery: (v: string) => void;
  onSearch: () => void;
  filters: ViralFilters;
  onOpenFilters: () => void;
};

export function ViralSearchHeader({ query, onChangeQuery, onSearch, filters, onOpenFilters }: Props) {
  return (
    <section className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Buscador Viral</h2>
          <p className="text-muted-foreground mt-1">Escribe un nicho y filtra por señales de oportunidad.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Busca un nicho o hashtag (ej: #recetas, #futbol)..."
            className="h-12 rounded-2xl pl-11 bg-surface border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
        </div>
        <Button variant="hero" size="xl" className="rounded-2xl" onClick={onSearch}>
          Buscar Tendencias
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mr-2">Activos</span>

        <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-foreground text-xs font-bold flex items-center gap-2">
          <Eye size={12} className="text-accent" /> +{formatNumber(filters.minViews)} vistas
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2">
          <Users size={12} /> -{formatNumber(filters.maxSubs)} suscriptores
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-brand-2/10 border border-brand-2/20 text-foreground text-xs font-bold flex items-center gap-2">
          <Calendar size={12} className="text-foreground/80" />
          {filters.date === "week" ? "Semana" : filters.date === "month" ? "Mes" : filters.date === "year" ? "Año" : "Siempre"}
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs font-bold flex items-center gap-2">
          <ArrowUpDown size={12} className="text-muted-foreground" />
          {filters.order === "date" ? "Tendencia" : "Más vistas"}
        </div>

        <Button
          variant="glowOutline"
          className="ml-auto rounded-xl"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal size={16} /> Editar parámetros
        </Button>
      </div>
    </section>
  );
}

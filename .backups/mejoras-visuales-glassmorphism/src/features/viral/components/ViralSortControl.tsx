import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "views" | "subs" | "recent" | "growth";

type Props = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function ViralSortControl({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-extrabold flex items-center gap-2">
        <ArrowUpDown size={16} className="text-muted-foreground" />
        Ordenar por:
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[240px] rounded-xl border-border bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="views">Más Vistas</SelectItem>
          <SelectItem value="subs">Oportunidad / Canales Pequeños</SelectItem>
          <SelectItem value="recent">Más Recientes</SelectItem>
          <SelectItem value="growth">Ratio de Crecimiento</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
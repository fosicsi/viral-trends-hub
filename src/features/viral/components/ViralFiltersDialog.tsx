import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ViralFilters } from "../types";
import { formatNumber } from "@/lib/format";

export function ViralFiltersDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: ViralFilters;
  onChange: (v: ViralFilters) => void;
  onApply: () => void;
}) {
  const set = (patch: Partial<ViralFilters>) => onChange({ ...value, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Filtros</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Vistas mínimas</Label>
                <span className="text-xs font-extrabold bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                  {formatNumber(value.minViews)}+
                </span>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <Slider
                  value={[value.minViews]}
                  onValueChange={([v]) => set({ minViews: v })}
                  max={5_000_000}
                  step={10_000}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Máx subs del canal</Label>
                <span className="text-xs font-extrabold bg-accent/10 text-foreground px-2 py-1 rounded-full border border-accent/20">
                  {formatNumber(value.maxSubs)}
                </span>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <Slider
                  value={[value.maxSubs]}
                  onValueChange={([v]) => set({ maxSubs: v })}
                  min={1_000}
                  max={1_000_000}
                  step={10_000}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Tipo</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "all", label: "Todos" },
                    { id: "short", label: "Shorts" },
                    { id: "medium", label: "Medianos" },
                    { id: "long", label: "Largos" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => set({ type: opt.id })}
                    className={
                      value.type === opt.id
                        ? "py-3 px-4 rounded-2xl text-sm font-extrabold border border-primary/40 bg-primary/10"
                        : "py-3 px-4 rounded-2xl text-sm font-bold border border-border bg-surface text-muted-foreground hover:text-foreground"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Publicación</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "all", label: "Siempre" },
                    { id: "year", label: "Último año" },
                    { id: "month", label: "Último mes" },
                    { id: "week", label: "Esta semana" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => set({ date: opt.id })}
                    className={
                      value.date === opt.id
                        ? "py-3 px-4 rounded-2xl text-sm font-extrabold border border-accent/40 bg-accent/10"
                        : "py-3 px-4 rounded-2xl text-sm font-bold border border-border bg-surface text-muted-foreground hover:text-foreground"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => onChange({ minViews: 10_000, maxSubs: 500_000, date: "year", type: "all" })}
          >
            Reset
          </Button>
          <div className="flex gap-3">
            <Button variant="soft" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={onApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

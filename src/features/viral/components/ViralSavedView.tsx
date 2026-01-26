import * as React from "react";
import type { VideoItem } from "../types";
import { ViralVideoCard } from "./ViralVideoCard";
import { Button } from "@/components/ui/button";

export function ViralSavedView({
  saved,
  onOpen,
  onToggleSave,
  onGoSearch,
  onClear,
}: {
  saved: VideoItem[];
  onOpen: (v: VideoItem) => void;
  onToggleSave: (v: VideoItem) => void;
  onGoSearch: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Guardados</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Tu shortlist de oportunidades. Se guarda en este dispositivo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" className="rounded-2xl" onClick={onGoSearch}>
              Buscar más
            </Button>
            <Button
              variant="glowOutline"
              className="rounded-2xl"
              onClick={onClear}
              disabled={saved.length === 0}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card p-10 shadow-elev text-center">
          <p className="text-lg font-extrabold">Todavía no guardaste nada</p>
          <p className="text-muted-foreground mt-2">
            En el buscador o explorador, toca <span className="font-bold">Guardar</span> en una tarjeta.
          </p>
          <div className="mt-6">
            <Button variant="hero" className="rounded-2xl" onClick={onGoSearch}>
              Ir al buscador
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {saved.map((v) => (
            <ViralVideoCard
              key={v.id}
              video={v}
              onOpen={onOpen}
              saved
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

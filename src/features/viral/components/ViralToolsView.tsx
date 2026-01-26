import { Button } from "@/components/ui/button";

function ToolCard({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 shadow-elev">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="hero" className="rounded-2xl" onClick={primary.onClick}>
          {primary.label}
        </Button>
        {secondary && (
          <Button variant="glowOutline" className="rounded-2xl" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ViralToolsView({
  onOpenApiKey,
  onOpenSearchFilters,
  onOpenExplorerFilters,
  onGoSearch,
  onExportSaved,
  savedCount,
}: {
  onOpenApiKey: () => void;
  onOpenSearchFilters: () => void;
  onOpenExplorerFilters: () => void;
  onGoSearch: () => void;
  onExportSaved: () => void;
  savedCount: number;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-border bg-card p-8 shadow-elev">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Herramientas</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Acciones rápidas para tu flujo (presets, conexión y export).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolCard
          title="Conexión YouTube"
          description="Configura/actualiza tu API Key para búsquedas en vivo."
          primary={{ label: "Configurar API Key", onClick: onOpenApiKey }}
          secondary={{ label: "Ir al buscador", onClick: onGoSearch }}
        />

        <ToolCard
          title="Preset: Oportunidad (canal pequeño)"
          description="Abre el buscador con un preset orientado a descubrir videos con buen ratio views/subs."
          primary={{ label: "Abrir buscador", onClick: onGoSearch }}
          secondary={{ label: "Ajustar filtros", onClick: onOpenSearchFilters }}
        />

        <ToolCard
          title="Explorador Viral"
          description="Modifica los filtros propios del Explorador Viral (Shorts, semana, max subs, etc.)."
          primary={{ label: "Ajustar filtros", onClick: onOpenExplorerFilters }}
        />

        <ToolCard
          title="Exportar guardados"
          description={`Descarga tus guardados en JSON. Actualmente: ${savedCount} items.`}
          primary={{ label: "Exportar", onClick: onExportSaved }}
        />
      </div>
    </div>
  );
}

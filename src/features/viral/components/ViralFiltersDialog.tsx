import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, Eye, Users, Calendar, RotateCcw } from "lucide-react";
import type { ViralFilters } from "../types";

interface ViralFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ViralFilters;
  // Modificamos onApply para que reciba los filtros nuevos
  onApply: (filters: ViralFilters) => void; 
}

export function ViralFiltersDialog({ open, onOpenChange, value, onApply }: ViralFiltersDialogProps) {
  
  const [localFilters, setLocalFilters] = React.useState<ViralFilters>(value);

  // Sincronizar cuando se abre el modal
  React.useEffect(() => {
    if (open) setLocalFilters(value);
  }, [open, value]);

  const handleReset = () => {
    const defaults: ViralFilters = {
        minViews: 5000, // Bajamos el default para encontrar más cosas
        maxSubs: 500000,
        date: "year",
        type: "video",
        order: "relevance"
    };
    setLocalFilters(defaults);
  };

  const handleNumberChange = (field: keyof ViralFilters, val: string) => {
    // Permitir vacío mientras se escribe, pero convertir a número al guardar
    const cleanVal = val.replace(/[^0-9]/g, '');
    const num = cleanVal === '' ? 0 : parseInt(cleanVal);
    setLocalFilters(prev => ({ ...prev, [field]: num }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <SlidersHorizontal className="w-5 h-5 text-primary" /> Filtros de Radar
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-red-400 h-8">
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
          </div>
          <DialogDescription>
            Define los umbrales para detectar oportunidades.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 py-6">
          
          {/* MÍNIMO DE VISTAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-bold text-muted-foreground">
                    <Eye className="w-4 h-4" /> Mínimo de Vistas
                </Label>
                <div className="relative w-32">
                    <Input 
                        type="text" 
                        value={localFilters.minViews || ''} 
                        onChange={(e) => handleNumberChange('minViews', e.target.value)}
                        placeholder="Ej: 5000"
                        className="h-8 text-right pr-2 font-mono text-sm font-bold bg-surface border-border"
                    />
                </div>
            </div>
            <Slider
              min={0}
              max={1000000}
              step={500} // Paso más fino para mayor precisión
              value={[localFilters.minViews]}
              onValueChange={([v]) => setLocalFilters({ ...localFilters, minViews: v })}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0</span>
                <span>500k</span>
                <span>1M+</span>
            </div>
          </div>

          {/* MÁXIMO DE SUBS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-bold text-muted-foreground">
                    <Users className="w-4 h-4" /> Máximo de Subs
                </Label>
                <div className="relative w-32">
                    <Input 
                        type="text" 
                        value={localFilters.maxSubs || ''} 
                        onChange={(e) => handleNumberChange('maxSubs', e.target.value)}
                        placeholder="Ej: 500000"
                        className="h-8 text-right pr-2 font-mono text-sm font-bold bg-surface border-border"
                    />
                </div>
            </div>
            <Slider
              min={0}
              max={5000000}
              step={5000}
              value={[localFilters.maxSubs]}
              onValueChange={([v]) => setLocalFilters({ ...localFilters, maxSubs: v })}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0</span>
                <span>Canales Medios</span>
                <span>5M (Grandes)</span>
            </div>
          </div>

          {/* FECHA */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-bold text-muted-foreground">
                <Calendar className="w-4 h-4" /> Antigüedad del Video
            </Label>
            <Select 
                value={localFilters.date} 
                onValueChange={(v: any) => setLocalFilters({ ...localFilters, date: v })}
            >
              <SelectTrigger className="w-full bg-surface border-border font-medium">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana (Tendencias Hot)</SelectItem>
                <SelectItem value="month">Este Mes (Consolidado)</SelectItem>
                <SelectItem value="year">Este Año (Evergreen)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => {
                onApply(localFilters); // Enviamos los datos frescos
                onOpenChange(false);
            }} 
            className="font-bold bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
          >
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
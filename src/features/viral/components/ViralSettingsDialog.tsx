import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube, Bot, Zap, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

interface ViralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function ViralSettingsDialog({ 
  open, 
  onOpenChange,
  isDark,
  onToggleTheme
}: ViralSettingsDialogProps) {
  const [youtubeKey, setYoutubeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");

  // Cargar keys guardadas al abrir
  useEffect(() => {
    if (open) {
      setYoutubeKey(localStorage.getItem("youtube_api_key") || "");
      setOpenaiKey(localStorage.getItem("openai_api_key") || "");
    }
  }, [open]);

  const handleSave = () => {
    if (youtubeKey) localStorage.setItem("youtube_api_key", youtubeKey);
    else localStorage.removeItem("youtube_api_key");

    if (openaiKey) localStorage.setItem("openai_api_key", openaiKey);
    else localStorage.removeItem("openai_api_key");

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-current" />
            Centro de Control
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajusta los motores de inteligencia y preferencias de la app.
          </p>
        </DialogHeader>

        <Tabs defaultValue="apis" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-surface p-1">
            <TabsTrigger value="apis" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Conexiones & API
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Interfaz
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: APIs */}
          <TabsContent value="apis" className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Youtube className="w-4 h-4" /> Motor de Búsqueda (YouTube)
                </Label>
                <Input 
                  placeholder="Pega tu YouTube Data API Key..." 
                  className="rounded-xl bg-surface/50 border-border focus-visible:ring-primary/20 font-mono text-sm"
                  value={youtubeKey}
                  onChange={(e) => setYoutubeKey(e.target.value)}
                  type="password"
                />
                <p className="text-[10px] text-muted-foreground">Necesaria para buscar videos reales y obtener métricas.</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Bot className="w-4 h-4" /> Motor Generativo (OpenAI / IA)
                </Label>
                <Input 
                  placeholder="sk-proj-..." 
                  className="rounded-xl bg-surface/50 border-border focus-visible:ring-primary/20 font-mono text-sm"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  type="password"
                />
                <p className="text-[10px] text-muted-foreground">Necesaria para generar guiones y análisis de tendencias con IA.</p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: PREFERENCIAS */}
          <TabsContent value="preferences" className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-surface/30">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border">
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Tema de Interfaz</p>
                        <p className="text-xs text-muted-foreground">{isDark ? "Modo Oscuro (Cyberpunk)" : "Modo Claro (Clean)"}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onToggleTheme} className="rounded-xl">
                    Cambiar a {isDark ? "Claro" : "Oscuro"}
                </Button>
             </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
                Guardar Configuración
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
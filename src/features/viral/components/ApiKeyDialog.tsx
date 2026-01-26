import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Conexión YouTube</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            La API Key ya está configurada de forma segura en el backend (no se expone en el navegador).
          </p>
          <p className="text-xs text-muted-foreground">
            Si quieres cambiarla, lo hacemos desde la configuración del proyecto.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="hero" className="flex-1" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

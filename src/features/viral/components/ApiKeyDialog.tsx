import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApiKeyDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onSave: (v: string) => void;
}) {
  const [val, setVal] = React.useState(value);

  React.useEffect(() => setVal(value), [value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Configurar YouTube API Key</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm">API Key</Label>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="AIzaSy..."
            className="bg-surface border-border font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Nota: por ahora se guarda en tu navegador (localStorage). En el siguiente paso lo movemos a backend para ocultarla.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="soft" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={() => {
              onSave(val.trim());
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Assuming you have a toast component or use a library like sonner/react-hot-toast. 
// If not, I'll use a simple console log or alert for now, or just the UI.
// User context implies shadcn/ui which usually comes with a Toast hook.
// I will assume standard shadcn replacement or just UI structure.

export function ExportButton() {
    const handleExport = (format: string) => {
        // Mock export functionality
        console.log(`Exporting as ${format}...`);
        alert(`Iniciando descarga de reporte en formato ${format}...`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("PDF")}>
                    Reporte Completo (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("CSV")}>
                    Datos Crudos (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("PNG")}>
                    Captura de Dashboard (PNG)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

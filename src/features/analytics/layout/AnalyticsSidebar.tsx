
import { Home, LineChart, PieChart, BarChart, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
    {
        title: "Resumen",
        href: "/analytics",
        icon: Home,
    },
    {
        title: "Contenido",
        href: "/analytics/content",
        icon: LineChart,
    },
    {
        title: "Audiencia",
        href: "/analytics/audience",
        icon: PieChart,
    },
    {
        title: "Ingresos",
        href: "/analytics/revenue",
        icon: BarChart,
    },
    {
        title: "Configuración",
        href: "/analytics/settings",
        icon: Settings,
    },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AnalyticsSidebar({ className }: SidebarProps) {
    const location = useLocation();

    return (
        <div className={cn("pb-12 h-full border-r bg-background", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Analíticas
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={location.pathname === item.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link to={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

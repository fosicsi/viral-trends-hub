import { VideoItem } from "../../viral/types"; // Using existing or outlier specific type
import { OutlierVideo } from "../types";
import { VideoCard } from "./VideoCard";
import { Search, Lightbulb } from "lucide-react";

interface VideoGridProps {
    videos: OutlierVideo[];
    isLoading: boolean;
    hasSearched: boolean;
}

const OUTLIER_TIPS = [
    "Prueba buscando términos específicos como 'receta freidora de aire' en lugar de temas generales.",
    "Busca nichos donde canales grandes no estén dominando; ahí están los mejores outliers.",
    "Juega con la duración de los videos en los filtros: a veces los Outliers son videos muy cortos y directos.",
    "Aplica un filtro de antigüedad para encontrar tendencias que estén explotando esta misma semana."
];

export function VideoGrid({ videos, isLoading, hasSearched }: VideoGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="animate-pulse flex flex-col gap-3">
                        <div className="aspect-[9/16] bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!hasSearched) {
        const randomTip = OUTLIER_TIPS[Math.floor(Math.random() * OUTLIER_TIPS.length)];
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                    <Lightbulb className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight text-slate-900 dark:text-white">¡Bienvenido al Radar!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mb-8">
                    Usa este buscador para encontrar videos que rompen el algoritmo en tu nicho.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border border-slate-200 dark:border-slate-800/50 rounded-2xl max-w-lg shadow-sm">
                    <p className="text-sm font-bold flex items-center justify-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                        <span className="text-primary text-xl">💡</span> Tip Pro
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        "{randomTip}"
                    </p>
                </div>
            </div>
        );
    }

    if (videos.length === 0) {
        const randomTip = OUTLIER_TIPS[Math.floor(Math.random() * OUTLIER_TIPS.length)];
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight text-slate-900 dark:text-white">No se encontraron videos</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-8">
                    Intenta ajustar tus filtros o las palabras clave para encontrar oportunidades de outliers.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border border-slate-200 dark:border-slate-800/50 rounded-2xl max-w-lg shadow-sm">
                    <p className="text-sm font-bold flex items-center justify-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                        <span className="text-primary text-xl">💡</span> Tip Pro
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        "{randomTip}"
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}

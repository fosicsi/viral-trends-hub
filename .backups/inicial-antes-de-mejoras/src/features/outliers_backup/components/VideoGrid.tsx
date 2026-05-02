import { VideoItem } from "../../viral/types"; // Using existing or outlier specific type
import { OutlierVideo } from "../types";
import { VideoCard } from "./VideoCard";
import { Search } from "lucide-react";

interface VideoGridProps {
    videos: OutlierVideo[];
    isLoading: boolean;
}

export function VideoGrid({ videos, isLoading }: VideoGridProps) {
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

    if (videos.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No videos found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Try adjusting your filters or search keywords to find outlier opportunities.
                </p>
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

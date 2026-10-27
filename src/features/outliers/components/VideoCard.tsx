import { OutlierVideo } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";

interface VideoCardProps {
    video: OutlierVideo;
}

export function VideoCard({ video }: VideoCardProps) {
    // Determine Badge Color
    const getBadgeColor = (score: number) => {
        if (score >= 5) return "bg-green-500/10 text-green-500 border-green-500/20"; // Super Viral
        if (score >= 1.5) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"; // Good
        if (score >= 1) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"; // Solid / Average
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"; // Mediocre
    };

    const badgeClass = getBadgeColor(video.outlierScore);
    const formattedDate = getRelativeTime(video.publishedAt);

    return (
        <a
            href={`https://youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
        >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {video.duration}
                </div>
            </div>

            <div className="space-y-1 px-1">
                <div className="flex items-start justify-between gap-2">
                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                        {video.outlierScore}x • {video.scoreLabel}
                    </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formatNumber(video.views)} vistas <span className="opacity-60">(promedio: {formatNumber(video.avgViews)})</span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {video.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <div className="truncate pr-2 font-medium">
                        {video.channelName} • {formatNumber(video.channelSubscribers)} subs
                    </div>
                    <div className="shrink-0 text-slate-400">{formattedDate}</div>
                </div>
            </div>
        </a>
    );
}

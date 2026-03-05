import { useState, useMemo } from "react";
import { OutlierVideo, OutlierFilters, FormatType, SortOption } from "../types";

// Mock data focused on History, Mysteries, Nostalgia, Documentaries, and Curiosities.
// No gaming or vlogs allowed per user request.
const MOCK_VIDEOS: OutlierVideo[] = [
    {
        id: "v1",
        title: "El Misterio Oculto del Incidente del Paso Diátlov",
        thumbnailUrl: "https://images.unsplash.com/photo-1548625361-ec8580b06ab5?auto=format&fit=crop&q=80&w=800", // Snowy mountain
        duration: "18:45",
        channelName: "Crónicas Ocultas",
        channelSubscribers: 12500,
        publishedAt: "2 weeks ago",
        views: 185000,
        avgViews: 8500,
        outlierScore: 21.7,
        scoreLabel: "Great",
        format: "longform",
    },
    {
        id: "v2",
        title: "Así era la INTELIGENCIA ARTIFICIAL en 1980 📼",
        thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800", // Retro tech
        duration: "0:58",
        channelName: "Nostalgia Tech",
        channelSubscribers: 3400,
        publishedAt: "3 days ago",
        views: 42500,
        avgViews: 1200,
        outlierScore: 35.4,
        scoreLabel: "Viral",
        format: "shorts",
    },
    {
        id: "v3",
        title: "La Ciudad que Desapareció en una Noche",
        thumbnailUrl: "https://images.unsplash.com/photo-1518558997970-4fdcb6ae1a7b?auto=format&fit=crop&q=80&w=800", // Ruins
        duration: "24:10",
        channelName: "Historia Desconocida",
        channelSubscribers: 45000,
        publishedAt: "1 month ago",
        views: 225000,
        avgViews: 35000,
        outlierScore: 6.4,
        scoreLabel: "Solid",
        format: "longform",
    },
    {
        id: "v4",
        title: "El Manuscrito Voynich Explicado en 1 Minuto",
        thumbnailUrl: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&q=80&w=800", // Old book
        duration: "0:59",
        channelName: "Misterios Express",
        channelSubscribers: 890,
        publishedAt: "1 week ago",
        views: 14200,
        avgViews: 450,
        outlierScore: 31.5,
        scoreLabel: "Viral",
        format: "shorts",
    },
    {
        id: "v5",
        title: "Por qué colapsó la Isla de Pascua (Mentira Histórica)",
        thumbnailUrl: "https://images.unsplash.com/photo-1589308078059-e1ae67a18838?auto=format&fit=crop&q=80&w=800", // Moai status
        duration: "14:20",
        channelName: "Mitos Desmentidos",
        channelSubscribers: 88000,
        publishedAt: "5 months ago",
        views: 95000,
        avgViews: 120000,
        outlierScore: 0.8,
        scoreLabel: "Mediocre",
        format: "longform",
    },
    {
        id: "v6",
        title: "¿Qué había ANTES del Big Bang? (Documental)",
        thumbnailUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800", // Space
        duration: "45:30",
        channelName: "Cosmos Infinito",
        channelSubscribers: 220000,
        publishedAt: "2 months ago",
        views: 1500000,
        avgViews: 850000,
        outlierScore: 1.7,
        scoreLabel: "Good",
        format: "longform",
    },
    {
        id: "v7",
        title: "El Juguete Más Peligroso de los 90s ☢️",
        thumbnailUrl: "https://images.unsplash.com/photo-1596461404969-9ce20c71c73f?auto=format&fit=crop&q=80&w=800", // Toys/radioactive look
        duration: "0:45",
        channelName: "Nostalgia Tóxica",
        channelSubscribers: 15000,
        publishedAt: "2 days ago",
        views: 65000,
        avgViews: 20000,
        outlierScore: 3.2,
        scoreLabel: "Solid",
        format: "shorts",
    },
    {
        id: "v8",
        title: "El último hombre que habló esta lengua",
        thumbnailUrl: "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800", // Portrait/culture
        duration: "1:00",
        channelName: "Culturas Olvidadas",
        channelSubscribers: 250,
        publishedAt: "4 days ago",
        views: 12500,
        avgViews: 50,
        outlierScore: 250.0,
        scoreLabel: "Insane",
        format: "shorts",
    },
];

export function useOutlierSearch() {
    const [query, setQuery] = useState("");
    const [format, setFormat] = useState<FormatType>("longform");
    const [sortOption, setSortOption] = useState<SortOption>("relevance");

    const [filters, setFilters] = useState<OutlierFilters>({
        minViews: 0,
        maxViews: 1000000000, // 1B
        minDuration: 0,
        maxDuration: 86400, // 24h in seconds
    });

    const [isLoading, setIsLoading] = useState(false);

    // Parse duration "MM:SS" into seconds for filtering (simple parsing for the mock)
    const parseStrDurationToSeconds = (durationStr: string): number => {
        const parts = durationStr.split(":");
        if (parts.length === 2) {
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        if (parts.length === 3) {
            return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
        }
        return 0;
    };

    const filteredAndSortedVideos = useMemo(() => {
        let result = MOCK_VIDEOS.filter(video => video.format === format);

        if (query.trim() !== "") {
            const q = query.toLowerCase();
            result = result.filter(video =>
                video.title.toLowerCase().includes(q) ||
                video.channelName.toLowerCase().includes(q)
            );
        }

        result = result.filter(video => {
            const durationSecs = parseStrDurationToSeconds(video.duration);
            return (
                video.views >= filters.minViews &&
                video.views <= filters.maxViews &&
                durationSecs >= filters.minDuration &&
                durationSecs <= filters.maxDuration
            );
        });

        if (sortOption === "views") {
            result.sort((a, b) => b.views - a.views);
        } else if (sortOption === "relevance") {
            // For relevance, we'll sort by Outlier Score descending as a proxy
            result.sort((a, b) => b.outlierScore - a.outlierScore);
        }

        return result;
    }, [query, format, sortOption, filters]);

    // Simulate an API call search
    const handleSearch = (newQuery: string) => {
        setIsLoading(true);
        setQuery(newQuery);
        setTimeout(() => {
            setIsLoading(false);
        }, 600); // Fake delay
    };

    return {
        query,
        format,
        setFormat,
        sortOption,
        setSortOption,
        filters,
        setFilters,
        videos: filteredAndSortedVideos,
        isLoading,
        handleSearch,
    };
}

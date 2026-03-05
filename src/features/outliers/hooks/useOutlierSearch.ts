import { useState, useEffect } from "react";
import { OutlierVideo, OutlierFilters, FormatType, SortOption } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useOutlierSearch() {
    const [query, setQuery] = useState("");
    const [format, setFormat] = useState<FormatType>("longform");
    const [sortOption, setSortOption] = useState<SortOption>("relevance");

    const [filters, setFilters] = useState<OutlierFilters>({
        minViews: 0,
        maxViews: 1000000000, // 1B
        minDuration: 0,
        maxDuration: 86400, // 24h
        minOutlierScore: 0,
        maxSubscribers: 10000000,
        uploadDateRange: 'All'
    });

    const [videos, setVideos] = useState<OutlierVideo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Parse duration "MM:SS" into seconds
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

    const fetchOutliers = async (searchQuery: string, currentFormat: FormatType) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setVideos([]); // Reset videos while loading

        try {
            const { data, error } = await supabase.functions.invoke('youtube-outlier-search', {
                body: { query: searchQuery, format: currentFormat }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || "Error fetching outliers");

            setVideos(data.data || []);
        } catch (err: any) {
            console.error("Error in useOutlierSearch:", err);
            toast({
                title: "Error fetching data",
                description: err.message || "Could not retrieve outliers from YouTube.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger search when user presses Enter or clicks Search in the SearchHeader
    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
        if (newQuery.trim()) {
            fetchOutliers(newQuery, format);
        } else {
            setVideos([]);
        }
    };

    // Trigger fetch automatically when format toggles, but only if there is an active query
    useEffect(() => {
        if (query.trim()) {
            fetchOutliers(query, format);
        }
    }, [format]);

    // Client-side filtering and sorting for View Count and Duration (from the Filter Modal) and Sort header
    const filteredAndSortedVideos = videos.filter(video => {
        const durationSecs = parseStrDurationToSeconds(video.duration);

        const passOutlierScore = video.outlierScore >= (filters.minOutlierScore || 0);
        const passSubscribers = video.channelSubscribers <= (filters.maxSubscribers || 100000000);

        let passDate = true;
        if (filters.uploadDateRange && filters.uploadDateRange !== 'All') {
            const videoDate = new Date(video.publishedAt);
            if (!isNaN(videoDate.getTime())) {
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - videoDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (filters.uploadDateRange === 'This week') passDate = diffDays <= 7;
                if (filters.uploadDateRange === 'This month') passDate = diffDays <= 31;
                if (filters.uploadDateRange === 'This year') passDate = diffDays <= 365;
            }
        }

        return (
            video.views >= filters.minViews &&
            video.views <= filters.maxViews &&
            durationSecs >= filters.minDuration &&
            durationSecs <= filters.maxDuration &&
            passOutlierScore &&
            passSubscribers &&
            passDate
        );
    }).sort((a, b) => {
        if (sortOption === "views") {
            return b.views - a.views;
        } else {
            // Relevance -> Sort by outlierScore
            return b.outlierScore - a.outlierScore;
        }
    });

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

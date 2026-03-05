import { useState } from "react";
import { useOutlierSearch } from "../hooks/useOutlierSearch";
import { SearchHeader } from "../components/SearchHeader";
import { FormatSwitcher } from "../components/FormatSwitcher";
import { FilterModal } from "../components/FilterModal";
import { VideoGrid } from "../components/VideoGrid";

export default function OutlierSearchPage() {
    const {
        query,
        format,
        setFormat,
        sortOption,
        setSortOption,
        filters,
        setFilters,
        videos,
        isLoading,
        handleSearch,
    } = useOutlierSearch();

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 w-full relative">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Title */}
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Outlier Studio
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Discover trending outliers that break through the algorithm.
                    </p>
                </div>

                {/* Search & Main Controls */}
                <SearchHeader
                    query={query}
                    onSearch={handleSearch}
                    onFilterClick={() => setIsFilterModalOpen(true)}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                />

                {/* Layout with Sub-header and Results */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Found {videos.length} videos
                        </div>
                        <FormatSwitcher format={format} onChange={setFormat} />
                    </div>

                    <VideoGrid videos={videos} isLoading={isLoading} />
                </div>
            </div>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={setFilters}
            />
        </div>
    );
}

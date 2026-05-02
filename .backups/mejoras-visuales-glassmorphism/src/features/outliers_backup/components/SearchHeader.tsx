import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchHeaderProps {
    query: string;
    onSearch: (q: string) => void;
    onFilterClick: () => void;
    sortOption: string;
    onSortChange: (sort: "relevance" | "views") => void;
}

export function SearchHeader({ query, onSearch, onFilterClick, sortOption, onSortChange }: SearchHeaderProps) {
    const [localQuery, setLocalQuery] = useState(query);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearch(localQuery);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
            <div className="relative w-full md:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    type="text"
                    placeholder="misteries of highland"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus-visible:ring-primary"
                />
                {localQuery && (
                    <button
                        onClick={() => {
                            setLocalQuery("");
                            onSearch("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                    variant="outline"
                    onClick={onFilterClick}
                    className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
                >
                    <Filter className="w-4 h-4 mr-2 text-primary" /> Filter
                </Button>

                <div className="relative flex-shrink-0">
                    <select
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value as any)}
                        className="h-12 pl-10 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="relevance">Sort: Relevance</option>
                        <option value="views">Sort: View Count</option>
                    </select>
                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}

import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutlierFilters } from "../types";
import { useState } from "react";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: OutlierFilters;
    onApply: (f: OutlierFilters) => void;
}

export function FilterModal({ isOpen, onClose, filters, onApply }: FilterModalProps) {
    const [localFilters, setLocalFilters] = useState<OutlierFilters>(filters);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        const defaultFilters: OutlierFilters = {
            minViews: 0,
            maxViews: 1000000000,
            minDuration: 0,
            maxDuration: 86400,
            minOutlierScore: 0,
            maxSubscribers: 10000000,
            uploadDateRange: 'All'
        };
        setLocalFilters(defaultFilters);
        onApply(defaultFilters);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-950 rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">

                {/* Main Filters Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Filter</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Filter the results based on the following criteria.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* View count */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                            <h3 className="font-semibold text-sm mb-4">View count</h3>
                            <div className="relative pt-6 pb-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000000"
                                    step="10000"
                                    value={localFilters.maxViews}
                                    onChange={(e) => setLocalFilters({ ...localFilters, maxViews: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
                                    <span>0</span>
                                    <span>&gt;1B</span>
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                            <h3 className="font-semibold text-sm mb-4">Duration</h3>
                            <div className="relative pt-6 pb-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="86400"
                                    step="60"
                                    value={localFilters.maxDuration}
                                    onChange={(e) => setLocalFilters({ ...localFilters, maxDuration: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
                                    <span>0s</span>
                                    <span>&gt;24h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Outlier score */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative">
                            <h3 className="font-semibold text-sm mb-4">Min Outlier score</h3>
                            <div className="relative pt-6 pb-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={localFilters.minOutlierScore ?? 0}
                                    onChange={(e) => setLocalFilters({ ...localFilters, minOutlierScore: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
                                    <span>{localFilters.minOutlierScore ?? 0}x</span>
                                    <span>50x+</span>
                                </div>
                            </div>
                        </div>

                        {/* Subscriber count */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative">
                            <h3 className="font-semibold text-sm mb-4">Max Subscribers</h3>
                            <div className="relative pt-6 pb-2">
                                <input
                                    type="range"
                                    min="1000"
                                    max="10000000"
                                    step="50000"
                                    value={localFilters.maxSubscribers ?? 10000000}
                                    onChange={(e) => setLocalFilters({ ...localFilters, maxSubscribers: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
                                    <span>1K</span>
                                    <span>{localFilters.maxSubscribers && localFilters.maxSubscribers < 10000000 ? localFilters.maxSubscribers.toLocaleString() : "10M+"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload date */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
                        <h3 className="font-semibold text-sm mb-4">Upload date</h3>
                        <div className="flex flex-wrap gap-2">
                            {["All", "This week", "This month", "This year"].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setLocalFilters({ ...localFilters, uploadDateRange: label })}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${localFilters.uploadDateRange === label || (!localFilters.uploadDateRange && label === 'All') ? 'bg-primary text-primary-foreground shadow-glow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-8">
                        <Button variant="ghost" onClick={handleReset} className="font-bold">Reset</Button>
                        <Button className="font-bold px-8" onClick={handleApply}>Apply</Button>
                    </div>
                </div>

                {/* Sidebar Area (Presets) */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">My presets</h3>
                    <p className="text-xs text-slate-500 mb-6">Save filters for later.</p>

                    <button className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                        <span className="text-lg">+</span> Save current filters
                    </button>
                </div>
            </div>
        </div>
    );
}

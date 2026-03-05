import { FormatType } from "../types";
import { cn } from "@/lib/utils";

interface FormatSwitcherProps {
    format: FormatType;
    onChange: (f: FormatType) => void;
}

export function FormatSwitcher({ format, onChange }: FormatSwitcherProps) {
    return (
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
                onClick={() => onChange("longform")}
                className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    format === "longform"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                Longform
            </button>
            <button
                onClick={() => onChange("shorts")}
                className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    format === "shorts"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                Shorts
            </button>
        </div>
    );
}

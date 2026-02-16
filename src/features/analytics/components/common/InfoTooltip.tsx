import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
    title?: string;
    description: React.ReactNode;
    size?: "sm" | "default";
    className?: string;
}

export function InfoTooltip({ title, description, size = "default", className }: InfoTooltipProps) {
    return (
        <Popover>
            <PopoverTrigger>
                <Info
                    className={cn(
                        "text-muted-foreground/50 hover:text-purple-500 transition-colors cursor-pointer",
                        size === "sm" ? "w-3 h-3" : "w-4 h-4",
                        className
                    )}
                />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3 shadow-xl border-purple-100 dark:border-purple-900/20 bg-background/95 backdrop-blur z-50">
                {title && (
                    <h4 className="font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        {title}
                    </h4>
                )}
                <div className="space-y-2 text-xs text-muted-foreground">
                    {description}
                </div>
            </PopoverContent>
        </Popover>
    );
}

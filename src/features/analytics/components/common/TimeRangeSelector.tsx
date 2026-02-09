
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type TimeRange = '7d' | '28d' | '90d' | '365d' | 'all';

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
    disabled?: boolean;
}

export function TimeRangeSelector({ value, onChange, disabled }: TimeRangeSelectorProps) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as TimeRange)} disabled={disabled}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Periodo de tiempo" />
            </SelectTrigger>
            <SelectContent>

                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="28d">Últimos 28 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="365d">Últimos 365 días</SelectItem>
                <SelectItem value="all">Desde el principio</SelectItem>
            </SelectContent>
        </Select>
    );
}

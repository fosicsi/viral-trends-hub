
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";

interface Competitor {
    name: string;
    subs: string;
    avgViews: string;
    frequency: string;
    insight: string;
}

const competitors: Competitor[] = [
    { name: "CodeMaster", subs: "150k", avgViews: "25k", frequency: "Daily", insight: "High quantity, low retention." },
    { name: "TechNinja", subs: "85k", avgViews: "45k", frequency: "Weekly", insight: "Viral thumbnails, high CTR." },
    { name: "DevDaily", subs: "12k", avgViews: "3k", frequency: "Bi-weekly", insight: "Strong community, niche topics." },
];

export function CompetitorTable() {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inteligencia de Competencia</CardTitle>
                <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Canal</TableHead>
                            <TableHead>Subs</TableHead>
                            <TableHead>Vistas Prom.</TableHead>
                            <TableHead>Freq</TableHead>
                            <TableHead className="text-right">Nota Estratégica</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {competitors.map((comp) => (
                            <TableRow key={comp.name}>
                                <TableCell className="font-medium">{comp.name}</TableCell>
                                <TableCell className="text-muted-foreground">{comp.subs}</TableCell>
                                <TableCell>{comp.avgViews}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-normal text-xs">{comp.frequency}</Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs italic text-muted-foreground">
                                    "{comp.insight}"
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

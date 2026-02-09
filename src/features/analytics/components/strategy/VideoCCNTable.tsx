
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

export interface VideoCCN {
    id: string;
    title: string;
    type: "Core" | "Casual" | "New";
    views: number;
    performance: "High" | "Avg" | "Low";
}

interface VideoCCNTableProps {
    videos: VideoCCN[];
}

export function VideoCCNTable({ videos }: VideoCCNTableProps) {
    const getTypeColor = (type: string) => {
        switch (type) {
            case "Core": return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
            case "Casual": return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
            case "New": return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Rendimiento Reciente por Tipo</CardTitle>
                <Badge variant="outline">Últimos 5 Videos</Badge>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Video</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Vistas</TableHead>
                            <TableHead className="text-right">Rendimiento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {videos.map((video) => (
                            <TableRow key={video.id}>
                                <TableCell className="font-medium truncate max-w-[300px]" title={video.title}>
                                    {video.title}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`font-normal ${getTypeColor(video.type)}`}>
                                        {video.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{video.views.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <span className={
                                        video.performance === "High" ? "text-green-600 font-bold" :
                                            video.performance === "Low" ? "text-red-500" : "text-muted-foreground"
                                    }>
                                        {video.performance}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Upload, Image as ImageIcon, Type, Move, Eye } from "lucide-react";

export function ThumbnailPreview() {
    const [image, setImage] = useState<string | null>(null);
    const [title, setTitle] = useState("My Viral Video Title goes here...");
    const [channelName, setChannelName] = useState("My Channel");
    const [views, setViews] = useState("1.2M views");
    const [timeAgo, setTimeAgo] = useState("2 days ago");
    const [duration, setDuration] = useState("10:25");

    // Overlay settings
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            {/* Controls Sidebar */}
            <div className="lg:col-span-4 space-y-6">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Imagen de Fondo</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">Click to upload (1280x720)</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título del Video</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Vistas</Label>
                                <Input value={views} onChange={(e) => setViews(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tiempo</Label>
                                <Input value={timeAgo} onChange={(e) => setTimeAgo(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Duración</Label>
                            <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Nombre del Canal</Label>
                            <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-4">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Vista Previa (Modo Oscuro)
                    </h3>

                    {/* YouTube Card Simulation */}
                    <div className="max-w-[400px] mx-auto bg-[#0f0f0f] text-white rounded-xl overflow-hidden shadow-2xl">
                        {/* Thumbnail Container */}
                        <div className="relative aspect-video bg-gray-800 group cursor-pointer">
                            {image ? (
                                <img src={image} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <ImageIcon className="w-12 h-12 opacity-50" />
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-xs font-medium rounded text-white">
                                {duration}
                            </div>
                        </div>

                        {/* Metadata Container */}
                        <div className="p-3 flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-600 shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                                    {title}
                                </h4>
                                <div className="text-[#aaaaaa] text-xs">
                                    {channelName}
                                    <div className="flex items-center">
                                        <span>{views}</span>
                                        <span className="mx-1">•</span>
                                        <span>{timeAgo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-8">
                        Así es como se verá tu video en el feed de inicio de YouTube.
                    </p>
                </div>
            </div>
        </div>
    );
}

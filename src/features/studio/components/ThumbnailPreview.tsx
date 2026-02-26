import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Eye, Wand2, Loader2, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function ThumbnailPreview() {
    const [image, setImage] = useState<string | null>(null);
    const [title, setTitle] = useState("Viviendo en Argentina con $1 USD diario");
    const [channelName, setChannelName] = useState("CreatorHub");
    const [views, setViews] = useState("1.2M vistas");
    const [timeAgo, setTimeAgo] = useState("hace 2 días");
    const [duration, setDuration] = useState("10:25");

    // AI Generation state
    const [elements, setElements] = useState("Una moneda de dolar brillante, persona sorprendida");
    const [style, setStyle] = useState("Cinematic, 4k, hyperrealistic, eye-catching youtube thumbnail, high contrast");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!title.trim()) {
            toast({ title: "Título requerido", description: "El título es necesario para generar la miniatura visual.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setGeneratedImages([]);

        try {
            const { data, error } = await supabase.functions.invoke('ai-thumbnail-generator', {
                body: { title, elements, style }
            });

            if (error) throw error;

            if (data?.images && data.images.length > 0) {
                setGeneratedImages(data.images);
                setImage(data.images[0]); // Auto-select the first one
                toast({ title: "¡Magia Lista!", description: "Se generaron las opciones de miniatura con Nano Banana." });
            } else {
                throw new Error("No images generated");
            }

        } catch (e: any) {
            console.error("Error generating thumbnail:", e);
            toast({ title: "Error en Generación", description: e.message || "Hubo un error con Gemini Image API.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Controls Sidebar */}
            <div className="xl:col-span-4 space-y-6">
                <Card className="border-purple-500/30 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Generar con Nano Banana
                        </h3>
                        <p className="text-xs text-purple-100 opacity-90 mt-1">Usa Gemini 3 Pro Image para crear portadas de alto CTR con texto legible</p>
                    </div>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Título del Video (Aparecerá en la imagen)</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Así es el NUEVO iPhone" />
                        </div>
                        <div className="space-y-2">
                            <Label>Elementos Visuales</Label>
                            <Input value={elements} onChange={(e) => setElements(e.target.value)} placeholder="Ej: Explosión de fondo, cara de sorpresa" />
                        </div>
                        <div className="space-y-2">
                            <Label>Estilo Artístico</Label>
                            <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Ej: Cyberpunk, realista, anime..." />
                        </div>
                        <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generando magia (15-20s)...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Generar 3 Opciones
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>O subir manualmente</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
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

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Vistas</Label>
                                <Input value={views} onChange={(e) => setViews(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tiempo</Label>
                                <Input value={timeAgo} onChange={(e) => setTimeAgo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Duración</Label>
                                <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Canal</Label>
                                <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Area */}
            <div className="xl:col-span-8 space-y-6">

                {/* Generated Thumbnails Gallery */}
                {generatedImages.length > 0 && (
                    <div className="space-y-3">
                        <Label className="text-lg">Resultados (Selecciona uno)</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {generatedImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-4 transition-all hover:scale-105 ${image === img ? 'border-purple-500 shadow-xl shadow-purple-500/20' : 'border-transparent'}`}
                                    onClick={() => setImage(img)}
                                >
                                    <img src={img} alt={`Opción ${idx + 1}`} className="w-full h-full object-cover" />
                                    {image === img && (
                                        <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-lg">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-4">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Vista Previa (Modo Oscuro)
                    </h3>

                    <div className="max-w-[400px] mx-auto bg-[#0f0f0f] text-white rounded-xl overflow-hidden shadow-2xl">
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

                        <div className="p-3 flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-600 shrink-0 flex items-center justify-center text-xs font-bold">
                                {channelName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                                    {title}
                                </h4>
                                <div className="text-[#aaaaaa] text-xs">
                                    {channelName}
                                    <div className="flex items-center mt-0.5">
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

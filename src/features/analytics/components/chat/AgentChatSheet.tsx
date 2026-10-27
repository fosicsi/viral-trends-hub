import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Sparkles, 
    Send, 
    Loader2, 
    RotateCcw, 
    Bot, 
    User, 
    Copy, 
    Check, 
    Lightbulb, 
    Flame, 
    History,
    MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

const STORAGE_KEY = "magicaescocia_agent_chat_history";

const SUGGESTED_PROMPTS = [
    { label: "🔮 ¿Qué Short publicar mañana?", query: "¿Qué temática y ángulo de Short me recomiendas publicar mañana basándote en los videos que mejor funcionaron en mi canal?" },
    { label: "⚡ 3 Ganchos Magnéticos", query: "Dame 3 ganchos irresistibles (primeros 3 segundos) para un Short sobre una leyenda oscura escocesa." },
    { label: "🛡️ Copyright y Música", query: "¿Puedo usar fragmentos de canciones comerciales en mis Shorts sin recibir strikes ni perder monetización?" },
    { label: "🤖 Etiqueta de Contenido IA", query: "¿Cuándo es obligatorio marcar la casilla de contenido sintético o generado por IA según las normas de YouTube?" },
    { label: "⚠️ Contenido Reutilizado", query: "¿Cómo proteger mi canal de desmonetización por 'Contenido Reutilizado' si uso imágenes de archivo o generadas por IA?" },
    { label: "🔄 Guion en bucle (Loop)", query: "Escribe un guion de 20 segundos con técnica de bucle infinito (loop) sobre los castillos embrujados de Escocia." }
];

export function AgentChatSheet() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return [
            {
                id: "welcome",
                role: "assistant",
                content: "Hola. Soy tu **Estratega y Asesor de Políticas IA** para el canal. Conozco tu ADN editorial, tus métricas clave y las **políticas oficiales de YouTube** (copyright, fair use, monetización, contenido IA y buenas prácticas de Shorts). ¿En qué puedo orientarte o qué Short planificamos hoy?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ];
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOpenChat = (e: any) => {
            setOpen(true);
            if (e.detail?.query) {
                setTimeout(() => {
                    handleSendMessage(e.detail.query);
                }, 100);
            }
        };
        window.addEventListener('open-agent-chat', handleOpenChat);
        return () => window.removeEventListener('open-agent-chat', handleOpenChat);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (_) {}
    }, [messages]);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, open]);

    const handleSendMessage = async (textToSend?: string) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [...messages, userMsg];
        setMessages(updatedHistory);
        setInput("");
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa.");

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/channel-agent-chat`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                    "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
                    userMessage: query
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Error ${res.status}: ${errText}`);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || "No pude generar una respuesta en este momento.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (err: any) {
            console.error("AgentChat error:", err);
            toast.error(err.message || "Error al consultar al agente");
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `⚠️ Hubo un error al procesar tu consulta: ${err.message}. Por favor intenta de nuevo.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        const reset: ChatMessage[] = [
            {
                id: "welcome",
                role: "assistant",
                content: "Conversación reiniciada. ¿En qué te puedo ayudar hoy con el contenido de tu canal?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ];
        setMessages(reset);
        localStorage.removeItem(STORAGE_KEY);
        toast.info("Historial de conversación reiniciado");
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copiado al portapapeles");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <>
            {/* Floating button toggle at bottom-right */}
            <div className="fixed bottom-6 right-6 z-40">
                <Button
                    onClick={() => setOpen(true)}
                    className="rounded-full shadow-2xl h-12 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold gap-2 transition-transform hover:scale-105 border border-purple-400/30"
                >
                    <Sparkles className="w-4 h-4 fill-current animate-pulse text-amber-300" />
                    <span>Hablar con Agente IA</span>
                    <Badge variant="secondary" className="ml-1 bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">
                        Shorts Copilot
                    </Badge>
                </Button>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card border-border/60">
                    <SheetHeader className="px-5 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-bold flex items-center gap-2">
                                    Copiloto Estratega IA
                                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 bg-green-500/10">
                                        En vivo
                                    </Badge>
                                </SheetTitle>
                                <p className="text-[11px] text-muted-foreground">
                                    Asesor personalizado con acceso a tu ADN y videos de YouTube
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearHistory}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Limpiar chat"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    </SheetHeader>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0 mt-1">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                )}

                                <div className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground font-medium rounded-br-none'
                                        : 'bg-muted/40 border border-border/50 text-foreground rounded-bl-none shadow-sm'
                                }`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.content}
                                    </div>

                                    <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-current/10 text-[10px] opacity-70">
                                        <span>{msg.timestamp}</span>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                                className="hover:opacity-100 transition-opacity flex items-center gap-1"
                                                title="Copiar respuesta"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                                <span>Copiar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 justify-start items-center text-xs text-muted-foreground p-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                </div>
                                <span className="animate-pulse">Consultando métricas y redactando recomendación...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="px-4 py-2 bg-background/60 border-t border-border/40 shrink-0">
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(prompt.query)}
                                    disabled={loading}
                                    className="text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full bg-muted/60 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 border border-border/40 transition-colors shrink-0"
                                >
                                    {prompt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background/80 border-t border-border/50 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pregunta sobre ideas, ganchos, retención..."
                                disabled={loading}
                                className="bg-background text-sm rounded-xl h-11"
                            />
                            <Button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="rounded-xl h-11 px-4 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
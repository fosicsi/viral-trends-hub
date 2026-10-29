import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Flame,
  Zap,
  Target,
  Clapperboard,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Bot,
  Scale,
  Play,
  RotateCcw,
  Eye,
  Layers,
  ChevronRight,
  ShieldAlert,
  Youtube,
  Star,
  Users,
  Compass,
  FileText,
  Lock
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Glow Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] -left-40 w-[600px] h-[600px] bg-purple-600/10 blur-[160px] rounded-full" />
        <div className="absolute top-[60%] -right-40 w-[600px] h-[600px] bg-indigo-600/10 blur-[160px] rounded-full" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 shadow-md shadow-primary/25">
              <Flame className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                ViralTrends<span className="text-primary font-bold">.ai</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Creator SaaS
              </span>
            </div>
          </div>

          {/* Center Links (Anchors) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#outliers" className="hover:text-foreground transition-colors">
              Detector Outliers
            </a>
            <a href="#adn" className="hover:text-foreground transition-colors">
              ADN del Canal
            </a>
            <a href="#studio" className="hover:text-foreground transition-colors">
              Script Studio IA
            </a>
            <a href="/policies" className="hover:text-foreground transition-colors">
              Normas & Políticas
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Planes
            </a>
          </nav>

          {/* Right Action: Login / Register / Go to Dashboard */}
          <div className="flex items-center gap-2 sm:gap-3">
            {loadingSession ? (
              <div className="h-9 w-24 bg-muted/40 animate-pulse rounded-xl" />
            ) : session ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="rounded-xl h-10 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-semibold text-xs shadow-md shadow-primary/20 flex items-center gap-2"
              >
                <span>Ir al Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="rounded-xl h-9 px-3.5 text-xs font-semibold hover:bg-muted/60 text-foreground"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="rounded-xl h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <span>Comenzar Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release / Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>La primera suite impulsada por IA especializada 100% en YouTube Shorts</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08]">
          Multiplica las vistas de tus Shorts con{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Algoritmos Outliers
          </span>{" "}
          y Guiones en Bucle.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          ViralTrends Hub sincroniza tu canal de YouTube en tiempo real, detecta los videos que rinden 10x antes que tu competencia, calibra tu ADN editorial y genera guiones con retención &gt;80% cumpliendo las políticas oficiales de monetización.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate(session ? "/dashboard" : "/auth")}
            className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
          >
            <span>{session ? "Acceder a mi Dashboard" : "Conectar mi Canal Gratis"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/policies")}
            className="w-full sm:w-auto h-13 px-7 rounded-2xl border-border/80 bg-card/40 hover:bg-card text-foreground font-semibold text-base flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Ver Guía de Políticas de YouTube</span>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Sincronización Oficial YouTube API v3</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Auditoría de Retención & Viewed vs Swiped</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% Protegido contra Strikes y Desmonetización</span>
          </div>
        </div>

        {/* APP INTERACTIVE SHOWCASE PREVIEW */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl border border-border/80 bg-card/80 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 pb-3 px-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">viraltrends.ai/dashboard</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              Live Creator Workspace
            </Badge>
          </div>

          {/* Mock Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-left">
            <div className="p-4 rounded-2xl bg-background/60 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Viewed vs Swiped (VVS)</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-foreground">84.2%</div>
              <div className="text-[11px] text-emerald-500 flex items-center gap-1">
                <span>+14.8% por encima del benchmark de Shorts</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background/60 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Multiplicador Viral (Outliers)</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-foreground">14.6× Viral</div>
              <div className="text-[11px] text-muted-foreground">
                3 temas en tu nicho con baja competencia detectados
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background/60 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Auditoría de Copyright & IA</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">100% Seguro</div>
              <div className="text-[11px] text-muted-foreground">
                Sin reclamos de Content ID • Licencias verificadas
              </div>
            </div>
          </div>

          {/* Mock Video Producer Preview */}
          <div className="p-4 mx-4 mb-2 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/20 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  ⚡ Guion Optimizado con Técnica de Bucle Infinito (Loop)
                </span>
                <p className="text-sm font-medium text-foreground">
                  &ldquo;Nadie te contó esto sobre el Castillo de Glamis... y por eso la historia termina donde empezó...&rdquo;
                </p>
              </div>
              <Badge className="bg-purple-600 text-white shrink-0 text-xs py-1">
                22 segundos • 65 palabras
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS SECTION */}
      <section id="outliers" className="py-20 border-t border-border/40 relative z-10 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-primary">
              La Suite Completa para Creadores
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Diseñada para resolver los 4 mayores dolores al crear Shorts
            </p>
            <p className="text-muted-foreground text-sm sm:text-base">
              Dejar de adivinar qué publicar, cómo estructurar el guion y cómo proteger la cuenta de YouTube.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur-sm p-2 hover:border-primary/40 transition-all">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                  <Flame className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold">1. Detector de Outliers</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Encuentra videos que han superado por 5x a 20x el promedio de vistas de su propio canal. Detecta ángulos ganadores antes de que se saturen.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card id="adn" className="rounded-3xl border-border/60 bg-card/60 backdrop-blur-sm p-2 hover:border-primary/40 transition-all">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner">
                  <Target className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold">2. ADN Editorial & Loop</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  La IA calibra tu tono, duración exacta (20-25s) y asegura que la última palabra del Short enlace con la primera para lograr loops continuos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card id="studio" className="rounded-3xl border-border/60 bg-card/60 backdrop-blur-sm p-2 hover:border-primary/40 transition-all">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                  <Clapperboard className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold">3. Script Studio & Visuals</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Generación de paquetes de producción completos: guion percutante, ganchos visuales segundo a segundo y prompts para Google Flow y Nanobanana.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur-sm p-2 hover:border-primary/40 transition-all">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold">4. Guardián de Políticas</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Base de conocimiento oficial integrada. Evita desmonetización por contenido reutilizado, infracciones de música comercial y strikes de copyright.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* POLICY CENTER SPOTLIGHT */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-background to-purple-950/20 border border-indigo-500/20 p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                Exclusivo de ViralTrends Hub
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                La Columna Vertebral de Políticas y Cumplimiento de YouTube
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ninguna otra herramienta ayuda al creador a navegar las estrictas normas de YouTube. Con nuestro centro normativo puedes saber exactamente cuándo usar música comercial, cómo marcar contenido generado por IA y cómo evitar que tu canal sea clasificado como &ldquo;contenido reutilizado&rdquo;.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="text-xs px-3 py-1 rounded-full bg-background border border-border/60 text-muted-foreground">
                  ✓ Regla de Fair Use & Copyright
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-background border border-border/60 text-muted-foreground">
                  ✓ Content ID vs Strikes
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-background border border-border/60 text-muted-foreground">
                  ✓ Etiqueta de Contenido Sintético / IA
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-background border border-border/60 text-muted-foreground">
                  ✓ Algoritmo VVS y Retención
                </span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/policies")}
              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shrink-0 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>Explorar Centro de Políticas</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING / PLANS SECTION */}
      <section id="pricing" className="py-20 border-t border-border/40 relative z-10 bg-card/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-primary">
              Planes Flexibles
            </h2>
            <p className="text-3xl font-extrabold tracking-tight">
              Comienza gratis y escala con tu canal
            </p>
            <p className="text-sm text-muted-foreground">
              Conecta tu canal y accede de inmediato a las métricas clave y a la suite básica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="rounded-3xl border-border/60 bg-card/60 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold">Creador Starter</h4>
                  <p className="text-xs text-muted-foreground">Para comenzar a auditar tu canal.</p>
                </div>
                <div className="text-3xl font-black">$0 <span className="text-xs font-normal text-muted-foreground">/ mes</span></div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border/40">
                  <li className="flex items-center gap-2">✓ Sincronización de 1 canal de YouTube</li>
                  <li className="flex items-center gap-2">✓ Auditoría básica de Viewed vs Swiped</li>
                  <li className="flex items-center gap-2">✓ Centro de Políticas de YouTube completo</li>
                  <li className="flex items-center gap-2">✓ 5 búsquedas de Outliers por mes</li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="mt-6 rounded-xl w-full text-xs font-semibold"
              >
                Comenzar Gratis
              </Button>
            </Card>

            <Card className="rounded-3xl border-primary/50 bg-gradient-to-b from-primary/10 via-card/90 to-card p-6 flex flex-col justify-between relative shadow-xl shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-0.5">
                  Más Popular
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold">Creador Pro</h4>
                  <p className="text-xs text-muted-foreground">Para creadores comprometidos con el crecimiento.</p>
                </div>
                <div className="text-3xl font-black">$19 <span className="text-xs font-normal text-muted-foreground">/ mes</span></div>
                <ul className="space-y-2 text-xs text-foreground/90 pt-4 border-t border-border/40 font-medium">
                  <li className="flex items-center gap-2">✓ Sincronización continua de YouTube Analytics</li>
                  <li className="flex items-center gap-2">✓ Copiloto IA ilimitado con ADN de tu canal</li>
                  <li className="flex items-center gap-2">✓ Generador de Guiones con Bucle Infinito (Loop)</li>
                  <li className="flex items-center gap-2">✓ Búsqueda ilimitada de Outliers y Oportunidades</li>
                  <li className="flex items-center gap-2">✓ Auditoría preventiva contra Copyright & Strikes</li>
                </ul>
              </div>
              <Button
                onClick={() => navigate("/auth")}
                className="mt-6 rounded-xl w-full text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                Comenzar Prueba Pro
              </Button>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-card/60 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold">Studio & Agencia</h4>
                  <p className="text-xs text-muted-foreground">Para equipos gestionando múltiples canales.</p>
                </div>
                <div className="text-3xl font-black">$49 <span className="text-xs font-normal text-muted-foreground">/ mes</span></div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border/40">
                  <li className="flex items-center gap-2">✓ Hasta 5 canales simultáneos</li>
                  <li className="flex items-center gap-2">✓ ADN independiente por cada canal</li>
                  <li className="flex items-center gap-2">✓ Prompts de imagen (Flow / Nanobanana) exportables</li>
                  <li className="flex items-center gap-2">✓ Soporte prioritario y calibración guiada</li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="mt-6 rounded-xl w-full text-xs font-semibold"
              >
                Contactar Ventas
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER (With Mandatory Google OAuth Verification Links) */}
      <footer className="border-t border-border/40 bg-background/95 py-12 relative z-10 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Flame className="h-4 w-4 fill-white" />
            </div>
            <span className="font-bold text-foreground">ViralTrends.ai</span>
            <span>• Suite para Creadores de YouTube Shorts</span>
          </div>

          {/* Legal and Platform Navigation Links required by Google Cloud Audit */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <a href="/privacy" className="hover:text-primary transition-colors font-medium">
              Política de Privacidad
            </a>
            <a href="/terms" className="hover:text-primary transition-colors font-medium">
              Términos de Servicio
            </a>
            <a href="/policies" className="hover:text-primary transition-colors font-medium">
              Políticas de YouTube
            </a>
            <a href="/auth" className="hover:text-primary transition-colors font-medium">
              Iniciar Sesión
            </a>
            <a href="/llms.txt" className="hover:text-primary transition-colors font-mono text-[11px]">
              llms.txt
            </a>
          </div>

          <div className="text-center md:text-right">
            © {new Date().getFullYear()} ViralTrends Hub. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

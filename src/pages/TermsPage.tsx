import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, ArrowLeft, Shield, FileText, CheckCircle2, ExternalLink } from "lucide-react";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-md">
              <Flame className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-extrabold tracking-tight text-base sm:text-lg">ViralTrends.ai</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div className="space-y-3 border-b border-border/40 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <FileText className="w-4 h-4" />
            Última actualización: 29 de octubre de 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Términos de Servicio</h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Al acceder o utilizar <strong>ViralTrends Hub (ViralTrends.ai)</strong>, aceptas cumplir con los presentes Términos de Servicio y con todas las leyes y regulaciones aplicables.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">1. Descripción del Servicio</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ViralTrends Hub es una plataforma SaaS diseñada para asistir a creadores de contenido y agencias de video vertical (YouTube Shorts) mediante analítica de retención, detección de outliers, calibración de tono editorial y generación de guiones con técnica de bucle infinito e inteligencia artificial.
          </p>
        </section>

        {/* Section 2: YouTube Terms of Service compliance */}
        <section className="space-y-4 p-5 rounded-2xl bg-card border border-border/60">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            2. Cumplimiento de las Condiciones del Servicio de YouTube
          </h2>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            ViralTrends Hub utiliza los Servicios de la API de YouTube. Al utilizar las funciones de integración con YouTube de nuestra plataforma, aceptas expresamente quedar sujeto a las{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold"
            >
              Condiciones de Servicio de YouTube <ExternalLink className="w-3 h-3" />
            </a>{" "}
            y a la{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold"
            >
              Política de Privacidad de Google <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. Propiedad Intelectual del Creador</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todo el contenido, guiones, conceptos, descripciones y prompts generados a través de tu cuenta de ViralTrends Hub pertenecen al 100% al usuario creador. ViralTrends Hub no reclama ningún derecho de propiedad ni autoría sobre los videos o guiones que publiques en tus canales.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Uso Aceptable y Cumplimiento Normativo</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El usuario se compromete a no utilizar la plataforma para:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <li>Generar contenido de odio, difamatorio, ilegal o que infrinja derechos de autor de terceros.</li>
            <li>Generar deepfakes no autorizados o material sintético engañoso sin cumplir con las declaraciones obligatorias de YouTube.</li>
            <li>Realizar scraping no autorizado ni intentar saturar las APIs de YouTube mediante automatizaciones abusivas.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">5. Limitación de Responsabilidad</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ViralTrends Hub proporciona herramientas analíticas y de generación asistida. No garantizamos un número específico de vistas o suscriptores, ya que el desempeño final depende del algoritmo de YouTube y las decisiones editoriales del propio creador.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ViralTrends Hub. Todos los derechos reservados.
      </footer>
    </div>
  );
}

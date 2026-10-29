import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, ArrowLeft, ShieldCheck, Lock, Eye, Database, RefreshCw, ExternalLink } from "lucide-react";

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Última actualización: 29 de octubre de 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Política de Privacidad</h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            En <strong>ViralTrends Hub (ViralTrends.ai)</strong> nos tomamos muy en serio la privacidad de los creadores y la seguridad de sus datos. Esta política describe cómo recopilamos, utilizamos y protegemos la información cuando utilizas nuestra plataforma y conectas tu canal de YouTube.
          </p>
        </div>

        {/* Google API Limited Use Disclosure Box (Required for Google Verification) */}
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/25 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
            <Lock className="w-5 h-5 text-primary" />
            <span>Declaración de Uso Limitado de la API de Google (Google API Services User Data Policy)</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            El uso y la transferencia que hace ViralTrends Hub a cualquier otra aplicación de la información recibida a través de las APIs de Google y YouTube se apegan estrictamente a la{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold"
            >
              Política de Datos de Usuario de los Servicios de API de Google <ExternalLink className="w-3 h-3" />
            </a>
            , incluidos los requisitos de <strong>Uso Limitado (Limited Use)</strong>.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            1. Datos que Recopilamos a través de YouTube API
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cuando decides voluntariamente conectar tu canal mediante autenticación segura de Google OAuth 2.0, solicitamos exclusivamente permisos de <strong>solo lectura (read-only)</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Identificación del Canal:</strong> Nombre del canal, ID de canal, avatar y conteo público de suscriptores (a través de <code>youtube.readonly</code>).
            </li>
            <li>
              <strong className="text-foreground">Métricas de Rendimiento de Shorts:</strong> Vistas agregadas, porcentaje promedio de reproducción (retención), ratio de videos vistos frente a deslizados (Viewed vs. Swiped - VVS) y minutos vistos en periodos de 7 a 28 días (a través de <code>yt-analytics.readonly</code>).
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>Nunca</strong> solicitamos ni tenemos acceso a permisos de escritura, administración de canal, subida o borrado de videos, datos de facturación de Google ni acceso a tus contraseñas personales.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            2. Finalidad del Uso de los Datos
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Los datos obtenidos se utilizan de manera exclusiva para:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <li>Calcular el ratio de retención y la cadencia óptima de tus Shorts dentro de tu propio panel de analítica.</li>
            <li>Calibrar el ADN editorial de tu canal en el Creator Studio para generar guiones personalizados de 20 a 25 segundos.</li>
            <li>Detectar cuáles de tus videos pasados obtuvieron mayor tracción orgánica para sugerirte nuevas ideas de contenido afines.</li>
          </ul>
          <div className="p-4 rounded-xl bg-card border border-border/60 text-xs sm:text-sm text-foreground/90 font-medium">
            🚫 <strong>Garantía de no transferencia:</strong> Tus métricas de YouTube <strong>NUNCA</strong> se venden, no se comparten con terceros ni se utilizan para entrenar modelos fundacionales de Inteligencia Artificial de acceso público.
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" />
            3. Retención, Almacenamiento y Revocación de Acceso
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Puedes revocar el acceso de ViralTrends Hub a tu canal de YouTube en cualquier instante mediante dos vías:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              Haciendo clic en el botón <strong>&ldquo;Desconectar Canal&rdquo;</strong> en la pestaña de <code>/integrations</code> dentro de la aplicación.
            </li>
            <li>
              Directamente desde tu cuenta de Google en la página de{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Permisos de Cuentas de Google
              </a>
              .
            </li>
          </ol>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Al revocar el acceso, los tokens de sesión se eliminan inmediatamente de nuestra base de datos segura y no se realizarán más consultas a la API de YouTube.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Contacto de Privacidad</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para dudas sobre el manejo de tus datos, solicitudes de eliminación completa de cuenta o cuestiones de privacidad, puedes contactar a nuestro equipo de soporte en:{" "}
            <a href="mailto:privacy@viraltrends.ai" className="text-primary font-semibold underline">
              privacy@viraltrends.ai
            </a>
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

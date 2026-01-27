 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useAuth } from "@/hooks/useAuth";
 import { useNavigate } from "react-router-dom";
 import { Zap, TrendingUp, Search, Target, CheckCircle2, Star } from "lucide-react";
 
 export default function Landing() {
   const { user, signInWithGoogle } = useAuth();
   const navigate = useNavigate();
 
   if (user) {
     navigate("/app");
     return null;
   }
 
   const handleGetStarted = async () => {
     try {
       await signInWithGoogle();
     } catch (error) {
       console.error("Error signing in:", error);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       {/* Hero Section */}
       <section className="relative overflow-hidden bg-hero-field">
         <div className="container mx-auto px-6 py-20 md:py-32">
           <div className="max-w-4xl mx-auto text-center">
             <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
               <Zap className="w-3 h-3 mr-1" />
               Inteligencia Viral Avanzada
             </Badge>
             
             <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-fade-in">
               Encuentra temas virales antes de que se agoten
             </h1>
             
             <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in">
               Descubre contenido con potencial viral en YouTube antes que tu competencia. 
               Análisis impulsado por IA para creadores inteligentes.
             </p>
             
             <Button
               size="lg"
               onClick={handleGetStarted}
               className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow text-lg px-8 py-6 animate-fade-in"
             >
               Empezar con Google
             </Button>
           </div>
         </div>
       </section>
 
       {/* Features Section */}
       <section className="py-20 bg-surface">
         <div className="container mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-bold mb-4">
               Características Potentes
             </h2>
             <p className="text-xl text-muted-foreground">
               Todo lo que necesitas para encontrar y crear contenido viral
             </p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="border-border bg-card hover:shadow-glow transition-shadow">
               <CardHeader>
                 <Search className="w-10 h-10 text-primary mb-3" />
                 <CardTitle>Búsqueda Inteligente</CardTitle>
               </CardHeader>
               <CardContent>
                 <CardDescription>
                   Encuentra videos con alto potencial viral usando filtros avanzados de vistas, suscriptores y fechas.
                 </CardDescription>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card hover:shadow-glow transition-shadow">
               <CardHeader>
                 <Zap className="w-10 h-10 text-accent mb-3" />
                 <CardTitle>IA Generativa</CardTitle>
               </CardHeader>
               <CardContent>
                 <CardDescription>
                   Genera temas virales automáticamente con nuestra IA especializada en tendencias de contenido.
                 </CardDescription>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card hover:shadow-glow transition-shadow">
               <CardHeader>
                 <TrendingUp className="w-10 h-10 text-brand-2 mb-3" />
                 <CardTitle>Análisis Viral</CardTitle>
               </CardHeader>
               <CardContent>
                 <CardDescription>
                   Identifica videos con ratio de crecimiento excepcional para replicar su éxito.
                 </CardDescription>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card hover:shadow-glow transition-shadow">
               <CardHeader>
                 <Target className="w-10 h-10 text-primary mb-3" />
                 <CardTitle>Filtros Precisos</CardTitle>
               </CardHeader>
               <CardContent>
                 <CardDescription>
                   Filtra por tipo de contenido (Shorts, medio, largo) y encuentra exactamente lo que buscas.
                 </CardDescription>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
 
       {/* Pricing Section */}
       <section className="py-20">
         <div className="container mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-bold mb-4">
               Planes y Precios
             </h2>
             <p className="text-xl text-muted-foreground">
               Elige el plan perfecto para tu estrategia de contenido
             </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <Card className="border-border bg-card">
               <CardHeader>
                 <CardTitle className="text-2xl">Básico</CardTitle>
                 <div className="mt-4">
                   <span className="text-4xl font-bold">$19</span>
                   <span className="text-muted-foreground">/mes</span>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>100 búsquedas mensuales</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Filtros básicos</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Guardar hasta 50 videos</span>
                 </div>
                 <Button className="w-full mt-6" variant="outline" disabled>
                   Próximamente
                 </Button>
               </CardContent>
             </Card>
             
             <Card className="border-primary bg-card shadow-glow relative">
               <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                 Más Popular
               </Badge>
               <CardHeader>
                 <CardTitle className="text-2xl">Pro</CardTitle>
                 <div className="mt-4">
                   <span className="text-4xl font-bold">$49</span>
                   <span className="text-muted-foreground">/mes</span>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Búsquedas ilimitadas</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Todos los filtros avanzados</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>IA generativa ilimitada</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Videos guardados ilimitados</span>
                 </div>
                 <Button className="w-full mt-6 bg-primary hover:bg-primary/90" disabled>
                   Próximamente
                 </Button>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card">
               <CardHeader>
                 <CardTitle className="text-2xl">Empresa</CardTitle>
                 <div className="mt-4">
                   <span className="text-4xl font-bold">$199</span>
                   <span className="text-muted-foreground">/mes</span>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Todo de Pro +</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Equipos múltiples</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>API dedicada</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                   <span>Soporte prioritario</span>
                 </div>
                 <Button className="w-full mt-6" variant="outline" disabled>
                   Próximamente
                 </Button>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
 
       {/* Testimonials Section */}
       <section className="py-20 bg-surface">
         <div className="container mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-bold mb-4">
               Lo Que Dicen Nuestros Usuarios
             </h2>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <Card className="border-border bg-card">
               <CardHeader>
                 <div className="flex gap-1 mb-2">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                   ))}
                 </div>
                 <CardDescription className="text-foreground text-base">
                   "Esta herramienta cambió completamente mi estrategia de contenido. 
                   Ahora puedo identificar tendencias antes que nadie."
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="font-semibold">María González</p>
                 <p className="text-sm text-muted-foreground">Creadora de Contenido</p>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card">
               <CardHeader>
                 <div className="flex gap-1 mb-2">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                   ))}
                 </div>
                 <CardDescription className="text-foreground text-base">
                   "La IA generativa es increíble. Me ahorra horas de investigación 
                   y siempre encuentra temas con potencial."
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="font-semibold">Carlos Ruiz</p>
                 <p className="text-sm text-muted-foreground">YouTuber 500K subs</p>
               </CardContent>
             </Card>
             
             <Card className="border-border bg-card">
               <CardHeader>
                 <div className="flex gap-1 mb-2">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                   ))}
                 </div>
                 <CardDescription className="text-foreground text-base">
                   "Resultados increíbles. Mis últimos 3 videos superaron 1M de vistas 
                   gracias a los insights de esta plataforma."
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="font-semibold">Ana Martínez</p>
                 <p className="text-sm text-muted-foreground">Marketing Digital</p>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
 
       {/* Footer CTA */}
       <section className="py-20 bg-hero-field">
         <div className="container mx-auto px-6 text-center">
           <h2 className="text-4xl md:text-5xl font-bold mb-6">
             ¿Listo para crear contenido viral?
           </h2>
           <p className="text-xl text-muted-foreground mb-10">
             Únete a miles de creadores que ya están descubriendo tendencias virales
           </p>
           <Button
             size="lg"
             onClick={handleGetStarted}
             className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow text-lg px-8 py-6"
           >
             Empezar Gratis con Google
           </Button>
         </div>
       </section>
     </div>
   );
 }
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, TrendingUp, Search, Compass, Zap, Target,
  Flame, Brain, Lightbulb, ArrowRight, Play, BookOpen,
  Magic, Telescope, Video, BarChart3, Users, Clock,
  ChevronRight, Star, Crown, Gem, Rocket, Award,
  Wand2, Hash, MessageSquare, LineChart, Tv
} from "lucide-react";
import { toast } from 'sonner';

// Tipos
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  badge?: string;
  onClick: () => void;
}

interface DiscoveryCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  stats: { label: string; value: string }[];
  color: string;
}

interface EnhancedDashboardProps {
  onNavigate: (view: string) => void;
  onQuickFilter: (type: string, niche?: string) => void;
  userName?: string;
}

export function EnhancedDashboard({ onNavigate, onQuickFilter, userName }: EnhancedDashboardProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  // Acciones rápidas que generan curiosidad
  const quickActions: QuickAction[] = [
    {
      id: 'discover',
      title: 'Descubrir Joyas Ocultas',
      description: 'Encontrá videos de canales pequeños con millones de views',
      icon: <Telescope className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-600',
      gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      badge: 'Popular',
      onClick: () => onQuickFilter('joya oculta', '')
    },
    {
      id: 'ai-opportunities',
      title: 'Oportunidades con IA',
      description: 'La IA analiza tu nicho y encuentra gaps de contenido',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-600',
      gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      badge: 'Nuevo',
      onClick: () => onNavigate('viral')
    },
    {
      id: 'trending',
      title: 'Ver Tendencias Ahora',
      description: 'Qué está explotando en YouTube esta semana',
      icon: <Flame className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600',
      gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
      onClick: () => onQuickFilter('shorts', '')
    },
    {
      id: 'script-assistant',
      title: 'Asistente de Guiones IA',
      description: 'Generá guiones completos con hook, body y CTA',
      icon: <Wand2 className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-600',
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      badge: 'Pro',
      onClick: () => onNavigate('saved')
    },
    {
      id: 'analytics',
      title: 'Analizar Competencia',
      description: 'Descubrí qué les funciona a otros creadores',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      onClick: () => onNavigate('videos')
    },
    {
      id: 'content-plan',
      title: 'Plan de Contenidos',
      description: 'Organizá tus ideas y creá un calendario',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      onClick: () => onNavigate('saved')
    }
  ];

  // Cards de descubrimiento
  const discoveryCards: DiscoveryCard[] = [
    {
      id: 'viral-predictor',
      title: 'Predecir el Próximo Viral',
      subtitle: 'Algoritmo de señales',
      description: 'Nuestro sistema analiza patrones de engagement para predecir qué videos tienen potencial viral antes de que exploten.',
      icon: <Sparkles className="w-8 h-8" />,
      stats: [
        { label: 'Precisión', value: '87%' },
        { label: 'Videos analizados', value: '2.4M+' }
      ],
      color: 'violet'
    },
    {
      id: 'niche-mining',
      title: 'Minar Nichos Dorados',
      subtitle: 'Oportunidades sin explotar',
      description: 'Encontrá micro-nichos con alta demanda y poca competencia donde podés dominar rápidamente.',
      icon: <Gem className="w-8 h-8" />,
      stats: [
        { label: 'Nichos activos', value: '150+' },
        { label: 'Oportunidades/día', value: '12' }
      ],
      color: 'emerald'
    },
    {
      id: 'script-ai',
      title: 'Guiones que Enganchan',
      subtitle: 'Powered by Claude',
      description: 'La IA estudia los comentarios de videos virales para generar guiones con hooks irresistibles.',
      icon: <MessageSquare className="w-8 h-8" />,
      stats: [
        { label: 'Guiones generados', value: '8.2K' },
        { label: 'Tasa de éxito', value: '73%' }
      ],
      color: 'cyan'
    }
  ];

  // Features del asistente IA
  const aiFeatures = [
    { icon: <Target className="w-5 h-5" />, text: 'Hooks basados en comentarios reales' },
    { icon: <Hash className="w-5 h-5" />, text: 'Hashtags optimizados para SEO' },
    { icon: <LineChart className="w-5 h-5" />, text: 'Estructura probada de retención' },
    { icon: <Video className="w-5 h-5" />, text: 'Prompts para thumbnails con Midjourney' },
    { icon: <Clock className="w-5 h-5" />, text: 'Timing óptimo de publicación' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 py-8"
        >
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge
              variant="secondary"
              className="px-4 py-1.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-300 hover:from-violet-500/30 hover:to-fuchsia-500/30 transition-all cursor-pointer"
              onClick={() => toast.success('🎉 ¡Bienvenido a la nueva experiencia!')}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Nueva experiencia disponible
            </Badge>
          </motion.div>

          {/* Headline principal */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                {greeting},
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Creador
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Descubrí qué contenido está explotando ahora mismo y creá guiones virales con IA en minutos.
            </motion.p>
          </div>

          {/* Stats rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>2.4M videos analizados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span>8,200 guiones generados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>150+ nichos activos</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* QUICK ACTIONS GRID */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Compass className="w-5 h-5 text-violet-400" />
            ¿Por dónde empezar?
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Elegí tu aventura creativa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredCard(action.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={action.onClick}
              className={`group relative overflow-hidden rounded-2xl border border-white/10
                         bg-gradient-to-br ${action.gradient} backdrop-blur-sm
                         p-6 cursor-pointer transition-all duration-300
                         hover:border-white/20 hover:shadow-2xl hover:shadow-${action.color.split('-')[1]}-500/20`}
            >
              {/* Efecto de brillo en hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0
                           group-hover:opacity-10 transition-opacity duration-500`}
              />

              {/* Badge */}
              {action.badge && (
                <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold
                               bg-gradient-to-r ${action.color} text-white shadow-lg`}>
                  {action.badge}
                </div>
              )}

              {/* Icono */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color}
                             flex items-center justify-center text-white shadow-lg mb-4
                             group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                {action.icon}
              </div>

              {/* Contenido */}
              <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/80 transition-colors">
                {action.description}
              </p>

              {/* Flecha que aparece */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: hoveredCard === action.id ? 1 : 0, x: hoveredCard === action.id ? 0 : -10 }}
                className="absolute bottom-4 right-4"
              >
                <ArrowRight className="w-5 h-5 text-white/60" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DISCOVERY CARDS - Lo que hace única a la app */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h2 className="text-xl font-bold">Descubrí el poder de la plataforma</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {discoveryCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.15 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl overflow-hidden border border-white/10
                         bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm
                         hover:border-white/20 transition-all duration-500"
            >
              {/* Header con gradiente */}
              <div className={`h-32 bg-gradient-to-br from-${card.color}-500/30 to-${card.color}-600/10
                             flex items-center justify-center relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-${card.color}-500/20 to-transparent`} />
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${card.color}-400 to-${card.color}-600
                             flex items-center justify-center text-white shadow-2xl`}
                >
                  {card.icon}
                </motion.div>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {card.subtitle}
                  </p>
                  <h3 className="text-xl font-bold">{card.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>

                {/* Stats */}
                <div className="flex gap-4 pt-2">
                  {card.stats.map((stat, i) => (
                    <div key={i}>
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI SCRIPT ASSISTANT SECTION */}
      <section className="relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="rounded-3xl overflow-hidden border border-cyan-500/30
                     bg-gradient-to-br from-cyan-950/50 via-slate-900/50 to-violet-950/50
                     backdrop-blur-xl p-8 md:p-12 relative"
        >
          {/* Efectos de fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            {/* Lado izquierdo - Contenido */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600
                               flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  <Zap className="w-3 h-3 mr-1" /> Powered by Claude AI
                </Badge>
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                    Asistente de Guiones IA
                  </span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  No te quedes mirando una pantalla en blanco. Nuestra IA analiza videos virales
                  de tu nicho y genera guiones completos con estructura probada.
                </p>
              </div>

              {/* Features list */}
              <div className="grid gap-3">
                {aiFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.7 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      {feature.icon}
                    </div>
                    <span className="text-muted-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => onNavigate('saved')}
                className="rounded-full px-8 bg-gradient-to-r from-cyan-500 to-blue-600
                           hover:from-cyan-600 hover:to-blue-700 text-white font-bold
                           shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Probar Asistente IA
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Lado derecho - Preview visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8 }}
              className="relative hidden md:block"
            >
              <div className="relative bg-slate-900/80 rounded-2xl border border-cyan-500/20 p-6 shadow-2xl">
                {/* Mock de generación de guion */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 mb-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Generando guion viral...
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30">
                      <p className="text-xs text-amber-400 font-bold mb-1">HOOK (0-3s)</p>
                      <p className="text-sm text-white/90 italic">
                        "Te mostré este error durante 3 meses y nadie lo notó... hasta ahora"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                      <p className="text-xs text-muted-foreground font-bold mb-1">BODY</p>
                      <p className="text-sm text-white/70">
                        Revelación del problema + Storytelling personal + Solución...
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30">
                      <p className="text-xs text-violet-400 font-bold mb-1">CTA</p>
                      <p className="text-sm text-white/90">
                        "Seguime para más tips que no te cuentan los grandes"
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['#viral', '#tips', '#secrets', '#growth'].map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Final */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="text-center py-8"
      >
        <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground px-4">
            ¿Listo para tu próximo video viral?
          </p>
          <Button
            onClick={() => onQuickFilter('shorts', '')}
            className="rounded-full px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-500/30"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Empezar Ahora
          </Button>
        </div>
      </motion.section>
    </div>
  );
}

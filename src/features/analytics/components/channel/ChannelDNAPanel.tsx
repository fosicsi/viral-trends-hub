import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dna, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChannelDNA {
  canal: string;
  pilares: string;
  tono: string;
  duracion_objetivo: string;
  gancho_favorito: string;
  publico_objetivo: string;
  // Legacy fields kept
  tema_principal?: string;
  estilo?: string;
  formato_dominante?: string;
}

const DEFAULT_DNA: ChannelDNA = {
  canal: '',
  pilares: '',
  tono: '',
  duracion_objetivo: '20-30s',
  gancho_favorito: 'Pregunta retórica',
  publico_objetivo: '',
};

export function ChannelDNAPanel() {
  const [dna, setDna] = useState<ChannelDNA>(DEFAULT_DNA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    loadDNA();
  }, []);

  async function loadDNA() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_channel_identities')
        .select('identity_profile')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.identity_profile) {
        const profile = data.identity_profile as ChannelDNA;
        setDna({
          canal: profile.canal || '',
          pilares: profile.pilares || '',
          tono: profile.tono || '',
          duracion_objetivo: profile.duracion_objetivo || '20-30s',
          gancho_favorito: profile.gancho_favorito || 'Pregunta retórica',
          publico_objetivo: profile.publico_objetivo || '',
          tema_principal: profile.tema_principal,
          estilo: profile.estilo,
          formato_dominante: profile.formato_dominante,
        });
        setIsConfigured(!!profile.canal);
      }
    } catch (err) {
      console.error('Error loading channel DNA:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveDNA() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { error } = await supabase
        .from('user_channel_identities')
        .upsert({
          user_id: session.user.id,
          identity_profile: dna,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setIsConfigured(!!dna.canal);
      toast.success('¡ADN del canal guardado correctamente!');
    } catch (err: unknown) {
      const sb = err as { message?: string; details?: string; hint?: string };
      const message = sb?.message || sb?.details || (err instanceof Error ? err.message : 'Error desconocido');
      console.error('saveDNA error:', err);
      toast.error(`Error al guardar: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  const update = (field: keyof ChannelDNA, value: string) =>
    setDna(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dna className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">ADN del Canal</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define la identidad de tu canal para que la IA genere contenido más preciso
            </p>
          </div>
        </div>
        {isConfigured ? (
          <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10">
            ✓ ADN configurado
          </Badge>
        ) : (
          <Badge variant="outline" className="border-orange-500/50 text-orange-600 bg-orange-500/10">
            Sin configurar
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Canal */}
        <div className="space-y-1.5">
          <Label htmlFor="canal" className="text-sm font-medium">
            Nombre del canal
          </Label>
          <Input
            id="canal"
            placeholder="@magicaescocia"
            value={dna.canal}
            onChange={e => update('canal', e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Pilares de contenido */}
        <div className="space-y-1.5">
          <Label htmlFor="pilares" className="text-sm font-medium">
            Pilares de contenido
          </Label>
          <Textarea
            id="pilares"
            placeholder="Historia escocesa, Mitología celta, Folklore misterioso, Brujas y leyendas"
            value={dna.pilares}
            onChange={e => update('pilares', e.target.value)}
            className="bg-background resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">Separa los pilares con comas</p>
        </div>

        {/* Tono de voz */}
        <div className="space-y-1.5">
          <Label htmlFor="tono" className="text-sm font-medium">
            Tono de voz
          </Label>
          <Textarea
            id="tono"
            placeholder="Narrador omnisciente, dramático, frases cortas, misterioso"
            value={dna.tono}
            onChange={e => update('tono', e.target.value)}
            className="bg-background resize-none"
            rows={2}
          />
        </div>

        {/* Duración objetivo + Gancho favorito (grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Duración objetivo</Label>
            <Select
              value={dna.duracion_objetivo}
              onValueChange={val => update('duracion_objetivo', val)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15-20s">15–20 segundos</SelectItem>
                <SelectItem value="20-30s">20–30 segundos</SelectItem>
                <SelectItem value="30-60s">30–60 segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Gancho favorito</Label>
            <Select
              value={dna.gancho_favorito}
              onValueChange={val => update('gancho_favorito', val)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar gancho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pregunta retórica">Pregunta retórica</SelectItem>
                <SelectItem value="Dato sorprendente">Dato sorprendente</SelectItem>
                <SelectItem value="Afirmación polémica">Afirmación polémica</SelectItem>
                <SelectItem value="Revelación gradual">Revelación gradual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Público objetivo */}
        <div className="space-y-1.5">
          <Label htmlFor="publico" className="text-sm font-medium">
            Público objetivo
          </Label>
          <Input
            id="publico"
            placeholder="Adultos 25-45 años, amantes de la historia y el misterio"
            value={dna.publico_objetivo}
            onChange={e => update('publico_objetivo', e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Save button */}
        <Button
          onClick={saveDNA}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar ADN
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

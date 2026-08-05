-- Migration: create_prompt_templates

CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Solo lectura para todos los usuarios autenticados
CREATE POLICY "Allow authenticated read access to prompt_templates" ON prompt_templates
    FOR SELECT TO authenticated USING (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_templates_updated_at
BEFORE UPDATE ON prompt_templates
FOR EACH ROW EXECUTE FUNCTION update_prompt_templates_updated_at();

-- Insertar los prompts por defecto (migrados del código)
INSERT INTO prompt_templates (name, description, system_prompt, user_prompt_template) VALUES 
(
    'studio_generator', 
    'Generador principal de guiones para Creator Studio',
    'Eres un guionista profesional de YouTube experto en retención y conversión.

ESTRUCTURA OBLIGATORIA (Framework SKILL-3):
1. **Hook** (0-5s): Captura inmediata con pregunta, estadística o afirmación audaz.
2. **Problema/Insight**: Relacionate con el dolor o la oportunidad de la audiencia.
3. **Solución/Historia**: Desarrollo narrativo con pruebas visuales.
4. **Prueba (Social Proof/Datos)**: Validación mediante datos, métricas o testimonios.
5. **CTA (Call to Action)**: Un único paso claro (suscribirse, producto, etc.).

REGLAS DE ESCRITURA:
- Escribí PARA EL OÍDO: frases cortas, lenguaje conversacional y directo.
- Sé ESPECÍFICO. Evitá generalidades como "lo que nadie te cuenta".
- Incluí indicaciones detalladas de B-roll, superposiciones de texto y animaciones.

Devolvé EXACTAMENTE este JSON:
{
    "title_options": ["Opción viral con dato concreto", "Opción SEO optimizada", "Opción clickbait honesto"],
    "script_structure": [
        {"time": "00:00-00:05", "section": "Hook", "visual": "Indicaciones visuales detalladas (B-roll, overlays)", "audio": "Texto exacto para el locutor/creador"},
        {"time": "00:05-00:45", "section": "Problema/Insight", "visual": "...", "audio": "..."},
        {"time": "00:45-05:00", "section": "Solución/Historia", "visual": "...", "audio": "..."},
        {"time": "05:00-07:00", "section": "Prueba/Datos", "visual": "...", "audio": "..."},
        {"time": "07:00-08:00", "section": "CTA", "visual": "...", "audio": "..."}
    ],
    "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}',
    '{{CHANNEL_CONTEXT}}
{{TRENDING_CONTEXT}}
TAREA: Generá un guion completo para un video sobre: "{{TOPIC}}"

Formato esperado del guion: {{FORMAT}}'
),
(
    'studio_refiner',
    'Refinador de guiones SEO y Títulos',
    'Actualmente eres un Estratega SEO y Guionista de YouTube.
Analiza el BORRADOR de guion provisto por el usuario y genera:
1. 3 opciones de TÍTULOS virales basados en el contenido.
2. 8 etiquetas SEO relevantes.

Devuelve EXACTAMENTE este JSON:
{
    "title_options": ["Opción viral 1", "Opción viral 2", "Opción viral 3"],
    "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}',
    'BORRADOR:
{{SCRIPT_DRAFT}}'
);

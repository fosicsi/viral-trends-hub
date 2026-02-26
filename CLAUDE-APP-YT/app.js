/* ═══════════════════════════════════════════════════
   CreatorPilot — App Logic
   Zero dependencies. Pure JS. Gemini AI Direct.
   ═══════════════════════════════════════════════════ */

// ─── STATE ───
let apiKey = localStorage.getItem('cp_api_key') || '';
let currentView = 'dashboard';
let currentFormat = 'long';
let ideas = JSON.parse(localStorage.getItem('cp_ideas') || '[]');
let stats = JSON.parse(localStorage.getItem('cp_stats') || '{"scripts":0,"ideas":0,"seo":0}');
let lastScriptResult = null;

const TIPS = [
    "Los primeros 3 segundos de tu video son los más importantes. Empieza con una pregunta o afirmación impactante.",
    "Publicar 2-3 videos por semana es más efectivo que 1 video al mes. La consistencia gana.",
    "Usa números en tus títulos: '5 errores que...', '3 secretos para...' Generan más clics.",
    "Los videos entre 8-12 minutos generan mejor retención y más ingresos por ads.",
    "Responde a los primeros 50 comentarios. YouTube premia la interacción del creador.",
    "Estudia a 3 canales de tu nicho que tengan entre 10k-100k subs. Ahí está tu roadmap.",
    "Las miniaturas con caras humanas y emociones generan un 30% más de CTR.",
    "No hagas intros largas. Di de qué va el video en los primeros 5 segundos.",
    "Los Shorts son tu herramienta para conseguir suscriptores rápidamente. Publica al menos 3 por semana.",
    "YouTube Analytics te dice exactamente en qué segundo la gente deja de ver. Estudialo."
];

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
    if (!apiKey) {
        document.getElementById('onboarding').style.display = 'flex';
    } else {
        updateApiStatus(true);
    }

    // Load stats
    document.getElementById('statScripts').textContent = stats.scripts;
    document.getElementById('statIdeas').textContent = ideas.length;
    document.getElementById('statSeo').textContent = stats.seo;

    // Random tip
    document.getElementById('dailyTip').querySelector('p').textContent =
        TIPS[Math.floor(Math.random() * TIPS.length)];

    // Render ideas
    renderIdeas();

    // Setup listeners
    setupListeners();
});

function setupListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Onboarding
    document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('apiKeyInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('onboarding').style.display = 'flex';
        document.getElementById('apiKeyInput').value = apiKey;
    });

    // Script Generator
    const scriptInput = document.getElementById('scriptTopic');
    scriptInput.addEventListener('input', () => {
        document.getElementById('generateScriptBtn').disabled = !scriptInput.value.trim();
    });
    document.getElementById('generateScriptBtn').addEventListener('click', generateScript);

    // SEO Generator
    const seoInput = document.getElementById('seoTopic');
    seoInput.addEventListener('input', () => {
        document.getElementById('generateSeoBtn').disabled = !seoInput.value.trim();
    });
    document.getElementById('generateSeoBtn').addEventListener('click', generateSeo);

    // Format toggles
    document.querySelectorAll('.toggle-btn[data-format]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn[data-format]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFormat = btn.dataset.format;
        });
    });
}

// ─── NAVIGATION ───
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add('active');
}

// ─── API KEY ───
function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key || !key.startsWith('AIza')) {
        showToast('La API Key debe empezar con "AIza..."', 'error');
        return;
    }
    apiKey = key;
    localStorage.setItem('cp_api_key', key);
    document.getElementById('onboarding').style.display = 'none';
    updateApiStatus(true);
    showToast('✅ API Key guardada. ¡CreatorPilot activado!', 'success');
}

function updateApiStatus(connected) {
    const el = document.getElementById('apiStatus');
    if (connected) {
        el.classList.add('connected');
        el.querySelector('.status-text').textContent = 'Gemini Conectado';
    } else {
        el.classList.remove('connected');
        el.querySelector('.status-text').textContent = 'Desconectado';
    }
}

// ─── GEMINI AI ───
async function callGemini(prompt, jsonMode = false) {
    if (!apiKey) throw new Error('No hay API Key configurada');

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    if (jsonMode) {
        payload.generationConfig = { responseMimeType: "application/json" };
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.error?.message || `Error ${res.status}`;
        if (res.status === 429) throw new Error('⏳ Cuota agotada. Esperá unos segundos e intentá de nuevo.');
        if (res.status === 400) throw new Error('🔑 API Key inválida. Revisá tu configuración.');
        throw new Error(msg);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini no devolvió contenido');

    return jsonMode ? JSON.parse(text) : text;
}

// ─── SCRIPT GENERATOR ───
async function generateScript() {
    const topic = document.getElementById('scriptTopic').value.trim();
    if (!topic) return;

    const btn = document.getElementById('generateScriptBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const tone = document.getElementById('scriptTone').value;
        const toneMap = {
            energetico: "Energético, directo, con humor. Usa frases cortas y potentes.",
            educativo: "Educativo, claro, paso a paso. Como un profesor cool.",
            casual: "Casual, como hablando con un amigo. Natural y relajado.",
            motivacional: "Motivacional, inspirador. Que el espectador sienta que puede lograrlo."
        };

        const prompt = `Eres un experto guionista de YouTube.
Genera un guion estructurado para un video sobre: "${topic}".

Formato: ${currentFormat === 'short' ? 'YouTube Short (máx 60 segundos, ritmo ultra rápido)' : 'Video Largo (estructura 8-12 minutos)'}
Tono: ${toneMap[tone]}

Devuelve EXACTAMENTE este JSON (en español):
{
    "title": "Título clickbait pero honesto",
    "hook": "Primeros 3-5 segundos. DEBE atrapar la atención de inmediato. Usa pregunta retórica o dato impactante.",
    "intro": "Contexto rápido (15-30s). ¿Por qué el espectador NECESITA ver esto?",
    "body": [
        "Punto 1: Desarrollo del primer argumento con ejemplo concreto",
        "Punto 2: Segundo argumento con dato o anécdota",
        "Punto 3: Tercer argumento con consejo práctico"
    ],
    "cta": "Llamado a la acción específico y natural. No genérico.",
    "visual_tips": "2-3 sugerencias de cómo hacer el video visualmente más atractivo"
}`;

        const result = await callGemini(prompt, true);
        lastScriptResult = { topic, ...result };

        // Render result
        const sections = document.getElementById('scriptSections');
        sections.innerHTML = '';

        const blocks = [
            { label: '🎣 Hook (0-5s)', text: result.hook },
            { label: '📢 Intro (5-30s)', text: result.intro },
            { label: '📝 Cuerpo Principal', text: Array.isArray(result.body) ? result.body.join('\n\n') : result.body },
            { label: '🎯 Call to Action', text: result.cta },
            { label: '🎨 Tips Visuales', text: result.visual_tips || '' }
        ];

        blocks.forEach(block => {
            if (!block.text) return;
            const div = document.createElement('div');
            div.className = 'script-block';
            div.innerHTML = `
                <div class="script-block-label">${block.label}</div>
                <div class="script-block-text">${block.text}</div>
            `;
            sections.appendChild(div);
        });

        document.getElementById('resultTitle').textContent = result.title || 'Guion Generado';
        document.getElementById('scriptResult').style.display = 'block';

        // Update stats
        stats.scripts++;
        localStorage.setItem('cp_stats', JSON.stringify(stats));
        document.getElementById('statScripts').textContent = stats.scripts;

        showToast('✨ ¡Guion generado exitosamente!', 'success');

    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ─── SEO GENERATOR ───
async function generateSeo() {
    const topic = document.getElementById('seoTopic').value.trim();
    if (!topic) return;

    const btn = document.getElementById('generateSeoBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const prompt = `Eres un experto en SEO de YouTube.
Para un video sobre: "${topic}"

Genera EXACTAMENTE este JSON (en español):
{
    "titles": ["Título 1 (clickbait honesto)", "Título 2 (con número)", "Título 3 (con pregunta)", "Título 4 (con emoji)", "Título 5 (con polémica suave)"],
    "description": "Descripción SEO completa de 150-200 palabras con emojis, timestamps de ejemplo, links genéricos y CTAs. Lista para copiar y pegar.",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
    "tags": ["tag para busquedas 1", "tag 2", "tag 3", "tag 4", "tag 5", "tag 6", "tag 7", "tag 8", "tag 9", "tag 10"]
}`;

        const result = await callGemini(prompt, true);

        // Titles
        const titlesList = document.getElementById('seoTitles');
        titlesList.innerHTML = '';
        (result.titles || []).forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            li.title = 'Click para copiar';
            li.addEventListener('click', () => {
                navigator.clipboard.writeText(t);
                showToast('📋 Título copiado', 'info');
            });
            titlesList.appendChild(li);
        });

        // Description
        document.getElementById('seoDescription').textContent = result.description || '';

        // Hashtags
        const hashtagsDiv = document.getElementById('seoHashtags');
        hashtagsDiv.innerHTML = '';
        (result.hashtags || []).forEach(h => {
            const span = document.createElement('span');
            span.textContent = h;
            hashtagsDiv.appendChild(span);
        });

        // Tags
        const tagsDiv = document.getElementById('seoTags');
        tagsDiv.innerHTML = '';
        (result.tags || []).forEach(t => {
            const span = document.createElement('span');
            span.textContent = t;
            tagsDiv.appendChild(span);
        });

        document.getElementById('seoResult').style.display = 'block';

        stats.seo++;
        localStorage.setItem('cp_stats', JSON.stringify(stats));
        document.getElementById('statSeo').textContent = stats.seo;

        showToast('🎯 ¡SEO optimizado!', 'success');

    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ─── IDEAS BOARD ───
function showNewIdeaForm() {
    document.getElementById('newIdeaForm').style.display = 'flex';
    document.getElementById('newIdeaTitle').focus();
}

function hideNewIdeaForm() {
    document.getElementById('newIdeaForm').style.display = 'none';
    document.getElementById('newIdeaTitle').value = '';
    document.getElementById('newIdeaDesc').value = '';
}

function addIdea() {
    const title = document.getElementById('newIdeaTitle').value.trim();
    if (!title) { showToast('Escribí un título para tu idea', 'error'); return; }

    const idea = {
        id: Date.now(),
        title,
        description: document.getElementById('newIdeaDesc').value.trim(),
        priority: document.getElementById('newIdeaPriority').value,
        createdAt: new Date().toISOString()
    };

    ideas.unshift(idea);
    saveIdeas();
    hideNewIdeaForm();
    renderIdeas();
    showToast('💡 Idea guardada', 'success');
}

function saveAsIdea() {
    if (!lastScriptResult) return;
    const idea = {
        id: Date.now(),
        title: lastScriptResult.title || lastScriptResult.topic,
        description: `Hook: ${lastScriptResult.hook}\nCTA: ${lastScriptResult.cta}`,
        priority: 'alta',
        createdAt: new Date().toISOString()
    };
    ideas.unshift(idea);
    saveIdeas();
    renderIdeas();
    showToast('💾 Guion guardado como idea', 'success');
}

function deleteIdea(id) {
    ideas = ideas.filter(i => i.id !== id);
    saveIdeas();
    renderIdeas();
    showToast('🗑️ Idea eliminada', 'info');
}

function saveIdeas() {
    localStorage.setItem('cp_ideas', JSON.stringify(ideas));
    document.getElementById('statIdeas').textContent = ideas.length;
}

function renderIdeas() {
    const list = document.getElementById('ideasList');
    const empty = document.getElementById('ideasEmpty');

    if (ideas.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = ideas.map(idea => `
        <div class="idea-card">
            <div class="idea-info">
                <h4>${escapeHtml(idea.title)}</h4>
                ${idea.description ? `<p>${escapeHtml(idea.description)}</p>` : ''}
                <div class="idea-meta">
                    <span class="priority-badge priority-${idea.priority}">${idea.priority.toUpperCase()}</span>
                    <span style="font-size:12px;color:var(--text-muted)">${timeAgo(idea.createdAt)}</span>
                </div>
            </div>
            <div class="idea-actions">
                <button onclick="useIdeaAsTopic(${idea.id})" title="Usar como tema">✍️</button>
                <button class="delete-btn" onclick="deleteIdea(${idea.id})" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
}

function useIdeaAsTopic(id) {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    switchView('script');
    document.getElementById('scriptTopic').value = idea.title;
    document.getElementById('generateScriptBtn').disabled = false;
    showToast('✨ Tema cargado. ¡Generá el guion!', 'info');
}

// ─── COPY ───
function copyResult(type) {
    if (!lastScriptResult) return;
    const text = JSON.stringify(lastScriptResult, null, 2);
    navigator.clipboard.writeText(text);
    showToast('📋 Guion copiado al portapapeles', 'success');
}

function copyText(elementId) {
    const el = document.getElementById(elementId);
    navigator.clipboard.writeText(el.textContent);
    showToast('📋 Copiado', 'info');
}

// ─── UTILS ───
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
}

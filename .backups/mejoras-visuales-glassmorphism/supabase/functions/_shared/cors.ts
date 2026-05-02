// supabase/functions/_shared/cors.ts
const ALLOWED_ORIGINS = [
    'https://viral-trends-hub.vercel.app',
];

export function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin');

    let allowedOrigin = ALLOWED_ORIGINS[0]; // fallback

    if (origin) {
        if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:')) {
            allowedOrigin = origin;
        }
    }

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
}

// supabase/functions/oauth-connect/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";
import { decodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = {
    // Legacy
    youtube: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    gemini: [
        "https://www.googleapis.com/auth/generative-language.retriever",
        "openid", "email", "profile"
    ],
    // NEW Unified Scope
    google: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/generative-language.retriever",
        "openid", "email", "profile"
    ]
};

async function getMainKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    return await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(text: string, secret: string): Promise<string> {
    const key = await getMainKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return encodeHex(combined);
}

async function decrypt(hexStr: string, secret: string): Promise<string> {
    const data = decodeHex(hexStr);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await getMainKey(secret);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const url = new URL(req.url);
        let body: any = {};
        try { body = await req.json(); } catch { }

        const pathAction = url.pathname.split('/').pop();
        const action = body.action || pathAction;

        console.log(`Processing action: ${action}`);

        // 1. INIT
        if (action === 'init') {
            const platform = body.platform || url.searchParams.get('platform');
            const redirectUrl = body.redirectUrl || url.searchParams.get('redirectUrl');

            // Allow 'google' as a valid platform
            if (!platform || !['youtube', 'gemini', 'google'].includes(platform)) throw new Error("Invalid platform");

            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const scopes = SCOPES[platform as keyof typeof SCOPES].join(" ");
            const finalRedirectUri = redirectUrl ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-connect/callback`;

            const state = btoa(JSON.stringify({ platform, userId: user.id, nonce: Math.random() }));
            const authUrl = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;

            return new Response(JSON.stringify({ url: authUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. EXCHANGE
        if (action === 'exchange') {
            const { code, redirectUri, platform } = body;
            if (!code || !redirectUri) throw new Error("Missing code or redirectUri");

            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";

            const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenData.access_token) {
                console.error("Exchange Error:", tokenData);
                throw new Error("Failed to exchange token: " + (tokenData.error_description || "Unknown error"));
            }

            const encryptedAccessToken = await encrypt(tokenData.access_token, encryptionKey);
            const encryptedRefreshToken = tokenData.refresh_token ? await encrypt(tokenData.refresh_token, encryptionKey) : null;

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const payload: any = {
                user_id: user.id,
                platform, // 'google' or legacy 'youtube'/'gemini'
                access_token: encryptedAccessToken,
                expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                scopes: tokenData.scope?.split(" ") || [],
                metadata: {},
                updated_at: new Date().toISOString()
            };

            if (encryptedRefreshToken) {
                payload.refresh_token = encryptedRefreshToken;
            }

            const { error: upsertError } = await supabaseAdmin
                .from('user_integrations')
                .upsert(payload, { onConflict: 'user_id, platform' });

            if (upsertError) throw upsertError;

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. STATUS
        if (action === 'status') {
            const { data, error } = await supabaseClient
                .from('user_integrations')
                .select('platform, created_at, updated_at, scopes, metadata')
                .eq('user_id', user.id);

            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 4. STATS (YouTube)
        if (action === 'stats') {
            const platform = body.platform || 'google'; // Default to google if unspecified
            // Note: If platform is 'youtube', we look for 'youtube' row. If 'google', we look for 'google' row.

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // Try validation based on requested platform OR fallback to google if checking general stats
            const { data: integration, error: dbError } = await supabaseAdmin
                .from('user_integrations')
                .select('access_token')
                .eq('user_id', user.id)
                .in('platform', [platform, 'google']) // Allow fetching stats if user has either specific or unified
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (dbError || !integration) {
                return new Response(JSON.stringify({ error: "Not connected" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            const accessToken = await decrypt(integration.access_token, encryptionKey);

            // Fetch Channel Stats from YouTube API
            const ytRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const ytData = await ytRes.json();

            if (!ytData.items || ytData.items.length === 0) {
                return new Response(JSON.stringify({ error: "Channel not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const channel = ytData.items[0];
            const stats = {
                title: channel.snippet.title,
                description: channel.snippet.description,
                thumbnail: channel.snippet.thumbnails?.default?.url,
                viewCount: channel.statistics.viewCount,
                subscriberCount: channel.statistics.subscriberCount,
                videoCount: channel.statistics.videoCount,
                hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount
            };

            return new Response(JSON.stringify({ stats }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. DISCONNECT
        if (action === 'disconnect') {
            const { platform } = body;
            const { error } = await supabaseClient
                .from('user_integrations')
                .delete()
                .eq('user_id', user.id)
                .eq('platform', platform);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

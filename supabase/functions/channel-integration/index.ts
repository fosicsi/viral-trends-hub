// supabase/functions/oauth-connect/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
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
    // Dynamic CORS Headers
    // SIMPLIFIED CORS for debugging: Allow all, no credentials needed for Bearer auth
    const dynamicCorsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: dynamicCorsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

        // DEBUGGING: Log environment status
        console.log(`[DEBUG] SUPABASE_URL present: ${!!Deno.env.get('SUPABASE_URL')}`);
        console.log(`[DEBUG] SUPABASE_ANON_KEY present: ${!!Deno.env.get('SUPABASE_ANON_KEY')}`);
        console.log(`[DEBUG] Auth Header received (length): ${authHeader?.length}`);

        if (!authHeader) {
            console.error("Missing Authorization Header");
            return new Response(JSON.stringify({ error: 'Missing Authorization Header' }), { status: 401, headers: dynamicCorsHeaders });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            // We still set global headers for RLS, but we'll specificially verify the token for the user
            { global: { headers: { Authorization: authHeader } } }
        )

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
        if (userError || !user) {
            console.error("Auth Error:", userError);
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                details: userError,
                debug: {
                    authHeaderPresent: !!authHeader,
                    authHeaderLength: authHeader?.length,
                    authHeaderStart: authHeader?.substring(0, 15),
                    envUrl: !!Deno.env.get('SUPABASE_URL'),
                    envKey: !!Deno.env.get('SUPABASE_ANON_KEY')
                }
            }), { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } })
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
            const prompt = body.prompt || url.searchParams.get('prompt') || 'select_account consent';

            // Allow 'google' as a valid platform
            if (!platform || !['youtube', 'gemini', 'google'].includes(platform)) throw new Error("Invalid platform");

            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const scopes = SCOPES[platform as keyof typeof SCOPES].join(" ");
            const finalRedirectUri = redirectUrl ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-connect/callback`;

            const state = btoa(JSON.stringify({ platform, userId: user.id, nonce: Math.random() }));
            const authUrl = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=${encodeURIComponent(prompt)}&state=${state}`;

            return new Response(JSON.stringify({ url: authUrl }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
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

            return new Response(JSON.stringify({ success: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2.5 SAVE API KEY (BYOK)
        if (action === 'save_api_key') {
            const { platform, apiKey } = body;
            if (!platform || !apiKey) throw new Error("Missing platform or apiKey");

            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            const encryptedKey = await encrypt(apiKey, encryptionKey);

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const { error: upsertError } = await supabaseAdmin
                .from('user_api_keys')
                .upsert({
                    user_id: user.id,
                    platform,
                    encrypted_key: encryptedKey,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, platform' });

            if (upsertError) throw upsertError;

            return new Response(JSON.stringify({ success: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. STATUS
        if (action === 'status') {
            const { data, error } = await supabaseClient
                .from('user_integrations')
                .select('platform, created_at, updated_at, scopes, metadata')
                .eq('user_id', user.id);

            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        // 4. STATS (YouTube) - Cache-First Strategy
        if (action === 'stats') {
            const platform = body.platform || 'google';

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // 1. CHECK CACHE FIRST
            console.log(`[stats] Checking cache for user ${user.id}`);
            const { data: cachedStats, error: cacheError } = await supabaseAdmin
                .from('youtube_analytics_cache')
                .select('data, fetched_at')
                .eq('user_id', user.id)
                .eq('data_type', 'stats')
                .is('date_range', null)
                .gte('expires_at', new Date().toISOString())
                .single();

            if (cachedStats && !cacheError) {
                console.log(`[stats] Cache HIT for user ${user.id}, fetched at ${cachedStats.fetched_at}`);
                return new Response(JSON.stringify({
                    stats: cachedStats.data,
                    cached: true,
                    fetchedAt: cachedStats.fetched_at
                }), {
                    headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
                });
            }

            console.log(`[stats] Cache MISS for user ${user.id}, fetching from YouTube API`);

            // 2. FALLBACK: Fetch from YouTube API if cache miss or expired
            // Fetch integration with Token and Expiration
            const { data: integration, error: dbError } = await supabaseAdmin
                .from('user_integrations')
                .select('access_token, refresh_token, expires_at, platform')
                .eq('user_id', user.id)
                .in('platform', [platform, 'google', 'youtube'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (dbError || !integration) {
                return new Response(JSON.stringify({ error: "Not connected" }), { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            let accessToken = await decrypt(integration.access_token, encryptionKey);

            // TOKEN REFRESH LOGIC
            const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
            const now = new Date();
            // detailed log for debugging
            console.log(`[Token Check] Expires: ${expiresAt.toISOString()}, Now: ${now.toISOString()}, Diff: ${(expiresAt.getTime() - now.getTime()) / 1000}s`);

            // Refresh if expired or expiring in less than 5 minutes
            if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
                console.log("Token expired or expiring soon. Refreshing...");

                if (!integration.refresh_token) {
                    console.error("No refresh token available");
                    return new Response(JSON.stringify({ error: "Token expired and no refresh token" }), { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                const refreshToken = await decrypt(integration.refresh_token, encryptionKey);
                const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
                const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

                const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: clientId!,
                        client_secret: clientSecret!,
                        refresh_token: refreshToken,
                        grant_type: "refresh_token",
                    }),
                });

                const refreshData = await refreshRes.json();

                if (!refreshData.access_token) {
                    console.error("Failed to refresh token", refreshData);
                    // If refresh fails (e.g. revoked), delete integration? For now just return 401.
                    return new Response(JSON.stringify({ error: "Failed to refresh token" }), { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                // Update Access Token
                accessToken = refreshData.access_token;
                const newEncryptedAccessToken = await encrypt(refreshData.access_token, encryptionKey);
                // Calculate new expiry
                const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

                const updatePayload: any = {
                    access_token: newEncryptedAccessToken,
                    expires_at: newExpiresAt,
                    updated_at: new Date().toISOString()
                };

                // Sometimes we get a NEW refresh token
                if (refreshData.refresh_token) {
                    updatePayload.refresh_token = await encrypt(refreshData.refresh_token, encryptionKey);
                }

                await supabaseAdmin
                    .from('user_integrations')
                    .update(updatePayload)
                    .eq('user_id', user.id)
                    .eq('platform', integration.platform);

                console.log("Token refreshed successfully.");
            }

            try {
                // Fetch Channel Stats from YouTube API
                const ytRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const ytData = await ytRes.json();

                if (ytRes.status === 403 || ytRes.status === 429) {
                    console.log(`[stats] Quota exceeded for user ${user.id}, attempting fallback to cache`);
                    const { data: stale } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', 'stats').is('date_range', null).order('fetched_at', { ascending: false }).limit(1).single();
                    if (stale) return new Response(JSON.stringify({ stats: stale.data, cached: true, isStale: true, quotaExceeded: true, fetchedAt: stale.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                if (!ytRes.ok) {
                    console.error("YouTube API Error:", ytData);
                    throw new Error(ytData.error?.message || "YouTube API Error");
                }

                if (!ytData.items || ytData.items.length === 0) {
                    throw new Error("Channel not found");
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

                // 3. CACHE THE RESULT
                const expiresIn = 15 * 60 * 1000;
                await supabaseAdmin.from('youtube_analytics_cache').upsert({
                    user_id: user.id, data_type: 'stats', date_range: null, data: stats, fetched_at: now.toISOString(), expires_at: new Date(now.getTime() + expiresIn).toISOString(),
                }, { onConflict: 'user_id,data_type,date_range' });

                return new Response(JSON.stringify({ stats, cached: false, fetchedAt: now.toISOString() }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error("[stats] Error fetching stats, fallback to last known cache", err);
                const { data: lastResort } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', 'stats').is('date_range', null).order('fetched_at', { ascending: false }).limit(1).single();
                if (lastResort) return new Response(JSON.stringify({ stats: lastResort.data, cached: true, isStale: true, errorFallback: true, fetchedAt: lastResort.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                return new Response(JSON.stringify({ error: "Failed to fetch stats and no cache available", details: err instanceof Error ? err.message : String(err) }), { status: 500, headers: dynamicCorsHeaders });
            }




        }

        // 6. VIDEOS (YouTube Data API) - Fetch channel videos with Quota Fallback
        if (action === 'videos') {
            const platform = body.platform || 'google';
            const maxResults = body.maxResults || 10;
            const order = body.order || 'date';

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const cacheKey = `videos_${maxResults}_${order}`;

            // 1. CHECK CACHE FIRST
            const { data: cachedVideos, error: cacheError } = await supabaseAdmin
                .from('youtube_analytics_cache')
                .select('data, fetched_at')
                .eq('user_id', user.id)
                .eq('data_type', cacheKey)
                .is('date_range', null)
                .gte('expires_at', new Date().toISOString())
                .single();

            if (cachedVideos && !cacheError) {
                return new Response(JSON.stringify({
                    videos: cachedVideos.data,
                    cached: true,
                    fetchedAt: cachedVideos.fetched_at
                }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            // 2. FETCH FROM API
            const { data: integration } = await supabaseAdmin
                .from('user_integrations')
                .select('access_token, refresh_token, expires_at, platform')
                .eq('user_id', user.id)
                .in('platform', [platform, 'google', 'youtube'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!integration) {
                return new Response(JSON.stringify({ error: "Not connected" }), { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            let accessToken = await decrypt(integration.access_token, encryptionKey);
            const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
            const now = new Date();

            if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
                if (integration.refresh_token) {
                    const refreshToken = await decrypt(integration.refresh_token, encryptionKey);
                    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
                            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
                            refresh_token: refreshToken,
                            grant_type: "refresh_token",
                        }),
                    });
                    const refreshData = await refreshRes.json();
                    if (refreshData.access_token) {
                        accessToken = refreshData.access_token;
                        await supabaseAdmin.from('user_integrations').update({
                            access_token: await encrypt(accessToken, encryptionKey),
                            expires_at: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString(),
                        }).eq('user_id', user.id).eq('platform', integration.platform);
                    }
                }
            }

            try {
                let uploadsPlaylistId;

                // Try fetching Channel ID/Uploads first (High Cost: 1 unit)
                const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&mine=true`, { headers: { Authorization: `Bearer ${accessToken}` } });

                if (channelRes.ok) {
                    const channelData = await channelRes.json();
                    uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

                    // Cache the ID indefinitely (it never changes)
                    if (uploadsPlaylistId) {
                        await supabaseAdmin.from('youtube_analytics_cache').upsert({
                            user_id: user.id, data_type: 'uploads_playlist_id', date_range: null, data: { id: uploadsPlaylistId }, fetched_at: now.toISOString(), expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                        }, { onConflict: 'user_id,data_type,date_range' });
                    }
                } else if (channelRes.status === 403 || channelRes.status === 429) {
                    // Quota fallback for ID
                    console.log("[videos] Quota on channels list, trying to fetch cached Playlist ID");
                    const { data: cachedId } = await supabaseAdmin.from('youtube_analytics_cache').select('data').eq('user_id', user.id).eq('data_type', 'uploads_playlist_id').single();
                    if (cachedId?.data?.id) {
                        uploadsPlaylistId = cachedId.data.id;
                    } else {
                        // Full Fallback if we can't even get the ID
                        const { data: stale } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheKey).order('fetched_at', { ascending: false }).limit(1).single();
                        if (stale) return new Response(JSON.stringify({ videos: stale.data, cached: true, isStale: true, quotaExceeded: true, fetchedAt: stale.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                        return new Response(JSON.stringify({ videos: [], quotaExceeded: true, noCache: true, isStale: false }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                    }
                } else {
                    throw new Error(`Channel fetch failed: ${channelRes.status}`);
                }

                if (!uploadsPlaylistId) throw new Error("No uploads playlist ID found");

                // Get Playlist Items
                const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`, { headers: { Authorization: `Bearer ${accessToken}` } });
                const videosData = await videosRes.json();

                if (videosRes.status === 403 || videosRes.status === 429) {
                    const { data: stale } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheKey).order('fetched_at', { ascending: false }).limit(1).single();
                    if (stale) return new Response(JSON.stringify({ videos: stale.data, cached: true, isStale: true, quotaExceeded: true, fetchedAt: stale.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                    return new Response(JSON.stringify({ videos: [], quotaExceeded: true, noCache: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId).join(',');

                // Get Video Details
                const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}`, { headers: { Authorization: `Bearer ${accessToken}` } });
                const detailsData = await detailsRes.json();

                if (detailsRes.status === 403 || detailsRes.status === 429) {
                    const { data: stale } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheKey).order('fetched_at', { ascending: false }).limit(1).single();
                    if (stale) return new Response(JSON.stringify({ videos: stale.data, cached: true, isStale: true, quotaExceeded: true, fetchedAt: stale.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                    return new Response(JSON.stringify({ videos: [], quotaExceeded: true, noCache: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                // Cache success
                await supabaseAdmin.from('youtube_analytics_cache').upsert({
                    user_id: user.id, data_type: cacheKey, date_range: null, data: detailsData.items, fetched_at: now.toISOString(), expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
                }, { onConflict: 'user_id,data_type,date_range' });

                return new Response(JSON.stringify({ videos: detailsData.items, cached: false, fetchedAt: now.toISOString() }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error("[videos] Fallback to last resort", err);
                const { data: lastResort } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheKey).order('fetched_at', { ascending: false }).limit(1).single();
                if (lastResort) return new Response(JSON.stringify({ videos: lastResort.data, cached: true, isStale: true, errorFallback: true, fetchedAt: lastResort.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                return new Response(JSON.stringify({ error: "Failed and no cache available" }), { status: 500, headers: dynamicCorsHeaders });
            }
        }

        // 7. REPORTS (YouTube Analytics) - Cache-First & Quota Fallback
        if (action === 'reports' || action === 'get_reports') {
            const { startDate, endDate, dimensions, metrics, reportType, filters } = body;
            const platform = body.platform || 'google';

            if (!startDate || !endDate) {
                return new Response(JSON.stringify({ error: "Missing dates" }), { status: 400, headers: dynamicCorsHeaders });
            }

            const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

            const calculateRangeKey = (start: string, end: string): string | null => {
                const s = new Date(start); const e = new Date(end);
                const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                if (diff <= 8) return '7d'; if (diff <= 30) return '28d'; if (diff <= 95) return '90d'; if (diff <= 370) return '365d'; return 'all';
            };

            const getCanonicalDates = (rangeKey: string): { start: string, end: string } => {
                const today = new Date(); today.setHours(0, 0, 0, 0); today.setDate(today.getDate() - 2);
                const end = new Date(today); const start = new Date(today);
                switch (rangeKey) {
                    case '7d': start.setDate(today.getDate() - 7); break;
                    case '28d': start.setDate(today.getDate() - 28); break;
                    case '90d': start.setDate(today.getDate() - 90); break;
                    case '365d': start.setDate(today.getDate() - 365); break;
                    case 'all': start.setFullYear(2012, 0, 1); break;
                }
                return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
            };

            const rangeKey = calculateRangeKey(startDate, endDate);
            const canonical = rangeKey ? getCanonicalDates(rangeKey) : { start: startDate, end: endDate };
            const cacheType = reportType || 'reports';

            // Check Cache
            if (!filters) {
                const { data: cached } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheType).eq('date_range', rangeKey).gte('expires_at', new Date().toISOString()).single();
                if (cached) return new Response(JSON.stringify({ report: cached.data, cached: true, fetchedAt: cached.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            // Fetch Integration
            const { data: integration } = await supabaseAdmin.from('user_integrations').select('access_token, refresh_token, expires_at, platform').eq('user_id', user.id).in('platform', [platform, 'google', 'youtube']).order('created_at', { ascending: false }).limit(1).single();
            if (!integration) return new Response(JSON.stringify({ error: "Not connected" }), { status: 404, headers: dynamicCorsHeaders });

            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            let accessToken = await decrypt(integration.access_token, encryptionKey);
            const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
            const now = new Date();

            if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
                if (integration.refresh_token) {
                    const refreshToken = await decrypt(integration.refresh_token, encryptionKey);
                    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!, client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!, refresh_token: refreshToken, grant_type: "refresh_token",
                        }),
                    });
                    const refreshData = await refreshRes.json();
                    if (refreshData.access_token) {
                        accessToken = refreshData.access_token;
                        await supabaseAdmin.from('user_integrations').update({ access_token: await encrypt(accessToken, encryptionKey), expires_at: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString() }).eq('user_id', user.id).eq('platform', integration.platform);
                    }
                }
            }

            let rMetrics = metrics || 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost';
            let rDims = dimensions || 'day';
            let sort = (rDims.includes('day') || rDims.includes('month')) ? rDims : '-views';

            if (reportType === 'audience') {
                rMetrics = metrics || 'views,averageViewDuration,averageViewPercentage';
                rDims = dimensions || 'subscribedStatus';
                sort = rDims.includes('day') ? 'day' : (rDims.includes('month') ? 'month' : '-views');
            } else if (reportType === 'traffic') {
                rDims = dimensions || 'insightTrafficSourceType';
                rMetrics = metrics || 'views,estimatedMinutesWatched';
                sort = rDims.includes('day') ? 'day' : (rDims.includes('month') ? 'month' : '-views');
            }

            const queryParams = new URLSearchParams({
                ids: 'channel==MINE', startDate: canonical.start, endDate: canonical.end, metrics: rMetrics, dimensions: rDims, sort: sort
            });
            if (filters) queryParams.set('filters', filters);

            try {
                const apiRes = await fetch(`https://youtubeanalytics.googleapis.com/v1/reports?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` } });

                if (apiRes.status === 403 || apiRes.status === 429) {
                    const { data: stale } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheType).eq('date_range', rangeKey).order('fetched_at', { ascending: false }).limit(1).single();
                    if (stale) return new Response(JSON.stringify({ report: stale.data, cached: true, isStale: true, quotaExceeded: true, fetchedAt: stale.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });

                    // Return empty 200 with quota flag
                    return new Response(JSON.stringify({ report: { columnHeaders: [], rows: [] }, quotaExceeded: true, noCache: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                const reportData = await apiRes.json();
                if (reportData.error) throw new Error(JSON.stringify(reportData.error));

                if (!filters) {
                    await supabaseAdmin.from('youtube_analytics_cache').upsert({
                        user_id: user.id, data_type: cacheType, date_range: rangeKey, data: reportData, fetched_at: now.toISOString(), expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                    }, { onConflict: 'user_id,data_type,date_range' });
                }

                return new Response(JSON.stringify({ report: reportData, cached: false, fetchedAt: now.toISOString() }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error("[reports] Error, fallback to cache", err);
                const { data: lastResort } = await supabaseAdmin.from('youtube_analytics_cache').select('data, fetched_at').eq('user_id', user.id).eq('data_type', cacheType).eq('date_range', rangeKey).order('fetched_at', { ascending: false }).limit(1).single();
                if (lastResort) return new Response(JSON.stringify({ report: lastResort.data, cached: true, isStale: true, errorFallback: true, fetchedAt: lastResort.fetched_at }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                return new Response(JSON.stringify({ error: "Failed and no cache available" }), { status: 500, headers: dynamicCorsHeaders });
            }
        }

        // 8. DISCONNECT
        if (action === 'disconnect') {
            const { platform } = body;
            const { error } = await supabaseClient.from('user_integrations').delete().eq('user_id', user.id).eq('platform', platform);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        // Catch-all for unknown actions
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: dynamicCorsHeaders });

    } catch (error) {
        console.error("Critical Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), { status: 500, headers: dynamicCorsHeaders });
    }
})
// Force redeploy Mon Feb  9 00:52:53 -03 2026
// Trigger secrets propagation 1770609610

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

            // Allow 'google' as a valid platform
            if (!platform || !['youtube', 'gemini', 'google'].includes(platform)) throw new Error("Invalid platform");

            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const scopes = SCOPES[platform as keyof typeof SCOPES].join(" ");
            const finalRedirectUri = redirectUrl ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-connect/callback`;

            const state = btoa(JSON.stringify({ platform, userId: user.id, nonce: Math.random() }));
            const authUrl = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;

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

            // Fetch Channel Stats from YouTube API
            const ytRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const ytData = await ytRes.json();

            if (!ytRes.ok) {
                console.error("YouTube API Error:", ytData);
                return new Response(JSON.stringify({ error: "YouTube API Error", details: ytData }), { status: ytRes.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            if (!ytData.items || ytData.items.length === 0) {
                return new Response(JSON.stringify({ error: "Channel not found" }), { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
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

            // 3. CACHE THE RESULT (for next time)
            const expiresIn = 15 * 60 * 1000; // 15 minutes
            try {
                await supabaseAdmin
                    .from('youtube_analytics_cache')
                    .upsert({
                        user_id: user.id,
                        data_type: 'stats',
                        date_range: null,
                        data: stats,
                        fetched_at: now.toISOString(),
                        expires_at: new Date(now.getTime() + expiresIn).toISOString(),
                    }, { onConflict: 'user_id,data_type,date_range' });
                console.log(`[stats] Cached fresh data for user ${user.id}`);
            } catch (cacheUpsertError) {
                console.error("[stats] Failed to cache stats, but continuing", cacheUpsertError);
                // Don't fail the request if caching fails
            }

            return new Response(JSON.stringify({
                stats,
                cached: false,
                fetchedAt: now.toISOString()
            }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        // 6. REPORTS (YouTube Analytics) - Cache-First Strategy
        if (action === 'reports' || action === 'get_reports') {
            const platform = body.platform || 'google';
            const { startDate, endDate, dimensions, metrics, reportType } = body;

            if (!startDate || !endDate) {
                return new Response(JSON.stringify({ error: "Missing startDate or endDate" }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // Determine the date range for cache key
            // Calculate which date range this corresponds to
            const calculateRangeKey = (start: string, end: string): string | null => {
                const startDate = new Date(start);
                const endDate = new Date(end);
                const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 8) return '7d';
                if (diffDays <= 30) return '28d';
                if (diffDays <= 95) return '90d';
                if (diffDays <= 370) return '365d';
                return 'all';
            };

            const dateRangeKey = calculateRangeKey(startDate, endDate);
            const cacheDataType = reportType || 'reports';

            // 1. CHECK CACHE FIRST
            console.log(`[reports] Checking cache for user ${user.id}, type: ${cacheDataType}, range: ${dateRangeKey}`);
            const { data: cachedReport, error: cacheError } = await supabaseAdmin
                .from('youtube_analytics_cache')
                .select('data, fetched_at')
                .eq('user_id', user.id)
                .eq('data_type', cacheDataType)
                .eq('date_range', dateRangeKey)
                .gte('expires_at', new Date().toISOString())
                .single();

            if (cachedReport && !cacheError) {
                console.log(`[reports] Cache HIT for user ${user.id}, type: ${cacheDataType}, fetched at ${cachedReport.fetched_at}`);
                return new Response(JSON.stringify({
                    report: cachedReport.data,
                    cached: true,
                    fetchedAt: cachedReport.fetched_at
                }), {
                    headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
                });
            }

            console.log(`[reports] Cache MISS for user ${user.id}, fetching from YouTube API`);

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

            // TOKEN REFRESH LOGIC (Duplicated for safety/speed)
            const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
            const now = new Date();

            if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
                console.log("Token expiring soon (reports). Refreshing...");

                if (!integration.refresh_token) {
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
                    return new Response(JSON.stringify({ error: "Failed to refresh token" }), { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
                }

                accessToken = refreshData.access_token;
                const newEncryptedAccessToken = await encrypt(refreshData.access_token, encryptionKey);
                const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

                const updatePayload: any = { access_token: newEncryptedAccessToken, expires_at: newExpiresAt, updated_at: new Date().toISOString() };
                if (refreshData.refresh_token) updatePayload.refresh_token = await encrypt(refreshData.refresh_token, encryptionKey);

                await supabaseAdmin.from('user_integrations').update(updatePayload).eq('user_id', user.id).eq('platform', integration.platform);
            }

            // Define metrics and dimensions based on reportType
            let reportMetrics = metrics || 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained';
            let reportDims = dimensions || 'day';
            let sort = 'day';

            if (reportType === 'audience') {
                reportMetrics = 'views,averageViewDuration,averageViewPercentage';
                reportDims = dimensions || 'subscribedStatus'; // Allow override, default to subscribedStatus
                sort = '-views';
            } else if (reportType === 'traffic') {
                reportDims = 'insightTrafficSourceType';
                reportMetrics = 'views,estimatedMinutesWatched';
                sort = '-views';
            }

            const queryParams = new URLSearchParams({
                ids: 'channel==MINE',
                startDate: startDate,
                endDate: endDate,
                metrics: reportMetrics,
                dimensions: reportDims,
                sort: sort
            });

            console.log(`[get_reports] Fetching with params: ${queryParams.toString()}`);

            const ytRes = await fetch(
                `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams.toString()}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const ytData = await ytRes.json();

            if (ytData.error) {
                console.error("[get_reports] API Error Body:", ytData);
            } else {
                console.log(`[get_reports] Success. Rows count: ${ytData?.rows?.length || 0}`);
            }

            if (!ytRes.ok) {
                console.error("YouTube Analytics API Error:", ytData);
                return new Response(JSON.stringify({ error: "Analytics API Error", details: ytData }), { status: ytRes.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
            }

            // 3. CACHE THE RESULT (for next time)
            const expiresIn = 30 * 60 * 1000; // 30 minutes
            try {
                await supabaseAdmin
                    .from('youtube_analytics_cache')
                    .upsert({
                        user_id: user.id,
                        data_type: cacheDataType,
                        date_range: dateRangeKey,
                        data: ytData,
                        fetched_at: now.toISOString(),
                        expires_at: new Date(now.getTime() + expiresIn).toISOString(),
                    }, { onConflict: 'user_id,data_type,date_range' });
                console.log(`[reports] Cached fresh data for user ${user.id}, type: ${cacheDataType}`);
            } catch (cacheUpsertError) {
                console.error("[reports] Failed to cache report, but continuing", cacheUpsertError);
                // Don't fail the request if caching fails
            }

            return new Response(JSON.stringify({
                report: ytData,
                cached: false,
                fetchedAt: now.toISOString()
            }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
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
            return new Response(JSON.stringify({ success: true }), { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
// Force redeploy Mon Feb  9 00:52:53 -03 2026
// Trigger secrets propagation 1770609610

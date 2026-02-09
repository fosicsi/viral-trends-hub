// YouTube Analytics Collector Service
// Runs periodically via cron to fetch and cache YouTube Analytics data for all users
// This reduces direct API calls from the frontend and improves performance

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CollectorConfig {
    dataType: 'stats' | 'reports' | 'traffic' | 'audience';
    dateRanges?: string[]; // For reports: ['7d', '28d', '90d', '365d', 'all']
}

// Reuse decryption logic from channel-integration
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

// Fetch and cache stats for a single user
async function collectStatsForUser(
    userId: string,
    integration: any,
    supabaseAdmin: any,
    encryptionKey: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[Collector] Processing stats for user ${userId}`);

        // Decrypt access token
        let accessToken = await decrypt(integration.access_token, encryptionKey);

        // Check if token needs refresh
        const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
        const now = new Date();

        if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
            console.log(`[Collector] Token expired for user ${userId}, refreshing...`);

            if (!integration.refresh_token) {
                return { success: false, error: "No refresh token available" };
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
                console.error(`[Collector] Failed to refresh token for user ${userId}`, refreshData);
                return { success: false, error: "Token refresh failed" };
            }

            accessToken = refreshData.access_token;
            // Note: We're not updating the DB here for simplicity, 
            // the next regular request will handle it
        }

        // Fetch channel stats from YouTube API
        const ytRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const ytData = await ytRes.json();

        if (!ytRes.ok || !ytData.items || ytData.items.length === 0) {
            console.error(`[Collector] YouTube API error for user ${userId}`, ytData);
            return { success: false, error: ytData.error?.message || "No channel found" };
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

        // Cache the stats (expires in 15 minutes)
        const expiresIn = 15 * 60 * 1000; // 15 minutes
        const { error: upsertError } = await supabaseAdmin
            .from('youtube_analytics_cache')
            .upsert({
                user_id: userId,
                data_type: 'stats',
                date_range: null,
                data: stats,
                fetched_at: now.toISOString(),
                expires_at: new Date(now.getTime() + expiresIn).toISOString(),
            }, { onConflict: 'user_id,data_type,date_range' });

        if (upsertError) {
            console.error(`[Collector] Failed to cache stats for user ${userId}`, upsertError);
            return { success: false, error: upsertError.message };
        }

        console.log(`[Collector] Successfully cached stats for user ${userId}`);
        return { success: true };

    } catch (error: any) {
        console.error(`[Collector] Error processing user ${userId}`, error);
        return { success: false, error: error.message };
    }
}

// Fetch and cache reports for a single user
async function collectReportsForUser(
    userId: string,
    integration: any,
    supabaseAdmin: any,
    encryptionKey: string,
    dateRanges: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[Collector] Processing reports for user ${userId}, ranges: ${dateRanges.join(', ')}`);

        // Decrypt and refresh token if needed (same logic as stats)
        let accessToken = await decrypt(integration.access_token, encryptionKey);

        const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
        const now = new Date();

        if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
            if (!integration.refresh_token) {
                return { success: false, error: "No refresh token" };
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
                return { success: false, error: "Token refresh failed" };
            }

            accessToken = refreshData.access_token;
        }

        // Fetch reports for each date range
        for (const range of dateRanges) {
            try {
                const { startDate, endDate } = calculateDateRange(range);
                let dimension = 'day';
                if (range === 'all' || range === '365d') {
                    dimension = 'month';
                }

                // Main report
                const reportParams = new URLSearchParams({
                    ids: 'channel==MINE',
                    startDate,
                    endDate,
                    metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained',
                    dimensions: dimension,
                    sort: dimension
                });

                const reportRes = await fetch(
                    `https://youtubeanalytics.googleapis.com/v2/reports?${reportParams.toString()}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                const reportData = await reportRes.json();

                if (reportRes.ok && reportData.rows) {
                    // Cache main report (expires in 30 minutes)
                    const expiresIn = 30 * 60 * 1000;
                    await supabaseAdmin
                        .from('youtube_analytics_cache')
                        .upsert({
                            user_id: userId,
                            data_type: 'reports',
                            date_range: range,
                            data: reportData,
                            fetched_at: now.toISOString(),
                            expires_at: new Date(now.getTime() + expiresIn).toISOString(),
                        }, { onConflict: 'user_id,data_type,date_range' });

                    console.log(`[Collector] Cached reports for user ${userId}, range ${range}`);
                }

                // Traffic sources report
                const trafficParams = new URLSearchParams({
                    ids: 'channel==MINE',
                    startDate,
                    endDate,
                    metrics: 'views,estimatedMinutesWatched',
                    dimensions: 'insightTrafficSourceType',
                    sort: '-views'
                });

                const trafficRes = await fetch(
                    `https://youtubeanalytics.googleapis.com/v2/reports?${trafficParams.toString()}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                const trafficData = await trafficRes.json();

                if (trafficRes.ok && trafficData.rows) {
                    await supabaseAdmin
                        .from('youtube_analytics_cache')
                        .upsert({
                            user_id: userId,
                            data_type: 'traffic',
                            date_range: range,
                            data: trafficData,
                            fetched_at: now.toISOString(),
                            expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
                        }, { onConflict: 'user_id,data_type,date_range' });
                }

                // Audience report
                const audienceParams = new URLSearchParams({
                    ids: 'channel==MINE',
                    startDate,
                    endDate,
                    metrics: 'views,averageViewDuration,averageViewPercentage',
                    dimensions: 'subscribedStatus',
                    sort: '-views'
                });

                const audienceRes = await fetch(
                    `https://youtubeanalytics.googleapis.com/v2/reports?${audienceParams.toString()}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                const audienceData = await audienceRes.json();

                if (audienceRes.ok && audienceData.rows) {
                    await supabaseAdmin
                        .from('youtube_analytics_cache')
                        .upsert({
                            user_id: userId,
                            data_type: 'audience',
                            date_range: range,
                            data: audienceData,
                            fetched_at: now.toISOString(),
                            expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
                        }, { onConflict: 'user_id,data_type,date_range' });
                }

            } catch (rangeError: any) {
                console.error(`[Collector] Error fetching range ${range} for user ${userId}`, rangeError);
                // Continue with next range
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error(`[Collector] Error processing reports for user ${userId}`, error);
        return { success: false, error: error.message };
    }
}

function calculateDateRange(range: string) {
    const end = new Date();
    const start = new Date();

    switch (range) {
        case '7d': start.setDate(end.getDate() - 7); break;
        case '28d': start.setDate(end.getDate() - 28); break;
        case '90d': start.setDate(end.getDate() - 90); break;
        case '365d': start.setDate(end.getDate() - 365); break;
        case 'all': start.setFullYear(2000); break;
        default: start.setDate(end.getDate() - 28);
    }

    return {
        endDate: end.toISOString().split('T')[0],
        startDate: start.toISOString().split('T')[0]
    };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // This function should be called with service role key
        // Either via cron job or manual invocation

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";

        // Parse request body for configuration
        let config: CollectorConfig = { dataType: 'stats' };
        try {
            const body = await req.json();
            config = body;
        } catch {
            // Default to stats collection
        }

        console.log(`[Collector] Starting collection job for: ${config.dataType}`);

        // Get all users with active YouTube integrations
        const { data: integrations, error: fetchError } = await supabaseAdmin
            .from('user_integrations')
            .select('user_id, access_token, refresh_token, expires_at, platform')
            .in('platform', ['youtube', 'google']);

        if (fetchError) {
            console.error('[Collector] Failed to fetch integrations', fetchError);
            return new Response(JSON.stringify({ error: fetchError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!integrations || integrations.length === 0) {
            console.log('[Collector] No integrations found');
            return new Response(JSON.stringify({ message: 'No integrations to process' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[Collector] Found ${integrations.length} integrations to process`);

        const results = {
            total: integrations.length,
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Process each user
        for (const integration of integrations) {
            if (config.dataType === 'stats') {
                const result = await collectStatsForUser(
                    integration.user_id,
                    integration,
                    supabaseAdmin,
                    encryptionKey
                );

                if (result.success) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push(`User ${integration.user_id}: ${result.error}`);
                }
            } else if (config.dataType === 'reports') {
                const dateRanges = config.dateRanges || ['7d', '28d', '90d'];
                const result = await collectReportsForUser(
                    integration.user_id,
                    integration,
                    supabaseAdmin,
                    encryptionKey,
                    dateRanges
                );

                if (result.success) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push(`User ${integration.user_id}: ${result.error}`);
                }
            }
        }

        console.log(`[Collector] Job complete. Success: ${results.successful}, Failed: ${results.failed}`);

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Collector] Unexpected error', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

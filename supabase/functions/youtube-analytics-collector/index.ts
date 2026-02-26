// INTELLITUBE KICKSTART — Forced Data Ingestion
// Reads OAuth tokens from user_integrations, calls YouTube API,
// and populates youtube_channels + video_metadata + video_metrics

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function getMainKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    return await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function decrypt(hexStr: string, secret: string): Promise<string> {
    const data = decodeHex(hexStr);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await getMainKey(secret);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}

async function encrypt(text: string, secret: string): Promise<string> {
    const key = await getMainKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return encodeHex(combined);
}

async function getAccessToken(integration: any, encryptionKey: string, supabaseAdmin: any): Promise<string> {
    let accessToken = await decrypt(integration.access_token, encryptionKey);

    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
    const now = new Date();

    if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
        console.log("[kickstart] Token expired, refreshing...");

        if (!integration.refresh_token) {
            throw new Error("TOKEN_EXPIRED_NO_REFRESH: Reconectá tu canal de YouTube desde Integraciones.");
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
            console.error("[kickstart] Token refresh failed:", refreshData);
            throw new Error("TOKEN_REFRESH_FAILED: " + (refreshData.error_description || "Reconectá tu canal."));
        }

        accessToken = refreshData.access_token;

        // Update stored token
        const newEncrypted = await encrypt(accessToken, encryptionKey);
        await supabaseAdmin.from('user_integrations').update({
            access_token: newEncrypted,
            expires_at: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString(),
            updated_at: new Date().toISOString()
        }).eq('user_id', integration.user_id).eq('platform', integration.platform);

        console.log("[kickstart] Token refreshed OK");
    }

    return accessToken;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Auth: get user from token
        const authHeader = req.headers.get('Authorization') || '';
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Not authenticated", code: 401 }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[kickstart] User: ${user.id}`);

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";

        // 1. Get user's YouTube integration
        const { data: integration, error: intError } = await supabaseAdmin
            .from('user_integrations')
            .select('user_id, access_token, refresh_token, expires_at, platform')
            .eq('user_id', user.id)
            .in('platform', ['google', 'youtube'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (intError || !integration) {
            return new Response(JSON.stringify({
                error: "NO_CHANNEL_CONNECTED",
                message: "No hay canal de YouTube conectado. Andá a Integraciones y conectá tu canal.",
                code: 404
            }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Get fresh access token
        const accessToken = await getAccessToken(integration, encryptionKey, supabaseAdmin);

        // 3. FETCH CHANNEL INFO
        console.log("[kickstart] Fetching channel info...");
        const channelRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!channelRes.ok) {
            const err = await channelRes.text();
            if (channelRes.status === 401 || channelRes.status === 403) {
                throw new Error("TOKEN_INVALID: " + err.slice(0, 200));
            }
            throw new Error(`YouTube channels API error ${channelRes.status}: ${err.slice(0, 200)}`);
        }

        const channelData = await channelRes.json();
        if (!channelData.items || channelData.items.length === 0) {
            throw new Error("No YouTube channel found for this account.");
        }

        const ch = channelData.items[0];
        const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads;

        // 4. UPSERT youtube_channels
        console.log(`[kickstart] Channel: ${ch.snippet.title} (${ch.id})`);

        // Encrypt the tokens for youtube_channels table
        const encRefresh = integration.refresh_token; // Already encrypted
        const encAccess = integration.access_token;    // Already encrypted

        const { data: channelRow, error: chError } = await supabaseAdmin
            .from('youtube_channels')
            .upsert({
                user_id: user.id,
                youtube_channel_id: ch.id,
                channel_title: ch.snippet.title,
                thumbnail_url: ch.snippet.thumbnails?.default?.url,
                access_token: encAccess,
                refresh_token: encRefresh,
                token_expires_at: integration.expires_at,
                subscriber_count: Number(ch.statistics.subscriberCount || 0),
                total_views: Number(ch.statistics.viewCount || 0),
                video_count: Number(ch.statistics.videoCount || 0),
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, youtube_channel_id' })
            .select('id')
            .single();

        if (chError) {
            console.error("[kickstart] Channel upsert error:", chError);
            throw new Error("DB Error al guardar canal: " + chError.message);
        }

        const channelDbId = channelRow.id;
        console.log(`[kickstart] Channel saved in DB with id: ${channelDbId}`);

        // 5. FETCH VIDEOS (up to 50 from uploads playlist)
        if (!uploadsPlaylistId) {
            return new Response(JSON.stringify({
                success: true,
                channel: { title: ch.snippet.title, subs: ch.statistics.subscriberCount },
                videos: 0,
                message: "Canal guardado pero no se encontró playlist de uploads."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log("[kickstart] Fetching playlist items...");
        const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!playlistRes.ok) {
            console.warn("[kickstart] Playlist fetch failed:", playlistRes.status);
            return new Response(JSON.stringify({
                success: true,
                channel: { title: ch.snippet.title, subs: ch.statistics.subscriberCount },
                videos: 0,
                message: "Canal guardado. Error al traer videos, reintentá más tarde."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const playlistData = await playlistRes.json();
        const videoItems = playlistData.items || [];
        const videoIds = videoItems.map((v: any) => v.contentDetails.videoId).filter(Boolean);

        if (videoIds.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                channel: { title: ch.snippet.title, subs: ch.statistics.subscriberCount },
                videos: 0,
                message: "Canal guardado. No se encontraron videos."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 6. FETCH VIDEO DETAILS (stats + snippet for tags)
        console.log(`[kickstart] Fetching details for ${videoIds.length} videos...`);
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!detailsRes.ok) {
            console.warn("[kickstart] Video details fetch failed:", detailsRes.status);
            return new Response(JSON.stringify({
                success: true,
                channel: { title: ch.snippet.title, subs: ch.statistics.subscriberCount },
                videos: 0,
                message: "Canal guardado. Error al traer detalles de videos."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const detailsData = await detailsRes.json();
        const videos = detailsData.items || [];

        // 7. UPSERT video_metadata + video_metrics
        let savedCount = 0;
        for (const video of videos) {
            try {
                // Upsert video_metadata
                const { data: metaRow, error: metaError } = await supabaseAdmin
                    .from('video_metadata')
                    .upsert({
                        channel_id: channelDbId,
                        youtube_video_id: video.id,
                        title: video.snippet.title,
                        description: (video.snippet.description || '').slice(0, 500),
                        published_at: video.snippet.publishedAt,
                        duration: video.contentDetails?.duration || '',
                        tags: video.snippet.tags || [],
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'channel_id, youtube_video_id' })
                    .select('id')
                    .single();

                if (metaError) {
                    console.warn(`[kickstart] video_metadata upsert error for ${video.id}:`, metaError.message);
                    continue;
                }

                // Insert video_metrics snapshot
                await supabaseAdmin.from('video_metrics').insert({
                    video_id: metaRow.id,
                    view_count: Number(video.statistics?.viewCount || 0),
                    like_count: Number(video.statistics?.likeCount || 0),
                    comment_count: Number(video.statistics?.commentCount || 0),
                    recorded_at: new Date().toISOString()
                });

                savedCount++;
            } catch (e: any) {
                console.warn(`[kickstart] Error saving video ${video.id}:`, e.message);
            }
        }

        console.log(`[kickstart] ✅ DONE: ${savedCount}/${videos.length} videos saved`);

        return new Response(JSON.stringify({
            success: true,
            channel: {
                title: ch.snippet.title,
                id: ch.id,
                subs: Number(ch.statistics.subscriberCount),
                totalViews: Number(ch.statistics.viewCount),
                videoCount: Number(ch.statistics.videoCount)
            },
            videos: savedCount,
            message: `Base de datos poblada con ${savedCount} videos del canal "${ch.snippet.title}".`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[kickstart] FATAL:", error);

        const code = error.message?.startsWith('TOKEN_') ? 401 : 500;
        return new Response(JSON.stringify({
            error: error.message,
            code
        }), {
            status: code === 401 ? 200 : 500, // Return 200 for auth errors so frontend gets the message
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

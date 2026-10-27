import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

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

export interface GoogleTokenResult {
    accessToken: string | null;
    userId: string | null;
    isOAuth: boolean;
    error?: string;
}

/**
 * Retrieves a valid, unexpired Google / YouTube OAuth access token for the requesting user.
 * Automatically refreshes the token using Google OAuth if it is expired or expiring in < 5 minutes.
 * Falls back to server YOUTUBE_API_KEY if no user token is available.
 */
export async function getValidGoogleToken(req: Request): Promise<GoogleTokenResult> {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";

    if (!authHeader) {
        return { accessToken: null, userId: null, isOAuth: false };
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            return { accessToken: null, userId: null, isOAuth: false, error: userError?.message };
        }

        const { data: integration, error: dbError } = await supabaseAdmin
            .from("user_integrations")
            .select("access_token, refresh_token, expires_at, platform")
            .eq("user_id", user.id)
            .in("platform", ["google", "youtube"])
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (dbError || !integration?.access_token) {
            return { accessToken: null, userId: user.id, isOAuth: false };
        }

        let accessToken = await decrypt(integration.access_token, encryptionKey);
        const expiresAt = integration.expires_at ? new Date(integration.expires_at) : new Date(0);
        const now = new Date();

        // Refresh if expired or expiring within 5 minutes (300 seconds)
        if (expiresAt.getTime() - now.getTime() < 300 * 1000) {
            console.log(`[google-tokens] Token for user ${user.id} expired or expiring soon. Refreshing...`);

            if (integration.refresh_token) {
                const refreshToken = await decrypt(integration.refresh_token, encryptionKey);
                const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
                const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

                if (clientId && clientSecret) {
                    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: clientId,
                            client_secret: clientSecret,
                            refresh_token: refreshToken,
                            grant_type: "refresh_token",
                        }),
                    });

                    const refreshData = await refreshRes.json();

                    if (refreshData.access_token) {
                        accessToken = refreshData.access_token;
                        const newEncryptedToken = await encrypt(accessToken, encryptionKey);
                        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

                        const updatePayload: Record<string, any> = {
                            access_token: newEncryptedToken,
                            expires_at: newExpiresAt,
                            updated_at: new Date().toISOString()
                        };

                        if (refreshData.refresh_token) {
                            updatePayload.refresh_token = await encrypt(refreshData.refresh_token, encryptionKey);
                        }

                        await supabaseAdmin
                            .from("user_integrations")
                            .update(updatePayload)
                            .eq("user_id", user.id)
                            .eq("platform", integration.platform);

                        console.log(`[google-tokens] Successfully refreshed Google token for user ${user.id}`);
                    } else {
                        console.warn(`[google-tokens] Refresh failed: ${JSON.stringify(refreshData)}`);
                        // Token might be revoked, do not return bad token so caller can fallback
                        return { accessToken: null, userId: user.id, isOAuth: false, error: "REFRESH_FAILED" };
                    }
                }
            } else {
                console.warn(`[google-tokens] No refresh_token found for user ${user.id}`);
                return { accessToken: null, userId: user.id, isOAuth: false, error: "NO_REFRESH_TOKEN" };
            }
        }

        return {
            accessToken,
            userId: user.id,
            isOAuth: true
        };
    } catch (err: any) {
        console.error("[google-tokens] Exception resolving user token:", err);
        return { accessToken: null, userId: null, isOAuth: false, error: err.message };
    }
}

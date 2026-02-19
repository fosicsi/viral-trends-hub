import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

export async function getUserApiKey(supabaseClient: any, userId: string, platform: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseClient
            .from('user_api_keys')
            .select('encrypted_key')
            .eq('user_id', userId)
            .eq('platform', platform)
            .maybeSingle();

        if (error || !data) return null;

        const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
        return await decrypt(data.encrypted_key, encryptionKey);
    } catch (err) {
        console.error(`Error fetching/decrypting key for ${platform}:`, err);
        return null;
    }
}

async function decrypt(hexStr: string, secret: string): Promise<string> {
    const data = decodeHex(hexStr);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);

    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    const key = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

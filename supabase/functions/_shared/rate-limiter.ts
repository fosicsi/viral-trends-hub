// supabase/functions/_shared/rate-limiter.ts
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface RateLimitConfig {
    maxRequests: number; // Max requests allowed
    windowSeconds: number; // Time window in seconds
}

/**
 * Checks if a user has exceeded the rate limit for a specific endpoint.
 * Returns true if allowed, throws an error if blocked.
 */
export async function checkRateLimit(
    supabaseAdmin: SupabaseClient,
    userId: string,
    endpoint: string,
    config: RateLimitConfig = { maxRequests: 5, windowSeconds: 60 }
): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .from('api_rate_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('endpoint', endpoint)
            .maybeSingle();

        if (error) {
            console.error('[Rate Limiter] DB Error:', error);
            return true; // Fail open if db error so we don't block legit traffic on glitches
        }

        const now = new Date();

        if (!data) {
            // First time request
            await supabaseAdmin.from('api_rate_limits').insert({
                user_id: userId,
                endpoint,
                request_count: 1,
                last_request_at: now.toISOString()
            });
            return true;
        }

        const lastRequest = new Date(data.last_request_at);
        const elapsedSeconds = (now.getTime() - lastRequest.getTime()) / 1000;

        if (elapsedSeconds > config.windowSeconds) {
            // Window expired, reset counter
            await supabaseAdmin.from('api_rate_limits')
                .update({ request_count: 1, last_request_at: now.toISOString() })
                .eq('user_id', userId)
                .eq('endpoint', endpoint);
            return true;
        } else {
            // Inside window, check limit
            if (data.request_count >= config.maxRequests) {
                console.warn(`[Rate Limiter] Blocked ${userId} on ${endpoint}. Count: ${data.request_count}`);
                return false; // Rate limit exceeded!
            } else {
                // Increment counter
                await supabaseAdmin.from('api_rate_limits')
                    .update({
                        request_count: data.request_count + 1,
                        last_request_at: now.toISOString() // update timestamp or keep original? Update so the window rolls
                    })
                    .eq('user_id', userId)
                    .eq('endpoint', endpoint);
                return true;
            }
        }
    } catch (e) {
        console.error('[Rate Limiter] Unexpected error:', e);
        return true; // Fail open
    }
}

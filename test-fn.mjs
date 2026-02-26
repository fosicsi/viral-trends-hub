import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // fallback

const SUPABASE_URL = 'https://fxopuxtsvlgpzzicuyao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3B1eHRzdmxncHp6aWN1eWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjAyNDIsImV4cCI6MjA4NTI5NjI0Mn0.yvCN_Hlr4iKlHIWwv35poWXl0nZcaq_UniB7Jh5a5LE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        const email = `dummy_${Date.now()}@gmail.com`;
        const password = 'Password123!';

        console.log("Signing up dummy user...");
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error("Auth Error:", authError);
            return;
        }

        // We might need to sign in but signUp auto-signs in if email confirm disabled
        let token = authData.session?.access_token;

        if (!token) {
            console.log("Sign up didn't return session, logging in dummy user: adrian@test.com ?");
            // User might have sign-up email confirmation enabled. If so, signing up will return session=null.
            return;
        }

        console.log("Calling ai-creator-studio...");
        const { data, error } = await supabase.functions.invoke('ai-creator-studio', {
            body: { topic: 'Testing YouTube Analytics', format: 'short' }
        });

        if (error) {
            console.error("Invoke Error:", error);

            // standard fetch to get the raw body
            const res = await globalThis.fetch(`${SUPABASE_URL}/functions/v1/ai-creator-studio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic: 'Testing', format: 'short' })
            });

            console.log("Raw Status:", res.status);
            console.log("Raw Response:", await res.text());
        } else {
            console.log("Success:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

run();

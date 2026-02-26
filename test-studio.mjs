import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Signing in as dummy user...");
    // Let's try to sign up or use a dummy request
    // We can just use the anon key in Authorization to get a 401,
    // or we can test an OPTIONS request for CORS!

    console.log("1) Testing OPTIONS (CORS) preflight...");
    try {
        const preflight = await fetch(`${SUPABASE_URL}/functions/v1/ai-creator-studio`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization, content-type'
            }
        });
        console.log("OPTIONS Status:", preflight.status);
        console.log("OPTIONS Headers:", Object.fromEntries(preflight.headers.entries()));
    } catch (e) {
        console.error("OPTIONS ERR:", e);
    }

    console.log("\n2) Testing POST with Dummy Auth...");
    try {
        // Sign up a dummy user to get a real token
        const email = `tester${Math.floor(Math.random() * 10000)}@gmail.com`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
            email,
            password: 'SecurePassword123!'
        });

        let token = authData?.session?.access_token;
        if (authErr && authErr.message.includes('already registered')) {
            const { data: loginData } = await supabase.auth.signInWithPassword({ email, password: 'SecurePassword123!' });
            token = loginData?.session?.access_token;
        }

        if (!token) {
            console.error("Could not obtain auth token", authErr);
            return;
        }

        const postReq = await fetch(`${SUPABASE_URL}/functions/v1/ai-creator-studio`, {
            method: 'POST',
            headers: {
                'Origin': 'http://localhost:5173',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'generate_production_kit', topic: 'test via cli', format: 'short', duration: 1 })
        });
        console.log("POST Auth Status:", postReq.status);
        const text = await postReq.text();
        console.log("POST Auth Body:", text);
    } catch (e) {
        console.error("POST ERR:", e);
    }
}

test();

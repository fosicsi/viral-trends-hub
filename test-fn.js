import fetch from 'node-fetch'; // if missing, use built-in fetch in node 18+

const URL = 'https://fxopuxtsvlgpzzicuyao.supabase.co/functions/v1/ai-creator-studio';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3B1eHRzdmxncHp6aWN1eWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjAyNDIsImV4cCI6MjA4NTI5NjI0Mn0.yvCN_Hlr4iKlHIWwv35poWXl0nZcaq_UniB7Jh5a5LE';

// We need a valid JWT token. We can sign up a dummy user or login and get a token.
// For now, let's see what the edge function returns without a valid token (should be 500 Invalid User Token)
async function run() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({
                topic: 'Test topic',
                format: 'short'
            })
        });

        console.log("Status:", res.status);
        console.log("Body:", await res.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

run();

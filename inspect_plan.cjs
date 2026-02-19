
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectPlan() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session user:", session?.user?.id);

    if (!session) {
        console.log("No session found. Make sure .env has valid credentials or run this in a context with auth.");
        return;
    }

    const { data, error } = await supabase
        .from('content_creation_plan')
        .select('*');

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    console.log(`Found ${data.length} items in content_creation_plan total.`);
    console.log("Items for current user:", data.filter(d => d.user_id === session.user.id).length);
    console.log("Sample items (first 2):", data.slice(0, 2).map(d => ({ id: d.id, user_id: d.user_id, title: d.title })));
}

inspectPlan();

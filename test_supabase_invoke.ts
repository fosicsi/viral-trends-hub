import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envData = fs.readFileSync('.env', 'utf-8');
const anonMatch = envData.match(/VITE_SUPABASE_ANON_KEY=([^\n]+)/);
const urlMatch = envData.match(/VITE_SUPABASE_URL=([^\n]+)/);

const anonKey = anonMatch ? anonMatch[1].trim().replace(/['"]/g, '') : '';
const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';

async function testSupabaseJs() {
    const supabase = createClient(url, anonKey);

    console.log("Calling ai-storyboard-generator via supabase-js invoke...");
    const { data, error } = await supabase.functions.invoke('ai-storyboard-generator', {
        body: { visualDescription: 'Test' }
    });

    console.log("Data:", data);
    console.log("Error:", error);
}

testSupabaseJs();

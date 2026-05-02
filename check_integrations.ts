import { createClient } from 'npm:@supabase/supabase-js';
const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const { data, error } = await supabase.from('user_integrations').select('platform, created_at, updated_at, expires_at');
console.log(data, error);

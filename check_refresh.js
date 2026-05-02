import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('user_integrations').select('id, user_id, updated_at, refresh_token').eq('id', 'c5d60fc3-dbb7-4cdd-8ec2-3e28acc28a47');
  console.log("Has refresh token?", !!data[0]?.refresh_token);
}
run();

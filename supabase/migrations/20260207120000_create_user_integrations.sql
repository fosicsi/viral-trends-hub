create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('youtube', 'gemini')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

alter table public.user_integrations enable row level security;

create policy "Users can view their own integrations"
  on public.user_integrations for select
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.user_integrations for delete
  using (auth.uid() = user_id);

-- Only service role (Edge Functions) can insert/update for security, 
-- or we can allow users if we trust the client logic (but better to keep token writes to server-side)
-- For now, we'll allow Edge Functions (service_role) full access, and users read-only.
-- But wait, if we use supabase-js in Edge Function with service key, it bypasses RLS.
-- If we use supabase-js with user token, we need INSERT policy.
-- The plan is: Edge Function handles the exchange and inserts/updates. 
-- Best practice: Edge Function uses service_role key to write to this table to ensure encryption happens.
-- So verify NO insert/update policy for public/authenticated users.

create policy "Service role has full access"
  on public.user_integrations
  using (true)
  with check (true);

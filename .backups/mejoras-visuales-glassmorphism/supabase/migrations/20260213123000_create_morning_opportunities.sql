-- Create table for daily opportunities cache
create table if not exists public.morning_opportunities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  data jsonb not null default '[]'::jsonb, -- Stores the top 5 video items + AI reasoning
  keyword_used text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: Only one entry per user per day
create unique index if not exists morning_opportunities_user_date_idx on public.morning_opportunities(user_id, date);

-- Enable RLS
alter table public.morning_opportunities enable row level security;

-- Policies
create policy "Users can view their own morning opportunities"
  on public.morning_opportunities for select
  using (auth.uid() = user_id);

create policy "Users can update their own morning opportunities"
  on public.morning_opportunities for insert
  with check (auth.uid() = user_id);

-- Also allow update if needed
create policy "Users can modify their own morning opportunities"
  on public.morning_opportunities for update
  using (auth.uid() = user_id);

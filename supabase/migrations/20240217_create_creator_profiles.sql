-- Create creator_profiles table
create table if not exists public.creator_profiles (
  user_id uuid references auth.users on delete cascade primary key,
  niche text,
  goals text,
  experience_level text check (experience_level in ('newbie', 'intermediate', 'pro')),
  content_frequency text,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.creator_profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.creator_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.creator_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.creator_profiles for update
  using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_creator_profiles_updated
  before update on public.creator_profiles
  for each row
  execute procedure public.handle_updated_at();

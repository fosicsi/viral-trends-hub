-- Create table for User Identity (Smart Niche)
CREATE TABLE IF NOT EXISTS public.user_channel_identities (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_channel_identities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own identity" 
ON public.user_channel_identities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own identity" 
ON public.user_channel_identities FOR ALL 
USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.user_channel_identities TO authenticated;
GRANT ALL ON public.user_channel_identities TO service_role;

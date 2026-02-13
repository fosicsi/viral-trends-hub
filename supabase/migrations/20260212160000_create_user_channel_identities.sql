-- Create table for storing the "Memory" of the channel's identity
CREATE TABLE IF NOT EXISTS public.user_channel_identities (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'youtube',
  identity_profile JSONB NOT NULL, -- { tema_principal, estilo, publico, formato, keywords, recent_videos }
  last_learned_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_channel_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own identity"
  ON public.user_channel_identities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage identities"
  ON public.user_channel_identities
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_identities_user ON public.user_channel_identities(user_id);

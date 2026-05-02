-- Create YouTube Data Layer Tables
-- Based on the "Fetch & Cache" Architecture for INTELLITUBE

-- Enable required extensions just in case (pgcrypto is usually enabled but good practice)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Youtube Channels Table (Identity & Sync Status)
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    youtube_channel_id VARCHAR(255) NOT NULL,
    channel_title VARCHAR(255),
    thumbnail_url TEXT,
    
    -- OAuth Credentials (Encrypted)
    -- access_token is typically short-lived and might be refreshed on-demand or by cron
    -- We store them encrypted. The application backend holds the encryption key.
    access_token TEXT,
    refresh_token TEXT NOT NULL, 
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync Control
    last_synced_at TIMESTAMP WITH TIME ZONE,
    webhook_active BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_channel_per_user UNIQUE (user_id, youtube_channel_id)
);

-- 2. Video Metadata Table (Static Content)
CREATE TABLE IF NOT EXISTS public.video_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.youtube_channels(id) ON DELETE CASCADE,
    youtube_video_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration VARCHAR(50), -- ISO 8601 duration
    tags JSONB,           -- Array of tags
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_video_per_channel UNIQUE (channel_id, youtube_video_id)
);

-- 3. Video Metrics Table (Time-Series Data)
CREATE TABLE IF NOT EXISTS public.video_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.video_metadata(id) ON DELETE CASCADE,
    
    -- Core Metrics
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    estimated_minutes_watched BIGINT DEFAULT 0,
    
    -- Snapshot Time
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_youtube_channels_user_id ON public.youtube_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_video_metadata_channel_id ON public.video_metadata(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_metadata_youtube_id ON public.video_metadata(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_video_metrics_video_id ON public.video_metrics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_metrics_recorded_at ON public.video_metrics(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Youtube Channels: Users can only see/edit their own channels
CREATE POLICY "Users can view own channels" 
ON public.youtube_channels FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own channels" 
ON public.youtube_channels FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels" 
ON public.youtube_channels FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own channels" 
ON public.youtube_channels FOR DELETE 
USING (auth.uid() = user_id);

-- Video Metadata: Users can see metadata for channels they own
CREATE POLICY "Users can view own video metadata" 
ON public.video_metadata FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.youtube_channels 
        WHERE id = public.video_metadata.channel_id 
        AND user_id = auth.uid()
    )
);

-- Video Metrics: Users can see metrics for videos they own
CREATE POLICY "Users can view own video metrics" 
ON public.video_metrics FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.video_metadata 
        JOIN public.youtube_channels ON public.youtube_channels.id = public.video_metadata.channel_id
        WHERE public.video_metadata.id = public.video_metrics.video_id 
        AND public.youtube_channels.user_id = auth.uid()
    )
);

-- Service Role Policies (for Edge Functions/Workers)
-- Allow service role full access
CREATE POLICY "Service role full access channels" 
ON public.youtube_channels FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access metadata" 
ON public.video_metadata FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access metrics" 
ON public.video_metrics FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

-- Updated_at Trigger Function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER set_updated_at_youtube_channels
BEFORE UPDATE ON public.youtube_channels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_video_metadata
BEFORE UPDATE ON public.video_metadata
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

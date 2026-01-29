-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  thumbnail text NOT NULL,
  channel text NOT NULL,
  views bigint NOT NULL DEFAULT 0,
  channel_subscribers bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT videos_youtube_video_id_key UNIQUE (youtube_video_id)
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Public read access (as previously intended for public-facing content)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'videos'
      AND policyname = 'Videos are publicly readable'
  ) THEN
    CREATE POLICY "Videos are publicly readable"
    ON public.videos
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow inserts from the app (anon/auth) since the current UI writes directly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'videos'
      AND policyname = 'Videos can be inserted from the app'
  ) THEN
    CREATE POLICY "Videos can be inserted from the app"
    ON public.videos
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;
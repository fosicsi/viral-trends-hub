-- Add channel_subscribers column to videos table
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS channel_subscribers integer;

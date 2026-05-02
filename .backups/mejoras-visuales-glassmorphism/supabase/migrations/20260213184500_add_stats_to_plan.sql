-- Add statistics columns to content_creation_plan for sorting in Saved View
ALTER TABLE public.content_creation_plan 
ADD COLUMN IF NOT EXISTS source_views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_channel_subs BIGINT DEFAULT 0;

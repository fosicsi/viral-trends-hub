
-- Add script_content column to content_creation_plan
ALTER TABLE public.content_creation_plan 
ADD COLUMN IF NOT EXISTS script_content JSONB DEFAULT NULL;

-- Ensure status can handle 'script_generated' if not already
-- (status is text, so it's fine, but good to note)

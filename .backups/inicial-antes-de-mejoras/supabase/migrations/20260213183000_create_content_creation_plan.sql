-- Create table for Content Creation Plan (Ideas & Scripts)
CREATE TABLE IF NOT EXISTS public.content_creation_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source Inspiration
  source_video_id TEXT, -- YouTube ID
  source_title TEXT,
  source_thumbnail TEXT,
  source_channel TEXT,
  
  -- Plan Details
  title TEXT NOT NULL, -- User's working title
  status TEXT NOT NULL DEFAULT 'idea', -- idea, scripting, filming, editing, published
  
  -- AI Generated Content
  script_content JSONB, -- { hook: "...", body: "...", cta: "..." }
  ai_suggestions TEXT, -- General notes from AI
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_creation_plan ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own content plan" 
ON public.content_creation_plan FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content plan" 
ON public.content_creation_plan FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content plan" 
ON public.content_creation_plan FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content plan" 
ON public.content_creation_plan FOR DELETE 
USING (auth.uid() = user_id);

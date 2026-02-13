-- Create table for storing AI-generated content insights
CREATE TABLE IF NOT EXISTS ai_content_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input data snapshots (what data was used to generate this)
  channel_stats JSONB NOT NULL,        -- {subs, views, avgRetention, topTraffic}
  viral_outliers JSONB NOT NULL,       -- Top outliers detected at that moment
  
  -- AI-generated recommendations
  recommendations JSONB NOT NULL,      -- Array of specific recommendations
  confidence_score FLOAT,              -- 0-100 overall confidence
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,     -- When this insight is considered "stale"
  model_version TEXT DEFAULT '1.0',
  
  -- Ensure we don't duplicate active insights for the same user too often
  -- We can have multiple history records, but maybe we want to query by generated_at
  CONSTRAINT unique_user_insight_time UNIQUE(user_id, generated_at)
);

-- Enable Row Level Security
ALTER TABLE ai_content_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own insights
CREATE POLICY "Users can read own insights"
  ON ai_content_insights FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert/update (for the Edge Function)
CREATE POLICY "Service role can manage insights"
  ON ai_content_insights
  USING (true)
  WITH CHECK (true);

-- Index for faster queries by user and expiration
CREATE INDEX idx_ai_insights_user_expires ON ai_content_insights(user_id, expires_at);

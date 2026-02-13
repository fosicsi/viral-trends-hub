-- Allow authenticated users to insert their own insights
-- This is necessary so the Edge Function can write results using the user's JWT instead of the service_role key
CREATE POLICY "Users can insert own insights"
  ON ai_content_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify existing policies (optional, just ensuring SELECT is there)
-- The previous migration already added "Users can read own insights" for SELECT

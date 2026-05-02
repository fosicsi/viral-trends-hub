-- Create youtube_analytics_cache table for storing cached YouTube Analytics data
-- This reduces direct calls to YouTube API and improves performance

CREATE TABLE youtube_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('stats', 'reports', 'traffic', 'audience')),
  date_range TEXT, -- '7d', '28d', '90d', '365d', 'all' (null for global stats)
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique cache entries per user/type/range combination
  UNIQUE(user_id, data_type, date_range)
);

-- Index for fast lookups by user and data type
CREATE INDEX idx_analytics_cache_user ON youtube_analytics_cache(user_id, data_type);

-- Index for expiry-based cleanup queries
CREATE INDEX idx_analytics_cache_expiry ON youtube_analytics_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE youtube_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own cache entries
CREATE POLICY "Users can read own analytics cache"
  ON youtube_analytics_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all cache entries (for collector service)
CREATE POLICY "Service role can manage analytics cache"
  ON youtube_analytics_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_analytics_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER trigger_update_analytics_cache_updated_at
  BEFORE UPDATE ON youtube_analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_cache_updated_at();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM youtube_analytics_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE youtube_analytics_cache IS 'Cache table for YouTube Analytics API responses to reduce API calls and improve performance';
COMMENT ON COLUMN youtube_analytics_cache.data_type IS 'Type of cached data: stats (channel statistics), reports (analytics reports), traffic (traffic sources), audience (subscriber vs non-subscriber)';
COMMENT ON COLUMN youtube_analytics_cache.date_range IS 'Date range for reports (e.g., 7d, 28d). NULL for global stats that don''t have a time range';
COMMENT ON COLUMN youtube_analytics_cache.expires_at IS 'Cache expiration timestamp. Data should be refreshed after this time';
COMMENT ON FUNCTION cleanup_expired_analytics_cache() IS 'Utility function to remove expired cache entries. Can be called manually or via scheduled job';

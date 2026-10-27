-- Remove restrictive data_type check on youtube_analytics_cache to allow search, morning_opportunities and custom caches
ALTER TABLE IF EXISTS public.youtube_analytics_cache DROP CONSTRAINT IF EXISTS youtube_analytics_cache_data_type_check;

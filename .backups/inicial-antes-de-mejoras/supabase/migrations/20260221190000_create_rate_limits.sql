-- Migration to add a simple rate limiting table for AI Edge Functions
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    last_request_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, endpoint)
);

-- RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow only service role / edge functions to modify this table directly
CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

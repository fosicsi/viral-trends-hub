-- Drop the old constraint
ALTER TABLE public.user_integrations DROP CONSTRAINT IF EXISTS user_integrations_platform_check;

-- Add new constraint including 'google'
ALTER TABLE public.user_integrations ADD CONSTRAINT user_integrations_platform_check 
CHECK (platform IN ('youtube', 'gemini', 'google'));

-- Replace overly permissive INSERT policy
DROP POLICY IF EXISTS "Videos can be inserted from the app" ON public.videos;

CREATE POLICY "Videos can be inserted from the app"
ON public.videos
FOR INSERT
WITH CHECK (
  youtube_video_id IS NOT NULL AND length(trim(youtube_video_id)) > 0
  AND title IS NOT NULL AND length(trim(title)) > 0
  AND url IS NOT NULL AND length(trim(url)) > 0
);
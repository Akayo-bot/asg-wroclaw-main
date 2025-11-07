-- Fix the function security issue by setting search_path
CREATE OR REPLACE FUNCTION public.get_site_settings()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(s)::jsonb
  FROM public.site_settings s
  ORDER BY created_at DESC
  LIMIT 1;
$$;
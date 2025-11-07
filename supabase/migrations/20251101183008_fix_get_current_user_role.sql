-- Fix get_current_user_role function to use profiles.id instead of profiles.user_id
-- This fixes the "column p.user_id does not exist" error when RLS policies call this function
-- After migration 20250928112001, profiles.id = profiles.user_id, so we should use PRIMARY KEY (id)

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_current_user_role IS 'Gets current user role using profiles.id (PRIMARY KEY) instead of profiles.user_id for better performance';


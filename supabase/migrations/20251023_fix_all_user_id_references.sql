-- Fix all references from profiles.user_id to profiles.id
-- This migration updates all functions and policies to use the correct field

-- ============================================
-- 1. Fix sync_user_profile function
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_user_profile(_user_id uuid, _email text, _display_name text DEFAULT NULL, _avatar_url text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profile profiles%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = _user_id;
  
  IF existing_profile.id IS NULL THEN
    INSERT INTO public.profiles (id, user_id, display_name, preferred_language, role)
    VALUES (
      _user_id,
      _user_id,
      COALESCE(_display_name, split_part(_email, '@', 1)),
      'uk',
      'user'
    );
    
    result := jsonb_build_object(
      'action', 'created',
      'user_id', _user_id,
      'email', _email,
      'role', 'user'
    );
  ELSE
    IF _display_name IS NOT NULL OR _avatar_url IS NOT NULL THEN
      UPDATE public.profiles 
      SET 
        display_name = COALESCE(_display_name, display_name),
        avatar_url = COALESCE(_avatar_url, avatar_url),
        updated_at = now()
      WHERE id = _user_id;
    END IF;
    
    result := jsonb_build_object(
      'action', 'updated',
      'user_id', _user_id,
      'email', _email,
      'role', existing_profile.role
    );
  END IF;
  
  RETURN result;
END;
$$;

-- ============================================
-- 2. Fix has_admin_access function
-- ============================================
CREATE OR REPLACE FUNCTION public.has_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
$$;

-- ============================================
-- 3. Fix RLS policies for role_changes
-- ============================================
DROP POLICY IF EXISTS "Admins can view role change history" ON public.role_changes;
DROP POLICY IF EXISTS "Admins can insert role changes" ON public.role_changes;

CREATE POLICY "Admins can view role change history"
ON public.role_changes FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Admins can insert role changes"
ON public.role_changes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  )
);

-- Add comments for documentation
COMMENT ON FUNCTION public.sync_user_profile IS 'Syncs user profile from auth.users, uses profiles.id as primary lookup';
COMMENT ON FUNCTION public.has_admin_access IS 'Checks if current user has admin or superadmin role using profiles.id';




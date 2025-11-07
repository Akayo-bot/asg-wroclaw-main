-- Phase 1: Profile ID synchronization and RLS improvements (Fixed)

-- Create utility function to check admin access (fixed type issue)
CREATE OR REPLACE FUNCTION public.has_admin_access(role_name text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    role_name, 
    (SELECT role::text FROM public.profiles WHERE user_id = auth.uid())
  ) IN ('admin', 'superadmin');
$$;

-- Create function to sync profile IDs (fixes profile.id != profile.user_id issues)
CREATE OR REPLACE FUNCTION public.fix_profile_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profiles where id != user_id to have matching IDs
  UPDATE public.profiles 
  SET id = user_id 
  WHERE id != user_id;
  
  -- Handle any duplicate conflicts by keeping the one with matching ID
  DELETE FROM public.profiles p1
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = p1.user_id 
    AND p2.id = p2.user_id 
    AND p1.id != p1.user_id
  );
END;
$$;

-- Execute the fix
SELECT public.fix_profile_ids();

-- Create function for SUPERADMIN emergency promotion
CREATE OR REPLACE FUNCTION public.ensure_superadmin_exists(emergency_email text DEFAULT 'valera.dreus2001@gmail.com')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  superadmin_count integer;
  emergency_user_id uuid;
  result jsonb;
BEGIN
  -- Check if any superadmin exists
  SELECT COUNT(*) INTO superadmin_count
  FROM public.profiles 
  WHERE role = 'superadmin';
  
  -- If no superadmin exists and emergency user is logged in
  IF superadmin_count = 0 AND auth.uid() IS NOT NULL THEN
    -- Check if current user has the emergency email
    SELECT id INTO emergency_user_id
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = emergency_email;
    
    IF emergency_user_id IS NOT NULL THEN
      -- Promote current user to superadmin
      INSERT INTO public.profiles (id, user_id, role, display_name)
      VALUES (emergency_user_id, emergency_user_id, 'superadmin', 'Emergency SuperAdmin')
      ON CONFLICT (user_id) DO UPDATE SET 
        role = 'superadmin',
        id = emergency_user_id,
        updated_at = now();
      
      -- Update JWT metadata
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
          jsonb_build_object('role', 'superadmin')
      WHERE id = emergency_user_id;
      
      result := jsonb_build_object(
        'success', true,
        'message', 'Emergency superadmin promotion successful',
        'user_id', emergency_user_id
      );
    ELSE
      result := jsonb_build_object('success', false, 'message', 'Unauthorized emergency promotion');
    END IF;
  ELSE
    result := jsonb_build_object('success', false, 'message', 'Superadmin already exists or no user logged in');
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to sync role between DB and JWT
CREATE OR REPLACE FUNCTION public.sync_role_to_jwt(target_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_to_sync uuid;
  db_role text;
  result jsonb;
BEGIN
  -- Use provided user_id or current user
  user_id_to_sync := COALESCE(target_user_id, auth.uid());
  
  IF user_id_to_sync IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No user specified');
  END IF;
  
  -- Get role from database
  SELECT role::text INTO db_role
  FROM public.profiles 
  WHERE user_id = user_id_to_sync;
  
  IF db_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Update JWT metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', db_role)
  WHERE id = user_id_to_sync;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_id_to_sync,
    'role', db_role,
    'message', 'JWT role synchronized with database'
  );
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;

-- Create improved RLS policies for profiles
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid() OR 
  public.has_admin_access()
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  id = auth.uid()
);

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING (
  user_id = auth.uid() OR 
  public.has_admin_access()
)
WITH CHECK (
  (user_id = auth.uid() AND id = auth.uid()) OR 
  public.has_admin_access()
);

-- Add constraint to prevent ID mismatches in future
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_user_id_match;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_user_id_match 
CHECK (id = user_id);

-- Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.role_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  old_role user_role,
  new_role user_role NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reason text
);

-- Enable RLS on audit table
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role change history"
ON public.role_changes FOR SELECT
USING (public.has_admin_access());

CREATE POLICY "Admins can insert role changes"
ON public.role_changes FOR INSERT
WITH CHECK (public.has_admin_access());
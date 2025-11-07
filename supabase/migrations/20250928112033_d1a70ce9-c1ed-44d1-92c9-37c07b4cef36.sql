-- Fix security warnings for functions without search_path set

-- Fix has_admin_access function
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

-- Fix ensure_superadmin_exists function
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

-- Fix sync_role_to_jwt function
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
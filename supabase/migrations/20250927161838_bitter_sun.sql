/*
  # SuperAdmin Protection System

  1. Security Enhancements
    - Ensure SuperAdmin role exists and is protected
    - Add recovery mechanisms for admin access
    - Prevent accidental admin privilege loss

  2. Recovery Functions
    - Emergency admin recovery function
    - SuperAdmin protection checks
    - Fallback admin assignment
*/

-- Ensure SuperAdmin role exists (already added in previous migration)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Create function to ensure at least one SuperAdmin exists
CREATE OR REPLACE FUNCTION public.ensure_superadmin_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  superadmin_count INTEGER;
  fallback_user_id UUID;
BEGIN
  -- Check if any SuperAdmin exists
  SELECT COUNT(*) INTO superadmin_count
  FROM public.profiles
  WHERE role = 'superadmin';

  -- If no SuperAdmin exists, try to create one from environment fallback
  IF superadmin_count = 0 THEN
    -- Try to find user by specific email (fallback)
    SELECT user_id INTO fallback_user_id
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'valera.dreus2001@gmail.com'
    LIMIT 1;

    -- If found, promote to SuperAdmin
    IF fallback_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET role = 'superadmin', updated_at = now()
      WHERE user_id = fallback_user_id;
      
      RAISE NOTICE 'Emergency SuperAdmin created for user: %', fallback_user_id;
    END IF;
  END IF;
END;
$$;

-- Enhanced role change function with SuperAdmin protection
CREATE OR REPLACE FUNCTION public.change_user_role(target_email text, new_role user_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  current_user_role user_role;
  target_current_role user_role;
  superadmin_count INTEGER;
  result jsonb;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Only SuperAdmin and Admin can change roles
  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Find target user
  SELECT u.id, p.role INTO target_user_id, target_current_role
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Protect SuperAdmin role
  IF target_current_role = 'superadmin' THEN
    -- Count total SuperAdmins
    SELECT COUNT(*) INTO superadmin_count
    FROM public.profiles
    WHERE role = 'superadmin';

    -- Prevent removing the last SuperAdmin
    IF superadmin_count <= 1 AND new_role != 'superadmin' THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Cannot remove the last SuperAdmin. System requires at least one SuperAdmin.'
      );
    END IF;

    -- Only SuperAdmin can modify other SuperAdmins
    IF current_user_role != 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can modify SuperAdmin roles');
    END IF;
  END IF;

  -- Only SuperAdmin can create new SuperAdmins
  IF new_role = 'superadmin' AND current_user_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can assign SuperAdmin role');
  END IF;

  -- Update user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Role updated successfully',
      'email', target_email,
      'previous_role', target_current_role,
      'new_role', new_role
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update role');
  END IF;
END;
$$;

-- Emergency recovery function (for extreme cases)
CREATE OR REPLACE FUNCTION public.emergency_admin_recovery(recovery_code text, target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  admin_count INTEGER;
  superadmin_count INTEGER;
  assigned_role user_role;
BEGIN
  -- Verify recovery code (in production, this should be a secure hash)
  IF recovery_code != 'RAVEN_EMERGENCY_2024' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid recovery code');
  END IF;

  -- Find target user
  SELECT u.id INTO target_user_id
  FROM auth.users u
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check current admin situation
  SELECT COUNT(*) INTO superadmin_count FROM public.profiles WHERE role = 'superadmin';
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role IN ('superadmin', 'admin');

  -- Determine what role to assign
  IF superadmin_count = 0 THEN
    assigned_role := 'superadmin';
  ELSIF admin_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Admin access already exists in system');
  END IF;

  -- Assign role
  UPDATE public.profiles 
  SET role = assigned_role, updated_at = now()
  WHERE user_id = target_user_id;

  -- Create profile if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, role, display_name)
    VALUES (target_user_id, assigned_role, target_email);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Emergency admin access restored',
    'email', target_email,
    'assigned_role', assigned_role
  );
END;
$$;

-- Function to check SuperAdmin protection status
CREATE OR REPLACE FUNCTION public.get_admin_protection_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'superadmin_count', (SELECT COUNT(*) FROM profiles WHERE role = 'superadmin'),
    'admin_count', (SELECT COUNT(*) FROM profiles WHERE role = 'admin'),
    'total_admin_access', (SELECT COUNT(*) FROM profiles WHERE role IN ('superadmin', 'admin')),
    'current_user_role', (SELECT role FROM profiles WHERE user_id = auth.uid()),
    'system_protected', (SELECT COUNT(*) FROM profiles WHERE role = 'superadmin') > 0
  );
$$;

-- Ensure the system has at least one SuperAdmin on startup
SELECT public.ensure_superadmin_exists();
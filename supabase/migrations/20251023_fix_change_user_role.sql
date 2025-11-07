-- Fix change_user_role function to use profiles.id instead of profiles.user_id
-- After migration 20250928112001, id = user_id, so we should use PRIMARY KEY (id) for better performance

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
  -- Get current user role (using profiles.id since id = user_id after migration)
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Only SuperAdmin and Admin can change roles
  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Find target user
  SELECT u.id, p.role INTO target_user_id, target_current_role
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id  -- Using profiles.id instead of profiles.user_id
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

  -- Prevent self-demotion from superadmin
  IF target_user_id = auth.uid() AND current_user_role = 'superadmin' AND new_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot demote yourself from SuperAdmin');
  END IF;

  -- Update user role (using profiles.id since id = user_id)
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  IF FOUND THEN
    -- Log role change for audit (if table exists)
    BEGIN
      INSERT INTO public.role_changes (target_user_id, old_role, new_role, changed_by)
      VALUES (target_user_id, target_current_role, new_role, auth.uid());
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if role_changes table doesn't exist
      NULL;
    END;

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

-- Also fix get_admin_protection_status function
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
    'current_user_role', (SELECT role FROM profiles WHERE id = auth.uid()),
    'system_protected', (SELECT COUNT(*) FROM profiles WHERE role = 'superadmin') > 0
  );
$$;

-- Add comment
COMMENT ON FUNCTION public.change_user_role IS 
'Change user role by email. Uses profiles.id (PRIMARY KEY) for better performance. 
Updated to work with migration 20250928112001 where id = user_id.';




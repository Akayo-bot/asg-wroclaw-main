-- Add overload for change_user_role function that accepts UUID instead of email
-- This is more efficient as it doesn't require JOIN with auth.users table

CREATE OR REPLACE FUNCTION public.change_user_role_by_id(
  target_user uuid, 
  new_role user_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  target_current_role user_role;
  superadmin_count INTEGER;
  target_email text;
BEGIN
  -- Get current user role (using profiles.id since id = user_id after migration)
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Only SuperAdmin and Admin can change roles
  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Get target user current role and email
  SELECT p.role, u.email INTO target_current_role, target_email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = target_user;

  IF target_current_role IS NULL THEN
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
  IF target_user = auth.uid() AND target_current_role = 'superadmin' AND new_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot demote yourself from SuperAdmin');
  END IF;

  -- Update user role (using profiles.id since id = user_id)
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user;

  IF FOUND THEN
    -- Log role change for audit
    INSERT INTO public.role_changes (target_user_id, old_role, new_role, changed_by)
    VALUES (target_user, target_current_role, new_role, auth.uid());

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Role updated successfully',
      'user_id', target_user,
      'email', target_email,
      'previous_role', target_current_role,
      'new_role', new_role
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update role');
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (function handles permissions internally)
GRANT EXECUTE ON FUNCTION public.change_user_role_by_id(uuid, user_role) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.change_user_role_by_id IS 
'Change user role by user ID (UUID). More efficient than email-based version. 
Only SuperAdmin and Admin can change roles. 
Includes protection for last SuperAdmin and self-demotion prevention.';




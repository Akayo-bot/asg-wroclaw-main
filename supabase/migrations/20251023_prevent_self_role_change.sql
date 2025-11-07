-- Prevent users from changing their own role
-- This is a critical security feature

-- ============================================
-- 1. Update change_user_role function
-- ============================================
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
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  -- Check permissions
  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Get target user
  SELECT u.id, p.role INTO target_user_id, target_current_role
  FROM auth.users u JOIN public.profiles p ON u.id = p.id
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- ✅ NEW: Prevent self role change
  IF target_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot change your own role');
  END IF;

  -- Protect SuperAdmin
  IF target_current_role = 'superadmin' THEN
    SELECT COUNT(*) INTO superadmin_count FROM public.profiles WHERE role = 'superadmin';
    IF superadmin_count <= 1 AND new_role != 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last SuperAdmin');
    END IF;
    IF current_user_role != 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can modify SuperAdmin roles');
    END IF;
  END IF;

  IF new_role = 'superadmin' AND current_user_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can assign SuperAdmin role');
  END IF;

  -- Update role
  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_user_id;

  IF FOUND THEN
    BEGIN
      INSERT INTO public.role_changes (target_user_id, old_role, new_role, changed_by)
      VALUES (target_user_id, target_current_role, new_role, auth.uid());
    EXCEPTION WHEN OTHERS THEN NULL;
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

-- ============================================
-- 2. Update change_user_role_by_id function
-- ============================================
CREATE OR REPLACE FUNCTION public.change_user_role_by_id(target_user uuid, new_role user_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  target_current_role user_role;
  superadmin_count INTEGER;
  result jsonb;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  -- Check permissions
  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- ✅ NEW: Prevent self role change
  IF target_user = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot change your own role');
  END IF;

  -- Get target user current role
  SELECT role INTO target_current_role FROM public.profiles WHERE id = target_user;

  IF target_current_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Protect SuperAdmin
  IF target_current_role = 'superadmin' THEN
    SELECT COUNT(*) INTO superadmin_count FROM public.profiles WHERE role = 'superadmin';
    IF superadmin_count <= 1 AND new_role != 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last SuperAdmin');
    END IF;
    IF current_user_role != 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can modify SuperAdmin roles');
    END IF;
  END IF;

  IF new_role = 'superadmin' AND current_user_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can assign SuperAdmin role');
  END IF;

  -- Update role
  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_user;

  IF FOUND THEN
    INSERT INTO public.role_changes (target_user_id, old_role, new_role, changed_by)
    VALUES (target_user, target_current_role, new_role, auth.uid());

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Role updated successfully',
      'user_id', target_user,
      'previous_role', target_current_role,
      'new_role', new_role
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update role');
  END IF;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.change_user_role IS 'Changes user role by email. Users cannot change their own role.';
COMMENT ON FUNCTION public.change_user_role_by_id IS 'Changes user role by ID. Users cannot change their own role.';

-- Test the protection
DO $$
DECLARE
  my_id uuid;
  test_result jsonb;
BEGIN
  SELECT id INTO my_id FROM public.profiles WHERE id = auth.uid();
  
  IF my_id IS NOT NULL THEN
    -- Try to change own role (should fail)
    SELECT public.change_user_role_by_id(my_id, 'user') INTO test_result;
    
    IF (test_result->>'success')::boolean = false THEN
      RAISE NOTICE '✅ Self role change protection works: %', test_result->>'error';
    ELSE
      RAISE WARNING '⚠️ Self role change protection FAILED!';
    END IF;
  END IF;
END $$;




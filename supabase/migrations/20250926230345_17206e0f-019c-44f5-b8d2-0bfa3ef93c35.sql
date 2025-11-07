-- Promote valera.dreus2001@gmail.com to admin role
UPDATE profiles 
SET role = 'admin', updated_at = now() 
WHERE user_id = 'afa46311-5300-41dd-9927-89e81187d6f7';

-- Create admin utility function to change user roles
CREATE OR REPLACE FUNCTION public.change_user_role(target_email text, new_role user_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  result jsonb;
BEGIN
  -- Check if current user is admin
  IF get_current_user_role() != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can change user roles');
  END IF;

  -- Find user by email
  SELECT u.id INTO target_user_id
  FROM auth.users u
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Update user role
  UPDATE profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Role updated successfully',
      'email', target_email,
      'new_role', new_role
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update role');
  END IF;
END;
$$;
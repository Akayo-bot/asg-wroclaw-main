-- Update existing user valera.dreus2001@gmail.com to admin if exists
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'valera.dreus2001@gmail.com'
);

-- Create function to sync user profile after signup/login
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
  -- Check if profile exists
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE user_id = _user_id;
  
  IF existing_profile.id IS NULL THEN
    -- Create new profile
    INSERT INTO public.profiles (user_id, display_name, preferred_language, role)
    VALUES (
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
    -- Update existing profile if display_name or avatar_url provided
    IF _display_name IS NOT NULL OR _avatar_url IS NOT NULL THEN
      UPDATE public.profiles 
      SET 
        display_name = COALESCE(_display_name, display_name),
        avatar_url = COALESCE(_avatar_url, avatar_url),
        updated_at = now()
      WHERE user_id = _user_id;
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
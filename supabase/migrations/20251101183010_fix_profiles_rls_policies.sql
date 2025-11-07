-- Fix RLS policies for profiles table to use id instead of user_id
-- This ensures consistency with the constraint id = user_id

-- ============================================
-- 1. Drop and recreate RLS policies for profiles
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;

-- Create improved RLS policies using id (PRIMARY KEY) instead of user_id
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() OR   -- Fixed: was user_id = auth.uid()
  public.has_admin_access()
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  id = auth.uid() AND   -- Fixed: use id
  user_id = auth.uid() AND  -- Keep for consistency check
  id = user_id  -- Ensure constraint is maintained
);

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR   -- Fixed: was user_id = auth.uid()
  public.has_admin_access()
)
WITH CHECK (
  (id = auth.uid() AND user_id = auth.uid() AND id = user_id) OR   -- Fixed: use id
  public.has_admin_access()
);

-- Add comments for documentation
COMMENT ON POLICY "Users can view own profile or admins can view all" ON public.profiles IS 'Allows users to view their own profile using profiles.id (PRIMARY KEY)';
COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 'Allows users to insert their own profile with id = user_id constraint';
COMMENT ON POLICY "Users can update own profile or admins can update any" ON public.profiles IS 'Allows users to update their own profile using profiles.id (PRIMARY KEY)';


-- Fix has_admin_access function conflict
-- There are two versions: has_admin_access() and has_admin_access(role_name text)
-- We need to drop both and create a single correct version

-- ============================================
-- 1. Drop all versions of has_admin_access
-- ============================================
DROP FUNCTION IF EXISTS public.has_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.has_admin_access(text) CASCADE;
DROP FUNCTION IF EXISTS public.has_admin_access(role_name text) CASCADE;

-- ============================================
-- 2. Create single correct version using profiles.id
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

-- Add comment for documentation
COMMENT ON FUNCTION public.has_admin_access() IS 'Checks if current user has admin or superadmin role using profiles.id (PRIMARY KEY)';


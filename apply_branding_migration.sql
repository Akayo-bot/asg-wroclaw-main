-- Apply branding restriction migration manually
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "SuperAdmin can manage site settings" ON public.site_settings;

-- Create new policy: Only superadmin can manage site settings
CREATE POLICY "SuperAdmin can manage site settings" ON public.site_settings 
  FOR ALL USING (get_current_user_role() = 'superadmin');

-- Add comment
COMMENT ON POLICY "SuperAdmin can manage site settings" ON public.site_settings IS 
  'Only users with superadmin role can INSERT, UPDATE, and DELETE site settings. All users can SELECT (view) settings.';

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'site_settings' 
AND policyname = 'SuperAdmin can manage site settings';


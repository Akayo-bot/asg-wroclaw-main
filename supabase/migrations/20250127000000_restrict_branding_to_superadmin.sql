-- Restrict branding management to superadmin only
-- This migration updates RLS policies for site_settings to allow only superadmin to manage settings

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

-- Create new policy: Only superadmin can manage site settings
CREATE POLICY "SuperAdmin can manage site settings" ON public.site_settings 
  FOR ALL USING (get_current_user_role() = 'superadmin');

-- Add comment
COMMENT ON POLICY "SuperAdmin can manage site settings" ON public.site_settings IS 
  'Only users with superadmin role can INSERT, UPDATE, and DELETE site settings. All users can SELECT (view) settings.';


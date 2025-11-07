-- Migration: Create RLS policies for activity_log table
-- This migration adds Row Level Security policies to allow admins, editors, and superadmins
-- to insert and read activity logs.

-- Enable RLS on activity_log table (if not already enabled)
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins and editors can insert activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Admins and editors can view activity logs" ON public.activity_log;

-- Policy: Allow admins, editors, and superadmins to insert activity logs
CREATE POLICY "Admins and editors can insert activity logs"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (
    get_current_user_role() IN ('admin'::user_role, 'editor'::user_role, 'superadmin'::user_role)
);

-- Policy: Allow admins, editors, and superadmins to view activity logs
CREATE POLICY "Admins and editors can view activity logs"
ON public.activity_log FOR SELECT
TO authenticated
USING (
    get_current_user_role() IN ('admin'::user_role, 'editor'::user_role, 'superadmin'::user_role)
);

-- Add comments for documentation
COMMENT ON POLICY "Admins and editors can insert activity logs" ON public.activity_log IS 
'Allows authenticated users with admin, editor, or superadmin role to insert activity logs';

COMMENT ON POLICY "Admins and editors can view activity logs" ON public.activity_log IS 
'Allows authenticated users with admin, editor, or superadmin role to view activity logs';


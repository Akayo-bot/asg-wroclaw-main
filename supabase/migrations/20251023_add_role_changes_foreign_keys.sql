-- Add foreign keys to role_changes table for better data integrity and joins

-- Add foreign key for target_user_id
ALTER TABLE public.role_changes
DROP CONSTRAINT IF EXISTS role_changes_target_user_id_fkey;

ALTER TABLE public.role_changes
ADD CONSTRAINT role_changes_target_user_id_fkey
FOREIGN KEY (target_user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add foreign key for changed_by
ALTER TABLE public.role_changes
DROP CONSTRAINT IF EXISTS role_changes_changed_by_fkey;

ALTER TABLE public.role_changes
ADD CONSTRAINT role_changes_changed_by_fkey
FOREIGN KEY (changed_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_role_changes_target_user_id ON public.role_changes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_by ON public.role_changes(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON public.role_changes(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.role_changes IS 'Audit log for all role changes in the system';
COMMENT ON COLUMN public.role_changes.target_user_id IS 'User whose role was changed';
COMMENT ON COLUMN public.role_changes.changed_by IS 'User who performed the role change';
COMMENT ON COLUMN public.role_changes.old_role IS 'Previous role (null for new users)';
COMMENT ON COLUMN public.role_changes.new_role IS 'New role assigned';
COMMENT ON COLUMN public.role_changes.reason IS 'Optional reason for the change';




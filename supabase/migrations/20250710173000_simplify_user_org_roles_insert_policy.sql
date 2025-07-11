-- Drop the current INSERT policy for user_organization_roles
DROP POLICY IF EXISTS "Allow user to insert their own role in a new organization" ON public.user_organization_roles;

-- Add a new, simpler INSERT policy for user_organization_roles
-- This policy allows a user to insert their own role.
CREATE POLICY "Allow user to insert their own role"
ON public.user_organization_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
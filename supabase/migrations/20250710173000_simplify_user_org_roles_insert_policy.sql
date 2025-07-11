-- Drop the current INSERT policy for user_organization_roles
DROP POLICY IF EXISTS "user_org_roles_insert_self" ON public.user_organization_roles;

-- Add a new, simpler INSERT policy for user_organization_roles
-- This policy allows a user to insert their own role.
CREATE POLICY "user_org_roles_insert_self"
ON public.user_organization_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
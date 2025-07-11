-- Drop the current INSERT policy for user_organization_roles


-- Add a new INSERT policy for user_organization_roles
-- This policy allows a user to insert their own role for a new organization.
CREATE POLICY "user_org_roles_insert_self"
ON public.user_organization_roles FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = user_organization_roles.organization_id
    )
);

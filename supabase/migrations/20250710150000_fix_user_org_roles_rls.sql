-- Drop the problematic RLS policy first
DROP POLICY IF EXISTS "Allow organization owners/admins to manage roles" ON public.user_organization_roles;

-- Create a security definer function to check if the user is an owner or admin of a given organization
CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(p_organization_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- Recreate the RLS policy using the new function
CREATE POLICY "Allow organization owners/admins to manage roles"
ON public.user_organization_roles FOR ALL
USING (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);

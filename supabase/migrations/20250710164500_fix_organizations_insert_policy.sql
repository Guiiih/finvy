-- Drop the previous INSERT policy
DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON public.organizations;

-- Add a new INSERT policy for organizations table
CREATE POLICY "Allow users to create organizations and become owner"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = auth.uid()
    AND organization_id = organizations.id
    AND role = 'owner'
  )
);

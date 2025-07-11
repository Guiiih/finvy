-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Allow users to create organizations and become owner" ON public.organizations;

-- Re-add a simple INSERT policy for organizations table
CREATE POLICY "Allow authenticated users to create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);
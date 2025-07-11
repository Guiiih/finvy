-- Drop the INSERT policy for organizations table
DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON public.organizations;
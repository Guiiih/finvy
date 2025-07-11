-- Add INSERT policy for organizations table
CREATE POLICY "Allow authenticated users to create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);
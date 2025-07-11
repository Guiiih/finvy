-- Disable RLS for INSERT operations on organizations table
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS for other operations (SELECT, UPDATE, DELETE)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add a simple INSERT policy that always returns true for authenticated users
-- This policy will be overridden by the backend logic.
CREATE POLICY "Allow authenticated users to insert organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);
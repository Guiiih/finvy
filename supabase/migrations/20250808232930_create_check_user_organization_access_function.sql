-- Create the check_user_organization_access function
CREATE OR REPLACE FUNCTION public.check_user_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID := auth.uid();
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organization_roles
    WHERE user_id = check_user_organization_access.user_id
      AND organization_id = org_id
  )
  INTO has_access;

  RETURN has_access;
END;
$$;

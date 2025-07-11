CREATE OR REPLACE FUNCTION get_personal_organization_id(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  personal_org_id UUID;
BEGIN
  SELECT o.id INTO personal_org_id
  FROM organizations o
  JOIN user_organization_roles uor ON o.id = uor.organization_id
  WHERE uor.user_id = p_user_id AND o.is_personal = TRUE
  LIMIT 1;

  RETURN personal_org_id;
END;
$$;
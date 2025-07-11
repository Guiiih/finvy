DROP FUNCTION IF EXISTS get_user_accessible_organizations(p_user_id UUID);

CREATE OR REPLACE FUNCTION get_user_accessible_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  is_personal BOOLEAN,
  is_shared BOOLEAN,
  shared_from_user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $BODY$
BEGIN
  RETURN QUERY
  -- 1. Organizações das quais o usuário é membro direto
  SELECT
    o.id,
    o.name::TEXT,
    o.created_at,
    o.is_personal,
    FALSE AS is_shared,
    NULL::TEXT AS shared_from_user_name
  FROM
    organizations o
  JOIN
    user_organization_roles uor ON o.id = uor.organization_id
  WHERE
    uor.user_id = p_user_id

  UNION

  -- 2. Organizações de períodos compartilhados com o usuário
  SELECT
    o.id,
    o.name::TEXT,
    o.created_at,
    o.is_personal,
    TRUE AS is_shared,
    p.username::TEXT AS shared_from_user_name
  FROM
    organizations o
  JOIN
    accounting_periods ap ON o.id = ap.organization_id
  JOIN
    shared_accounting_periods sap ON ap.id = sap.accounting_period_id
  JOIN
    profiles p ON sap.shared_by_user_id = p.id
  WHERE
    sap.shared_with_user_id = p_user_id
    AND NOT EXISTS ( -- Excluir organizações já cobertas por papéis diretos
        SELECT 1
        FROM user_organization_roles uor_check
        WHERE uor_check.user_id = p_user_id
        AND uor_check.organization_id = o.id
    );
END;
$BODY$;
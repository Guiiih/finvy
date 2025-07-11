
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.email
  FROM
    profiles AS p
  WHERE
    p.username ILIKE '%' || search_term || '%' OR
    p.email ILIKE '%' || search_term || '%'
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION create_user_organization_role(
    p_user_id UUID,
    p_organization_id UUID,
    p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is allowed to perform this action
    IF auth.uid() = p_user_id THEN
        -- Allow user to create their own role (e.g., when creating a new organization)
        INSERT INTO public.user_organization_roles (user_id, organization_id, role)
        VALUES (p_user_id, p_organization_id, p_role);
    ELSIF can_manage_organization_role(auth.uid(), p_organization_id) THEN
        -- Allow owner/admin to add other members
        INSERT INTO public.user_organization_roles (user_id, organization_id, role)
        VALUES (p_user_id, p_organization_id, p_role);
    ELSE
        RAISE EXCEPTION 'Permissão negada: Você não tem permissão para adicionar este papel de organização.';
    END IF;
END;
$$;
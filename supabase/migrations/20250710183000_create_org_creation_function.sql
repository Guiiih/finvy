CREATE OR REPLACE FUNCTION public.create_organization_and_assign_owner(
    p_organization_name TEXT,
    p_user_id UUID
)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    accounting_period_id UUID,
    accounting_period_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_org_id UUID;
    new_period_id UUID;
    current_year INT;
    default_period_name TEXT;
    default_start_date DATE;
    default_end_date DATE;
BEGIN
    -- Create the organization
    INSERT INTO public.organizations (name, is_personal)
    VALUES (p_organization_name, FALSE) -- New organizations are not personal
    RETURNING id, name INTO new_org_id, organization_name;

    -- Assign 'owner' role to the creating user for this new organization
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (p_user_id, new_org_id, 'owner');

    -- Create a default accounting period for the new organization
    current_year := EXTRACT(YEAR FROM NOW());
    default_period_name := current_year::TEXT || ' Fiscal Year';
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date, is_active)
    VALUES (new_org_id, default_period_name, default_start_date, default_end_date, TRUE)
    RETURNING id, name INTO new_period_id, accounting_period_name;

    -- Update the user's profile to set this new organization and period as active
    UPDATE public.profiles
    SET organization_id = new_org_id, active_accounting_period_id = new_period_id
    WHERE id = p_user_id;

    RETURN QUERY SELECT new_org_id, organization_name, new_period_id, accounting_period_name;
END;
$$;
-- Migration: Update user functions to include handle and fix search_users

-- Drop the existing search_users function if it exists to allow recreation with new return type
DROP FUNCTION IF EXISTS public.search_users(TEXT);

-- Function to generate a unique handle
CREATE OR REPLACE FUNCTION generate_unique_handle(base_string TEXT)
RETURNS TEXT AS $$
DECLARE
    new_handle TEXT;
    counter INT := 0;
BEGIN
    -- Clean the base string: lowercase, replace spaces with underscores, remove special characters
    new_handle := REGEXP_REPLACE(LOWER(base_string), '[^a-z0-9_]+', '', 'g');

    -- Ensure handle starts with a letter or number
    IF new_handle ~ '^[0-9_]' THEN
        new_handle := 'user_' || new_handle;
    END IF;

    -- Trim to a reasonable length, e.g., 30 characters, to avoid excessively long handles
    IF LENGTH(new_handle) > 30 THEN
        new_handle := SUBSTRING(new_handle, 1, 30);
    END IF;

    -- Check for uniqueness and append counter if necessary
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = new_handle) LOOP
        counter := counter + 1;
        new_handle := REGEXP_REPLACE(LOWER(base_string), '[^a-z0-9_]+', '', 'g') || counter::TEXT;
        -- Re-trim if counter makes it too long
        IF LENGTH(new_handle) > 30 THEN
            new_handle := SUBSTRING(new_handle, 1, 30);
        END IF;
    END LOOP;

    RETURN new_handle;
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
    new_org_id UUID;
    new_period_id UUID;
    generated_handle TEXT;
    base_handle_string TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND LENGTH(NEW.raw_user_meta_data->>'first_name') > 0 THEN
        first_letter := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'first_name', 1, 1));
        base_handle_string := NEW.raw_user_meta_data->>'first_name';
    ELSE
        first_letter := UPPER(SUBSTRING(NEW.email, 1, 1));
        base_handle_string := ''; -- Use empty string if first_name is not provided
    END IF;

    -- Generate unique handle
    generated_handle := public.generate_unique_handle(base_handle_string);

    avatar_svg :=
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' ||
        '<rect width="100" height="100" fill="#000000"/>' ||
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF">' || first_letter || '</text>' ||
        '</svg>';

    INSERT INTO public.organizations (name, is_personal)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Personal', TRUE)
    RETURNING id INTO new_org_id;

    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date)
    VALUES (new_org_id, EXTRACT(YEAR FROM NOW())::TEXT || ' Fiscal Year', (EXTRACT(YEAR FROM NOW())::TEXT || '-01-01')::DATE, (EXTRACT(YEAR FROM NOW())::TEXT || '-12-31')::DATE)
    RETURNING id INTO new_period_id;

    INSERT INTO public.profiles (id, username, email, role, avatar_url, organization_id, active_accounting_period_id, handle)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.email, 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id, generated_handle);

    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

    -- Call function to create default chart of accounts
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user_id by handle or email
CREATE OR REPLACE FUNCTION public.get_user_id_by_handle_or_email(identifier TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Try to find by handle first (case-insensitive)
    SELECT id INTO user_uuid FROM public.profiles WHERE LOWER(handle) = LOWER(identifier);

    IF user_uuid IS NULL THEN
        -- If not found by handle, try by email (case-insensitive)
        SELECT id INTO user_uuid FROM public.profiles WHERE LOWER(email) = LOWER(identifier);
    END IF;

    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the search_users function with the new handle column in the return type
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT)
RETURNS TABLE (id UUID, username TEXT, email TEXT, handle TEXT, avatar_url TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.email,
        p.handle,
        p.avatar_url
    FROM
        public.profiles p
    WHERE
        LOWER(p.username) LIKE LOWER(search_term || '%') OR
        LOWER(p.email) LIKE LOWER(search_term || '%') OR
        LOWER(p.handle) LIKE LOWER(search_term || '%')
    ORDER BY
        p.username
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

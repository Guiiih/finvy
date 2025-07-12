-- Consolidated Schema Updates for 2025-07-10 and 2025-07-11

-- Schema Definitions (Tables, Columns, FKs)
-- From 20250710000000_add_organizations_and_accounting_periods.sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, name),
    UNIQUE (organization_id, start_date, end_date)
);

ALTER TABLE public.profiles
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN active_accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE SET NULL;

ALTER TABLE public.accounts
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.entry_lines
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.financial_transactions
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

-- From 20250710140000_add_permission_tables.sql
CREATE TABLE public.user_organization_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- e.g., 'owner', 'admin', 'member', 'guest'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, organization_id)
);

CREATE TABLE public.shared_accounting_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    accounting_period_id uuid REFERENCES public.accounting_periods(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level text NOT NULL, -- e.g., 'read', 'write'
    shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who shared it
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (accounting_period_id, shared_with_user_id)
);

-- From 20250710154500_add_fk_to_profiles.sql
ALTER TABLE public.user_organization_roles
ADD CONSTRAINT fk_user_organization_roles_profile
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_with_profile
FOREIGN KEY (shared_with_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_by_profile
FOREIGN KEY (shared_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- From 20250710160000_add_is_personal_to_organizations.sql
ALTER TABLE public.organizations
ADD COLUMN is_personal BOOLEAN DEFAULT FALSE;

-- From 20250711100000_add_email_to_profiles.sql
ALTER TABLE public.profiles
ADD COLUMN email TEXT UNIQUE;

UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);


-- Functions (CREATE OR REPLACE FUNCTION)
-- Helper functions first
-- From 20250710000000_add_organizations_and_accounting_periods.sql
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_active_accounting_period_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT active_accounting_period_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- From 20250710143000_update_rls_policies.sql
CREATE OR REPLACE FUNCTION public.get_organization_id_from_period(p_accounting_period_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.accounting_periods WHERE id = p_accounting_period_id);
END;
$$;

-- From 20250710150000_fix_user_org_roles_rls.sql
CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(p_organization_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- From 20250711160000_can_manage_organization_role_function.sql
CREATE OR REPLACE FUNCTION can_manage_organization_role(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND role IN ('owner', 'admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_member_of_any_organization(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
  );
END;
$$;

-- From 20250711140000_get_personal_organization_id_function.sql
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

-- Other functions
-- From 20250711110000_create_search_users_function.sql
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
    p.email ILIKE '%' || search_term || '%'
  LIMIT 10;
END;
$$;

-- From 20250711130000_recreate_get_accessible_orgs_function.sql (supersedes 20250711120000)
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

-- From 20250710183000_create_org_creation_function.sql
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
    VALUES (p_organization_name, FALSE)
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

-- From 20250711180000_create_insert_user_org_role_function.sql
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

-- From 20250710161500_update_handle_new_user_for_personal_org.sql (supersedes 20250710144500)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
    new_org_id UUID;
    new_period_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND LENGTH(NEW.raw_user_meta_data->>'first_name') > 0 THEN
        first_letter := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'first_name', 1, 1));
    ELSE
        first_letter := UPPER(SUBSTRING(NEW.email, 1, 1));
    END IF;

    avatar_svg :=
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' ||
        '<rect width="100" height="100" fill="#000000"/>' ||
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF">' || first_letter || '</text>' ||
        '</svg>';

    INSERT INTO public.organizations (name, is_personal)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Personal', TRUE)
    RETURNING id INTO new_org_id;

    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date, is_active)
    VALUES (new_org_id, EXTRACT(YEAR FROM NOW())::TEXT || ' Fiscal Year', (EXTRACT(YEAR FROM NOW())::TEXT || '-01-01')::DATE, (EXTRACT(YEAR FROM NOW())::TEXT || '-12-31')::DATE, TRUE)
    RETURNING id INTO new_period_id;

    INSERT INTO public.profiles (id, username, email, role, avatar_url, organization_id, active_accounting_period_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.email, 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id);

    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

    INSERT INTO public.accounts (id, name, type, user_id, organization_id, accounting_period_id) VALUES
        (gen_random_uuid(), 'Cash', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Bank Account', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Accounts Receivable', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Inventory', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Equipment', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Accounts Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Salaries Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Loans Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Owner''s Equity', 'equity', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Sales Revenue', 'revenue', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Service Revenue', 'revenue', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Cost of Goods Sold', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Rent Expense', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Utilities Expense', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Salaries Expense', 'expense', NEW.id, new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- From 20250710000000_add_organizations_and_accounting_periods.sql
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
  SELECT organization_id INTO user_org_id FROM public.profiles WHERE id = OLD.id;

  DELETE FROM public.accounts WHERE user_id = OLD.id;
  DELETE FROM public.journal_entries WHERE user_id = OLD.id;
  DELETE FROM public.financial_transactions WHERE user_id = OLD.id;
  DELETE FROM public.products WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;

  IF user_org_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE organization_id = user_org_id) THEN
    DELETE FROM public.accounting_periods WHERE organization_id = user_org_id;
    DELETE FROM public.organizations WHERE id = user_org_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable RLS for tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- RLS Policies
-- Policies for organizations
CREATE POLICY "org_view_for_members"
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = organizations.id
  )
);

CREATE POLICY "org_insert_auth_users"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policies for accounting_periods
CREATE POLICY "acct_periods_view_shared"
ON public.accounting_periods FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = accounting_periods.id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "acct_periods_insert_by_role"
ON public.accounting_periods FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "acct_periods_update_by_role"
ON public.accounting_periods FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "acct_periods_delete_by_role"
ON public.accounting_periods FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

-- Policies for user_organization_roles
CREATE POLICY "Users can view their own roles"
ON public.user_organization_roles FOR SELECT
USING (
    auth.uid() = user_id
);

CREATE POLICY "Owners/Admins can view all organization members"
ON public.user_organization_roles FOR SELECT
USING (
    public.can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "All members can view organization members"
ON public.user_organization_roles FOR SELECT
USING (
    public.is_member_of_any_organization(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can insert roles"
ON public.user_organization_roles FOR INSERT
WITH CHECK (
    can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can update roles"
ON public.user_organization_roles FOR UPDATE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can delete roles"
ON public.user_organization_roles FOR DELETE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);

-- Policies for shared_accounting_periods
CREATE POLICY "shared_acct_periods_read_self"
ON public.shared_accounting_periods FOR SELECT
USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id);

CREATE POLICY "shared_acct_periods_insert_admin"
ON public.shared_accounting_periods FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

CREATE POLICY "shared_acct_periods_update_admin"
ON public.shared_accounting_periods FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

CREATE POLICY "shared_acct_periods_delete_admin"
ON public.shared_accounting_periods FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);



-- Policies for financial tables (accounts, products, journal_entries, entry_lines, financial_transactions)
-- These policies are from 20250711150000_update_rls_for_personal_org.sql
DO $$
DECLARE
  policy_name TEXT;
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts', 'products', 'journal_entries', 'entry_lines', 'financial_transactions']
  LOOP
    EXECUTE 'CREATE POLICY "' || table_name || '_view_org_personal_shared"' ||
      ' ON public.' || table_name || ' FOR SELECT
      TO authenticated
      USING (
        (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id())
        OR
        (organization_id = public.get_personal_organization_id(auth.uid()))
        OR
        (accounting_period_id IN (SELECT sap.accounting_period_id FROM shared_accounting_periods sap WHERE sap.shared_with_user_id = auth.uid()))
      )';

    EXECUTE 'CREATE POLICY "' || table_name || '_insert_org_personal"' ||
      ' ON public.' || table_name || ' FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';

    EXECUTE 'CREATE POLICY "' || table_name || '_update_org_personal"' ||
      ' ON public.' || table_name || ' FOR UPDATE
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )
      WITH CHECK (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';

    EXECUTE 'CREATE POLICY "' || table_name || '_delete_org_personal"' ||
      ' ON public.' || table_name || ' FOR DELETE
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';
  END LOOP;
END
$$;

-- Policy for profiles


set check_function_bodies = off;
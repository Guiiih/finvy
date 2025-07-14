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

-- Tabela de Contas
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    code VARCHAR(25),
    parent_account_id UUID REFERENCES accounts(id),
    is_protected BOOLEAN DEFAULT FALSE
);

-- Tabela de Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_cost NUMERIC(10, 2) NOT NULL,
    current_stock INTEGER NOT NULL,
    icms_rate NUMERIC(5, 2) DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    accounting_period_id UUID REFERENCES accounting_periods(id),
    UNIQUE (name, organization_id, accounting_period_id)
);

-- Tabela de Lançamentos Contábeis
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- Tabela de Linhas dos Lançamentos
CREATE TABLE entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    debit NUMERIC(10, 2) DEFAULT 0,
    credit NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER,
    unit_cost NUMERIC(10, 2),
    ipi_rate NUMERIC,
    pis_rate NUMERIC,
    cofins_rate NUMERIC,
    mva_rate NUMERIC,
    icms_st_value NUMERIC,
    ipi_value NUMERIC,
    pis_value NUMERIC,
    cofins_value NUMERIC,
    icms_value NUMERIC,
    total_gross NUMERIC,
    total_net NUMERIC,
    transaction_type VARCHAR(50)
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Ex: 'income', 'expense', 'payment'
    description TEXT,
    account_id UUID REFERENCES accounts(id), -- Opcional: Para vincular a uma conta contábil
    user_id UUID REFERENCES auth.users(id)
);

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

-- Cria a tabela 'profiles' para armazenar informações adicionais do usuário, incluindo o nível de permissão.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    avatar_url TEXT
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$;

ALTER TABLE public.profiles
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN active_accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE SET NULL,
ADD COLUMN email TEXT UNIQUE;

ALTER TABLE public.accounts
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

ALTER TABLE public.user_organization_roles
ADD CONSTRAINT fk_user_organization_roles_profile
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_with_profile
FOREIGN KEY (shared_with_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_by_profile
FOREIGN KEY (shared_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.organizations
ADD COLUMN is_personal BOOLEAN DEFAULT FALSE;

-- Helper functions
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

CREATE OR REPLACE FUNCTION delete_journal_entry_and_lines(
    p_journal_entry_id UUID,
    p_user_id UUID,
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_entries_count INT;
BEGIN
    -- Delete associated entry_lines first
    DELETE FROM public.entry_lines
    WHERE
        journal_entry_id = p_journal_entry_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id;

    -- Delete the journal entry
    DELETE FROM public.journal_entries
    WHERE
        id = p_journal_entry_id AND
        user_id = p_user_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id
    RETURNING 1 INTO deleted_entries_count;

    -- Check if the journal entry was actually deleted
    IF deleted_entries_count > 0 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated role (or appropriate role)
GRANT EXECUTE ON FUNCTION delete_journal_entry_and_lines TO authenticated;

CREATE OR REPLACE FUNCTION public.create_default_chart_of_accounts()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_period_id UUID;
    v_ativo_id UUID;
    v_passivo_id UUID;
    v_pl_id UUID;
    v_receitas_id UUID;
    v_custos_despesas_id UUID;
    v_ativo_circ_id UUID;
    v_ativo_nao_circ_id UUID;
    v_caixa_equiv_id UUID;
    v_imobilizado_id UUID;
    v_passivo_circ_id UUID;
    v_deducoes_id UUID;
BEGIN
    v_user_id := NEW.id;
    v_org_id := NEW.organization_id;
    v_period_id := NEW.active_accounting_period_id;

    -- Nível 1: Contas Principais
    INSERT INTO public.accounts (name, type, code, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo', 'asset', '1', v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_ativo_id;
    INSERT INTO public.accounts (name, type, code, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Passivo', 'liability', '2', v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_passivo_id;
    INSERT INTO public.accounts (name, type, code, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Patrimônio Líquido', 'equity', '3', v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_pl_id;
    INSERT INTO public.accounts (name, type, code, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Receitas', 'revenue', '4', v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_receitas_id;
    INSERT INTO public.accounts (name, type, code, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Custos e Despesas', 'expense', '5', v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_custos_despesas_id;

    -- Nível 2: Subgrupos do Ativo
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Circulante', 'asset', '1.1', v_ativo_id, v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_ativo_circ_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Não Circulante', 'asset', '1.2', v_ativo_id, v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_ativo_nao_circ_id;

    -- Nível 2: Subgrupos do Passivo
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Passivo Circulante', 'liability', '2.1', v_passivo_id, v_user_id, v_org_id, v_period_id, TRUE) RETURNING id INTO v_passivo_circ_id;

    -- Nível 3: Contas do Ativo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Caixa e Equivalentes de Caixa', 'asset', '1.1.1', v_ativo_circ_id, v_user_id, v_org_id, v_period_id) RETURNING id INTO v_caixa_equiv_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Clientes', 'asset', '1.1.2', v_ativo_circ_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Estoques', 'asset', '1.1.3', v_ativo_circ_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Impostos a Recuperar', 'asset', '1.1.4', v_ativo_circ_id, v_user_id, v_org_id, v_period_id);

    -- Nível 3: Contas do Ativo Não Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Imobilizado', 'asset', '1.2.1', v_ativo_nao_circ_id, v_user_id, v_org_id, v_period_id) RETURNING id INTO v_imobilizado_id;

    -- Nível 3: Contas do Passivo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Fornecedores', 'liability', '2.1.1', v_passivo_circ_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Impostos a Recolher', 'liability', '2.1.2', v_passivo_circ_id, v_user_id, v_org_id, v_period_id);

    -- Nível 3: Contas do Patrimônio Líquido
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Capital Social', 'equity', '3.1', v_pl_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Capital a Integralizar', 'equity', '3.2', v_pl_id, v_user_id, v_org_id, v_period_id);

    -- Nível 3: Contas de Receita
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Receita Bruta de Vendas', 'revenue', '4.1', v_receitas_id, v_user_id, v_org_id, v_period_id);

    -- Nível 3: Contas de Custos e Despesas
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id, is_protected) VALUES ('Custo da Mercadoria Vendida', 'expense', '5.1', v_custos_despesas_id, v_user_id, v_org_id, v_period_id, TRUE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Deduções da Receita Bruta', 'expense', '5.2', v_custos_despesas_id, v_user_id, v_org_id, v_period_id) RETURNING id INTO v_deducoes_id;

    -- Nível 4: Contas de Caixa
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Caixa Geral', 'asset', '1.1.1.1', v_caixa_equiv_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco CEF)', 'asset', '1.1.1.2', v_caixa_equiv_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco Itaú)', 'asset', '1.1.1.3', v_caixa_equiv_id, v_user_id, v_org_id, v_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco Bradesco)', 'asset', '1.1.1.4', v_caixa_equiv_id, v_user_id, v_org_id, v_period_id);

    -- Nível 4: Contas de Imobilizado
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('Móveis e Utensílios', 'asset', '1.2.1.1', v_imobilizado_id, v_user_id, v_org_id, v_period_id);

    -- Nível 4: Contas de Impostos
    INSERT INTO public.accounts (name, type, code, parent_account_id, user_id, organization_id, accounting_period_id) VALUES ('ICMS sobre Vendas', 'expense', '5.2.1', v_deducoes_id, v_user_id, v_org_id, v_period_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Otimização de Performance: Adiciona índices para acelerar consultas comuns.

-- Index para filtrar rapidamente as tabelas principais por usuário.
-- Usado em quase todas as listagens (contas, produtos, transações, etc.).
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);

-- Índice composto para a tabela de lançamentos contábeis.
-- Acelera drasticamente a geração de relatórios, que filtra por usuário E por intervalo de datas.
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_entry_date ON public.journal_entries(user_id, entry_date);

-- Index na chave estrangeira da tabela de linhas de lançamento.
-- Melhor a performance das junções (implícitas) ao buscar lançamentos com suas linhas.
CREATE INDEX IF NOT EXISTS idx_entry_lines_journal_entry_id ON public.entry_lines(journal_entry_id);

-- Index para email na tabela de perfis
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger para chamar a função handle_new_user após a inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Cria um trigger que executa a função delete_user_data ANTES de um usuário ser deletado da auth.users
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_data();

-- Trigger para criar o plano de contas padrão após a criação do perfil
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_chart_of_accounts();

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

-- Policies for profiles
-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios perfis (excluindo a role, que será atualizada apenas por admins)
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins podem atualizar qualquer perfil (incluindo a role)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Policies for financial tables (accounts, products, journal_entries, entry_lines, financial_transactions)
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

set check_function_bodies = off;
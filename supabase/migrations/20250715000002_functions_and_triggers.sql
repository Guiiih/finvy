
-- Migration: Create functions and triggers

-- Helper functions
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

CREATE OR REPLACE FUNCTION public.create_default_chart_of_accounts(
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS VOID AS $$
DECLARE
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
    -- Nível 1: Contas Principais
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Ativo', 'asset', '1', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Passivo', 'liability', '2', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_passivo_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Patrimônio Líquido', 'equity', '3', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_pl_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Receitas', 'revenue', '4', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_receitas_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Custos e Despesas', 'expense', '5', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_custos_despesas_id;

    -- Nível 2: Subgrupos do Ativo
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Circulante', 'asset', '1.1', v_ativo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_circ_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Não Circulante', 'asset', '1.2', v_ativo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_nao_circ_id;

    -- Nível 2: Subgrupos do Passivo
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Passivo Circulante', 'liability', '2.1', v_passivo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_passivo_circ_id;

    -- Nível 3: Contas do Ativo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa e Equivalentes de Caixa', 'asset', '1.1.1', v_ativo_circ_id, p_organization_id, p_accounting_period_id) RETURNING id INTO v_caixa_equiv_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Clientes', 'asset', '1.1.2', v_ativo_circ_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Estoques', 'asset', '1.1.3', v_ativo_circ_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Impostos a Recuperar', 'asset', '1.1.4', v_ativo_circ_id, p_organization_id, p_accounting_period_id);

    -- Nível 3: Contas do Ativo Não Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Imobilizado', 'asset', '1.2.1', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id) RETURNING id INTO v_imobilizado_id;

    -- Nível 3: Contas do Passivo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Fornecedores', 'liability', '2.1.1', v_passivo_circ_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Impostos a Recolher', 'liability', '2.1.2', v_passivo_circ_id, p_organization_id, p_accounting_period_id);

    -- Nível 3: Contas do Patrimônio Líquido
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Capital Social', 'equity', '3.1', v_pl_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Capital a Integralizar', 'equity', '3.2', v_pl_id, p_organization_id, p_accounting_period_id);

    -- Nível 3: Contas de Receita
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Receita Bruta de Vendas', 'revenue', '4.1', v_receitas_id, p_organization_id, p_accounting_period_id);

    -- Nível 3: Contas de Custos e Despesas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Custo da Mercadoria Vendida', 'expense', '5.1', v_custos_despesas_id, p_organization_id, p_accounting_period_id, TRUE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Deduções da Receita Bruta', 'expense', '5.2', v_custos_despesas_id, p_organization_id, p_accounting_period_id) RETURNING id INTO v_deducoes_id;

    -- Nível 4: Contas de Caixa
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa Geral', 'asset', '1.1.1.1', v_caixa_equiv_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco CEF)', 'asset', '1.1.1.2', v_caixa_equiv_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco Itaú)', 'asset', '1.1.1.3', v_caixa_equiv_id, p_organization_id, p_accounting_period_id);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa (Banco Bradesco)', 'asset', '1.1.1.4', v_caixa_equiv_id, p_organization_id, p_accounting_period_id);

    -- Nível 4: Contas de Imobilizado
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Móveis e Utensílios', 'asset', '1.2.1.1', v_imobilizado_id, p_organization_id, p_accounting_period_id);

    -- Nível 4: Contas de Impostos
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('ICMS sobre Vendas', 'expense', '5.2.1', v_deducoes_id, p_organization_id, p_accounting_period_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    -- Chamar a função para criar o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);

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

    -- Chamar a função para criar o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    is_owner BOOLEAN;
BEGIN
    -- Iterar por todas as organizações das quais o usuário é membro
    FOR org_id IN SELECT organization_id FROM public.user_organization_roles WHERE user_id = OLD.id
    LOOP
        -- Verificar se o usuário é o único proprietário da organização
        SELECT COUNT(*) = 1 AND EXISTS (SELECT 1 FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id AND role = 'owner')
        INTO is_owner
        FROM public.user_organization_roles
        WHERE organization_id = org_id;

        IF is_owner THEN
            RAISE EXCEPTION 'Não é possível deletar o usuário % porque ele é o único proprietário da organização %.', OLD.id, org_id;
        END IF;

        -- Deletar dados associados a esta organização para o usuário
        DELETE FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id;
    END LOOP;

    -- Deletar o perfil do usuário
    DELETE FROM public.profiles WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Otimização de Performance: Adiciona índices para acelerar consultas comuns.
CREATE INDEX IF NOT EXISTS idx_products_org_period ON public.products(organization_id, accounting_period_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_period ON public.financial_transactions(organization_id, accounting_period_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_period_entry_date ON public.journal_entries(organization_id, accounting_period_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entry_lines_journal_entry_id ON public.entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

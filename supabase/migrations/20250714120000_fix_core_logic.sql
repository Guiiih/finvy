-- Desabilitar RLS temporariamente para fazer alterações estruturais se necessário
-- ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_organization_roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.accounting_periods DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.entry_lines DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financial_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shared_accounting_periods DISABLE ROW LEVEL SECURITY;

-- 1. Correção: Novas Organizações Não Recebem um Plano de Contas
-- 1.1. Remover a coluna user_id da tabela accounts (Correção 4 também)
ALTER TABLE public.accounts DROP COLUMN user_id;

-- 1.2. Alterar a função create_default_chart_of_accounts para aceitar organization_id e accounting_period_id
-- e não ser mais um trigger.
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
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Caixa e Equivalentes de Caixa', 'asset', '1.1.1', v_caixa_equiv_id, p_organization_id, p_accounting_period_id) RETURNING id INTO v_caixa_equiv_id;
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

-- 1.3. Remover o trigger on_profile_created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- 1.4. Modificar handle_new_user para chamar create_default_chart_of_accounts
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

-- 1.5. Modificar create_organization_and_assign_owner para chamar create_default_chart_of_accounts
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
    RETURNING id INTO new_period_id, accounting_period_name;

    -- Update the user's profile to set this new organization and period as active
    UPDATE public.profiles
    SET organization_id = new_org_id, active_accounting_period_id = new_period_id
    WHERE id = p_user_id;

    -- Chamar a função para criar o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);

    RETURN QUERY SELECT new_org_id, organization_name, new_period_id, accounting_period_name;
END;
$$;

-- 2. Correção: Políticas de Visualização de Dados (RLS) Excessivamente Restritivas
-- Remover as políticas existentes para recriá-las com a nova lógica
DO $$
DECLARE
  policy_name TEXT;
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts', 'products', 'journal_entries', 'entry_lines', 'financial_transactions']
  LOOP
    policy_name := table_name || '_view_org_personal_shared';
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.' || table_name || ';';
    policy_name := table_name || '_insert_org_personal';
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.' || table_name || ';';
    policy_name := table_name || '_update_org_personal';
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.' || table_name || ';';
    policy_name := table_name || '_delete_org_personal';
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.' || table_name || ';';
  END LOOP;
END
$$;

-- Recriar as políticas RLS para tabelas financeiras
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts', 'products', 'journal_entries', 'entry_lines', 'financial_transactions']
  LOOP
    -- Política de SELECT: Permite ver dados de qualquer organização da qual é membro
    -- ou qualquer período contábil compartilhado.
    EXECUTE format('
CREATE POLICY "%s_view_for_members_and_shared"
ON public.%s FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = %I.organization_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = %I.accounting_period_id
  )
);
', table_name, table_name, table_name, table_name);

    -- Políticas de INSERT, UPDATE, DELETE: Mantêm a restrição à organização ativa do usuário
    -- ou à sua organização pessoal, para garantir que o usuário só possa modificar dados
    -- dentro do contexto de sua organização principal ou pessoal.
    EXECUTE format('
CREATE POLICY "%s_insert_org_active_personal"
ON public.%s FOR INSERT
TO authenticated
WITH CHECK (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name);

    EXECUTE format('
CREATE POLICY "%s_update_org_active_personal"
ON public.%s FOR UPDATE
TO authenticated
USING (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
)
WITH CHECK (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name, table_name, table_name);

    EXECUTE format('
CREATE POLICY "%s_delete_org_active_personal"
ON public.%s FOR DELETE
TO authenticated
USING (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name);
  END LOOP;
END
$$;

-- 3. Correção: Lógica de Exclusão de Usuário Falha
-- 3.1. Remover o índice idx_accounts_user_id, pois user_id será removido
DROP INDEX IF EXISTS idx_accounts_user_id;
-- 3.2. Remover o índice idx_products_user_id, pois user_id será removido
DROP INDEX IF EXISTS idx_products_user_id;
-- 3.3. Remover o índice idx_financial_transactions_user_id, pois user_id será removido
DROP INDEX IF EXISTS idx_financial_transactions_user_id;
-- 3.4. Remover o índice idx_journal_entries_user_id_entry_date, pois user_id será removido
DROP INDEX IF EXISTS idx_journal_entries_user_id_entry_date;

-- 3.5. Modificar a função delete_user_data
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
        -- Adicione aqui outras exclusões de dados específicos do usuário dentro desta organização, se houver
        -- Por exemplo, se houver dados que são exclusivamente do usuário e não compartilhados com outros membros da organização.
        -- No esquema atual, accounts, products, journal_entries, financial_transactions não têm user_id,
        -- então a exclusão é baseada em organization_id e accounting_period_id, que não devem ser deletados aqui.
    END LOOP;

    -- Deletar o perfil do usuário
    DELETE FROM public.profiles WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Correção: user_id Não Convencional na Tabela accounts
-- Já tratada no ponto 1.1, com a remoção da coluna user_id da tabela accounts.

-- Re-criar índices sem a coluna user_id
CREATE INDEX IF NOT EXISTS idx_products_org_period ON public.products(organization_id, accounting_period_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_period ON public.financial_transactions(organization_id, accounting_period_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_period_entry_date ON public.journal_entries(organization_id, accounting_period_id, entry_date);

-- Re-criar o índice para entry_lines, se necessário, sem user_id
-- O índice original idx_entry_lines_journal_entry_id já está ok, pois não usava user_id.

-- Re-criar o índice para email na tabela de perfis
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Re-criar o trigger on_auth_user_created (se foi removido ou alterado)
-- No caso, handle_new_user foi alterado, mas o trigger permanece o mesmo.
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- Re-criar o trigger on_user_deleted
-- No caso, delete_user_data foi alterado, mas o trigger permanece o mesmo.
-- CREATE TRIGGER on_user_deleted
--   BEFORE DELETE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.delete_user_data();

-- Re-habilitar RLS
-- ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.entry_lines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shared_accounting_periods ENABLE ROW LEVEL SECURITY;
-- Migração: Funções

set check_function_bodies = off;

-- Funções auxiliares
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
  email TEXT,
  handle TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.email,
    p.handle,
    p.avatar_url
  FROM
    public.profiles AS p
  WHERE
    LOWER(p.username) LIKE LOWER(search_term || '%') OR
    LOWER(p.email) LIKE LOWER(search_term || '%') OR
    LOWER(p.handle) LIKE LOWER(search_term || '%')
  ORDER BY
    p.username
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_accessible_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  cnpj TEXT,
  razao_social TEXT,
  uf TEXT,
  municipio TEXT,
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
    o.cnpj::TEXT,
    o.razao_social::TEXT,
    o.uf::TEXT,
    o.municipio::TEXT,
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
    o.cnpj::TEXT,
    o.razao_social::TEXT,
    o.uf::TEXT,
    o.municipio::TEXT,
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
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id) VALUES ('Custo da Mercadoria Vendida', 'expense', '5.1', v_custos_despesas_id, p_organization_id, p_accounting_period_id);
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
    p_user_id UUID,
    p_cnpj VARCHAR DEFAULT NULL,
    p_razao_social VARCHAR DEFAULT NULL,
    p_uf VARCHAR DEFAULT NULL,
    p_municipio VARCHAR DEFAULT NULL
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
    -- Cria a organização e atribui o proprietário
    INSERT INTO public.organizations (name, is_personal, cnpj, razao_social, uf, municipio)
    VALUES (p_organization_name, FALSE, p_cnpj, p_razao_social, p_uf, p_municipio)
    RETURNING id, name INTO new_org_id, organization_name;

    -- Atribui o papel de 'owner' ao usuário criador para esta nova organização
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (p_user_id, new_org_id, 'owner');

    -- Cria um período contábil padrão para a nova organização
    current_year := EXTRACT(YEAR FROM NOW());
    default_period_name := current_year::TEXT || ' Fiscal Year';
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date)
    VALUES (new_org_id, default_period_name, default_start_date, default_end_date)
    RETURNING id, name INTO new_period_id, accounting_period_name;

    -- Atualiza o perfil do usuário para definir esta nova organização e período como ativos
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
    -- Verifica se o usuário atual tem permissão para realizar esta ação
    IF auth.uid() = p_user_id THEN
        -- Permite ao usuário criar seu próprio papel (ex: ao criar uma nova organização)
        INSERT INTO public.user_organization_roles (user_id, organization_id, role)
        VALUES (p_user_id, p_organization_id, p_role);
    ELSIF can_manage_organization_role(auth.uid(), p_organization_id) THEN
        -- Permite ao proprietário/administrador adicionar outros membros
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
    -- Exclui as linhas de lançamento associadas primeiro
    DELETE FROM public.entry_lines
    WHERE
        journal_entry_id = p_journal_entry_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id;

    -- Exclui o lançamento contábil
    DELETE FROM public.journal_entries
    WHERE
        id = p_journal_entry_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id
    RETURNING 1 INTO deleted_entries_count;

    -- Verifica se o lançamento contábil foi realmente excluído
    IF deleted_entries_count > 0 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    -- Gera um handle único
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

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    is_user_owner BOOLEAN;
    num_owners INT;
    num_members INT;
    oldest_admin_id UUID;
    organization_name TEXT;
BEGIN
    -- Iterar por todas as organizações das quais o usuário é membro
    FOR org_id IN SELECT organization_id FROM public.user_organization_roles WHERE user_id = OLD.id
    LOOP
        -- Obter o nome da organização para a mensagem de erro
        SELECT name INTO organization_name FROM public.organizations WHERE id = org_id;

        -- Verificar se o usuário que está sendo deletado é um proprietário desta organização
        SELECT EXISTS (SELECT 1 FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id AND role = 'owner')
        INTO is_user_owner;

        -- Contar o número total de proprietários para esta organização
        SELECT COUNT(*)
        INTO num_owners
        FROM public.user_organization_roles
        WHERE organization_id = org_id AND role = 'owner';

        -- Contar o número total de membros para esta organização
        SELECT COUNT(*)
        INTO num_members
        FROM public.user_organization_roles
        WHERE organization_id = org_id;

        IF is_user_owner THEN
            -- Se o usuário é um proprietário
            IF num_owners = 1 THEN
                -- Se o usuário é o ÚNICO proprietário
                -- Tentar encontrar o administrador mais antigo para transferir a propriedade
                SELECT user_id
                INTO oldest_admin_id
                FROM public.user_organization_roles
                WHERE organization_id = org_id AND role = 'admin'
                ORDER BY created_at ASC
                LIMIT 1;

                IF oldest_admin_id IS NOT NULL THEN
                    -- Cenário B: Único Proprietário com Administradores
                    -- Transferir a propriedade para o administrador mais antigo
                    UPDATE public.user_organization_roles
                    SET role = 'owner'
                    WHERE user_id = oldest_admin_id AND organization_id = org_id;

                    -- Remover o papel de proprietário do usuário que está sendo deletado
                    DELETE FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id;
                ELSIF num_members > 1 THEN
                    -- Cenário C: Único Proprietário Apenas com Membros (não-proprietários e não-administradores)
                    -- Tentar encontrar o membro mais antigo para transferir a propriedade
                    SELECT user_id
                    INTO oldest_admin_id
                    FROM public.user_organization_roles
                    WHERE organization_id = org_id AND user_id != OLD.id -- Excluir o usuário que está sendo deletado
                    ORDER BY created_at ASC
                    LIMIT 1;

                    IF oldest_admin_id IS NOT NULL THEN
                        -- Transferir a propriedade para o membro mais antigo
                        UPDATE public.user_organization_roles
                        SET role = 'owner'
                        WHERE user_id = oldest_admin_id AND organization_id = org_id;

                        -- Remover o papel de proprietário do usuário que está sendo deletado
                        DELETE FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id;
                    ELSE
                        -- Se não há outros membros, deletar a organização
                        DELETE FROM public.organizations WHERE id = org_id;
                    END IF;
                ELSE
                    -- Se o usuário é o único proprietário E o único membro, deletar a organização
                    -- Isso irá cascatear e deletar user_organization_roles e outros dados relacionados
                    DELETE FROM public.organizations WHERE id = org_id;
                END IF;
            ELSE
                -- Cenário A: Existem Outros Proprietários
                -- Se o usuário é um proprietário, mas existem outros proprietários, apenas remover o papel do usuário
                DELETE FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id;
            END IF;
        ELSE
            -- Se o usuário NÃO é um proprietário, apenas remover o papel do usuário na organização
            DELETE FROM public.user_organization_roles WHERE user_id = OLD.id AND organization_id = org_id;
        END IF;
    END LOOP;

    -- Deletar o perfil do usuário
    DELETE FROM public.profiles WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_string TEXT)
RETURNS TEXT AS $$
DECLARE
    new_handle TEXT;
    counter INT := 0;
BEGIN
    -- Limpa a string base: minúsculas, substitui espaços por underscores, remove caracteres especiais
    new_handle := REGEXP_REPLACE(LOWER(base_string), '[^a-z0-9_]+', '', 'g');

    -- Garante que o handle comece com uma letra ou número
    IF new_handle ~ '^[0-9_]' THEN
        new_handle := 'user_' || new_handle;
    END IF;

    -- Limita a um tamanho razoável, por exemplo, 30 caracteres, para evitar handles excessivamente longos
    IF LENGTH(new_handle) > 30 THEN
        new_handle := SUBSTRING(new_handle, 1, 30);
    END IF;

    -- Verifica a unicidade e anexa contador se necessário
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_id_by_handle_or_email(identifier TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Tenta encontrar pelo handle primeiro (case-insensitive)
    SELECT id INTO user_uuid FROM public.profiles WHERE LOWER(handle) = LOWER(identifier);

    IF user_uuid IS NULL THEN
        -- Se não encontrado pelo handle, tenta pelo email (case-insensitive)
        SELECT id INTO user_uuid FROM public.profiles WHERE LOWER(email) = LOWER(identifier);
    END IF;

    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Concede uso à função autenticada (ou função apropriada)
GRANT EXECUTE ON FUNCTION delete_journal_entry_and_lines TO authenticated;

-- Function to record a purchase and create an inventory lot
CREATE OR REPLACE FUNCTION public.record_purchase(
    p_product_id UUID,
    p_quantity INT,
    p_unit_cost NUMERIC(10, 2),
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Insert a new inventory lot
    INSERT INTO public.inventory_lots (
        product_id,
        quantity_purchased,
        quantity_remaining,
        unit_cost,
        organization_id,
        accounting_period_id
    ) VALUES (
        p_product_id,
        p_quantity,
        p_quantity,
        p_unit_cost,
        p_organization_id,
        p_accounting_period_id
    );

    -- Update total quantity in products table
    UPDATE public.products
    SET quantity_in_stock = quantity_in_stock + p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate COGS for a sale based on costing method
CREATE OR REPLACE FUNCTION public.calculate_cogs_for_sale(
    p_product_id UUID,
    p_quantity_sold INT,
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
    v_costing_method costing_method_enum;
    v_cogs NUMERIC(10, 2) := 0;
    v_remaining_quantity_to_sell INT := p_quantity_sold;
    v_lot RECORD;
BEGIN
    -- Get the costing method for the accounting period
    SELECT costing_method INTO v_costing_method
    FROM public.accounting_periods
    WHERE id = p_accounting_period_id;

    IF v_costing_method IS NULL THEN
        RAISE EXCEPTION 'Costing method not defined for accounting period %.', p_accounting_period_id;
    END IF;

    -- Handle different costing methods
    IF v_costing_method = 'average' THEN
        -- Logic for Weighted Average Cost
        -- This will require calculating the average cost of all available stock
        -- and then multiplying by the quantity sold.
        -- This part will be implemented in the next step.
        DECLARE
            v_total_value NUMERIC(10, 2);
            v_total_quantity INT;
            v_average_unit_cost NUMERIC(10, 2);
        BEGIN
            -- Calculate total value and total quantity of all remaining stock for the product
            SELECT
                COALESCE(SUM(quantity_remaining * unit_cost), 0),
                COALESCE(SUM(quantity_remaining), 0)
            INTO
                v_total_value,
                v_total_quantity
            FROM
                public.inventory_lots
            WHERE
                product_id = p_product_id
                AND organization_id = p_organization_id
                AND accounting_period_id = p_accounting_period_id
                AND quantity_remaining > 0;

            IF v_total_quantity > 0 THEN
                v_average_unit_cost := v_total_value / v_total_quantity;
                v_cogs := p_quantity_sold * v_average_unit_cost;

                -- Now, we need to "consume" the lots to reflect the sale.
                -- For average cost, we can simply reduce quantity_remaining proportionally
                -- or mark lots as consumed based on the total quantity sold.
                -- A simpler approach for average cost is to just update the total stock
                -- and not worry about individual lot consumption for COGS calculation,
                -- but we still need to ensure quantity_remaining is accurate.
                -- We will consume from oldest lots first to simplify inventory management,
                -- even though the COGS is based on average.

                FOR v_lot IN (
                    SELECT id, quantity_remaining
                    FROM public.inventory_lots
                    WHERE product_id = p_product_id
                      AND organization_id = p_organization_id
                      AND accounting_period_id = p_accounting_period_id
                      AND quantity_remaining > 0
                    ORDER BY purchase_date ASC, created_at ASC
                ) LOOP
                    IF p_quantity_sold <= 0 THEN
                        EXIT;
                    END IF;

                    IF v_lot.quantity_remaining >= p_quantity_sold THEN
                        UPDATE public.inventory_lots
                        SET quantity_remaining = v_lot.quantity_remaining - p_quantity_sold
                        WHERE id = v_lot.id;
                        p_quantity_sold := 0;
                    ELSE
                        p_quantity_sold := p_quantity_sold - v_lot.quantity_remaining;
                        UPDATE public.inventory_lots
                        SET quantity_remaining = 0
                        WHERE id = v_lot.id;
                    END IF;
                END LOOP;

            ELSE
                RAISE EXCEPTION 'No stock available for product % in accounting period % to calculate average cost.', p_product_id, p_accounting_period_id;
            END IF;
        END;
    ELSIF v_costing_method = 'fifo' THEN
        -- Logic for FIFO (PEPS)
        FOR v_lot IN (
            SELECT id, quantity_remaining, unit_cost
            FROM public.inventory_lots
            WHERE product_id = p_product_id
              AND organization_id = p_organization_id
              AND accounting_period_id = p_accounting_period_id
              AND quantity_remaining > 0
            ORDER BY purchase_date ASC, created_at ASC -- FIFO: Oldest lots first
        ) LOOP
            IF v_remaining_quantity_to_sell <= 0 THEN
                EXIT;
            END IF;

            IF v_lot.quantity_remaining >= v_remaining_quantity_to_sell THEN
                -- Current lot can cover the remaining quantity
                v_cogs := v_cogs + (v_remaining_quantity_to_sell * v_lot.unit_cost);
                UPDATE public.inventory_lots
                SET quantity_remaining = v_lot.quantity_remaining - v_remaining_quantity_to_sell
                WHERE id = v_lot.id;
                v_remaining_quantity_to_sell := 0;
            ELSE
                -- Current lot is not enough, consume it entirely
                v_cogs := v_cogs + (v_lot.quantity_remaining * v_lot.unit_cost);
                v_remaining_quantity_to_sell := v_remaining_quantity_to_sell - v_lot.quantity_remaining;
                UPDATE public.inventory_lots
                SET quantity_remaining = 0
                WHERE id = v_lot.id;
            END IF;
        END LOOP;

    ELSIF v_costing_method = 'lifo' THEN
        -- Logic for LIFO (UEPS)
        FOR v_lot IN (
            SELECT id, quantity_remaining, unit_cost
            FROM public.inventory_lots
            WHERE product_id = p_product_id
              AND organization_id = p_organization_id
              AND accounting_period_id = p_accounting_period_id
              AND quantity_remaining > 0
            ORDER BY purchase_date DESC, created_at DESC -- LIFO: Newest lots first
        ) LOOP
            IF v_remaining_quantity_to_sell <= 0 THEN
                EXIT;
            END IF;

            IF v_lot.quantity_remaining >= v_remaining_quantity_to_sell THEN
                -- Current lot can cover the remaining quantity
                v_cogs := v_cogs + (v_remaining_quantity_to_sell * v_lot.unit_cost);
                UPDATE public.inventory_lots
                SET quantity_remaining = v_lot.quantity_remaining - v_remaining_quantity_to_sell
                WHERE id = v_lot.id;
                v_remaining_quantity_to_sell := 0;
            ELSE
                -- Current lot is not enough, consume it entirely
                v_cogs := v_cogs + (v_lot.quantity_remaining * v_lot.unit_cost);
                v_remaining_quantity_to_sell := v_remaining_quantity_to_sell - v_lot.quantity_remaining;
                UPDATE public.inventory_lots
                SET quantity_remaining = 0
                WHERE id = v_lot.id;
            END IF;
        END LOOP;
    END IF;

    -- Update total quantity in products table (decrement)
    UPDATE public.products
    SET quantity_in_stock = quantity_in_stock - p_quantity_sold
    WHERE id = p_product_id;

    RETURN v_cogs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
    -- Variáveis para IDs de contas de nível superior
    v_ativo_id UUID;
    v_passivo_id UUID;
    v_pl_id UUID;
    v_receitas_id UUID;
    v_despesas_id UUID;

    -- Variáveis para IDs de contas de segundo nível (grupos)
    v_ativo_circ_id UUID;
    v_ativo_nao_circ_id UUID;
    v_passivo_circ_id UUID;
    v_passivo_nao_circ_id UUID;
    v_capital_social_id UUID;
    v_reservas_lucros_id UUID;
    v_lucros_acumulados_id UUID;
    v_receita_bruta_id UUID;
    v_deducoes_receita_id UUID;
    v_custo_vendas_id UUID;
    v_despesas_operacionais_id UUID;
    v_despesas_nao_operacionais_id UUID;

    -- Variáveis para IDs de contas de terceiro nível (subgrupos)
    v_caixa_equiv_id UUID;
    v_contas_receber_id UUID;
    v_estoques_id UUID;
    v_impostos_recuperar_id UUID;
    v_investimentos_id UUID;
    v_imobilizado_id UUID;
    v_intangivel_id UUID;
    v_contas_pagar_id UUID;
    v_obrigacoes_fiscais_id UUID;
    v_obrigacoes_trabalhistas_id UUID;
    v_emprestimos_lp_id UUID;
    v_outras_receitas_id UUID;
    v_despesas_vendas_id UUID;
    v_despesas_admin_id UUID;
    v_despesas_financeiras_id UUID;
    v_despesas_tributarias_id UUID;

    -- Variáveis para IDs de contas de quarto nível
    v_bancos_id UUID;

BEGIN
    -- Nível 1: Contas Principais (Ativo, Passivo, PL, Receitas, Despesas)
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Ativo', 'asset', '1', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Passivo', 'liability', '2', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_passivo_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Patrimônio Líquido', 'equity', '3', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_pl_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Receitas', 'revenue', '4', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_receitas_id;
    INSERT INTO public.accounts (name, type, code, organization_id, accounting_period_id, is_protected) VALUES ('Despesas', 'expense', '5', p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_despesas_id;

    -- Nível 2: Subgrupos do Ativo
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Circulante', 'asset', '1.1', v_ativo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_circ_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Ativo Não Circulante', 'asset', '1.2', v_ativo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_ativo_nao_circ_id;

    -- Nível 2: Subgrupos do Passivo
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Passivo Circulante', 'liability', '2.1', v_passivo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_passivo_circ_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Passivo Não Circulante', 'liability', '2.2', v_passivo_id, p_organization_id, p_accounting_period_id, TRUE) RETURNING id INTO v_passivo_nao_circ_id;

    -- Nível 2: Subgrupos do Patrimônio Líquido
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Capital Social', 'equity', '3.1', v_pl_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_capital_social_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Reservas de Lucros', 'equity', '3.2', v_pl_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_reservas_lucros_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Lucros/Prejuízos Acumulados', 'equity', '3.3', v_pl_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_lucros_acumulados_id;

    -- Nível 2: Subgrupos de Receitas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Receita Bruta de Vendas', 'revenue', '4.1', v_receitas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_receita_bruta_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Deduções da Receita Bruta', 'revenue', '4.2', v_receitas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_deducoes_receita_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Outras Receitas Operacionais', 'revenue', '4.3', v_receitas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_outras_receitas_id;

    -- Nível 2: Subgrupos de Despesas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Custo das Vendas', 'expense', '5.1', v_despesas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_custo_vendas_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Operacionais', 'expense', '5.2', v_despesas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_operacionais_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Não Operacionais', 'expense', '5.3', v_despesas_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_nao_operacionais_id;

    -- Nível 3: Contas do Ativo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Caixa e Equivalentes de Caixa', 'asset', '1.1.1', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_caixa_equiv_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Contas a Receber', 'asset', '1.1.2', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_contas_receber_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoques', 'asset', '1.1.3', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_estoques_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Impostos a Recuperar', 'asset', '1.1.4', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_impostos_recuperar_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Antecipadas', 'asset', '1.1.5', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas do Ativo Não Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Investimentos', 'asset', '1.2.1', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_investimentos_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Imobilizado', 'asset', '1.2.2', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_imobilizado_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Intangível', 'asset', '1.2.3', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_intangivel_id;

    -- Nível 3: Contas do Passivo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Contas a Pagar', 'liability', '2.1.1', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_contas_pagar_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Obrigações Fiscais', 'liability', '2.1.2', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_obrigacoes_fiscais_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Obrigações Trabalhistas', 'liability', '2.1.3', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_obrigacoes_trabalhistas_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Empréstimos e Financiamentos de Curto Prazo', 'liability', '2.1.4', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas do Passivo Não Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Empréstimos e Financiamentos de Longo Prazo', 'liability', '2.2.1', v_passivo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_emprestimos_lp_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Provisões', 'liability', '2.2.2', v_passivo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas do Patrimônio Líquido
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Capital Social Integralizado', 'equity', '3.1.1', v_capital_social_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Capital a Integralizar', 'equity', '3.1.2', v_capital_social_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Reserva Legal', 'equity', '3.2.1', v_reservas_lucros_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Reserva de Contingência', 'equity', '3.2.2', v_reservas_lucros_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Lucros Acumulados', 'equity', '3.3.1', v_lucros_acumulados_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Prejuízos Acumulados', 'equity', '3.3.2', v_lucros_acumulados_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas de Receitas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Venda de Produtos', 'revenue', '4.1.1', v_receita_bruta_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Venda de Serviços', 'revenue', '4.1.2', v_receita_bruta_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Impostos sobre Vendas', 'revenue', '4.2.1', v_deducoes_receita_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Devoluções de Vendas', 'revenue', '4.2.2', v_deducoes_receita_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Juros Ativos', 'revenue', '4.3.1', v_outras_receitas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aluguéis Recebidos', 'revenue', '4.3.2', v_outras_receitas_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas de Despesas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Custo da Mercadoria Vendida (CMV)', 'expense', '5.1.1', v_custo_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Custo do Serviço Prestado (CSP)', 'expense', '5.1.2', v_custo_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Vendas', 'expense', '5.2.1', v_despesas_operacionais_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_vendas_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Administrativas', 'expense', '5.2.2', v_despesas_operacionais_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_admin_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Financeiras', 'expense', '5.3.1', v_despesas_nao_operacionais_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_financeiras_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Tributárias', 'expense', '5.3.2', v_despesas_nao_operacionais_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_despesas_tributarias_id;

    -- Nível 4: Contas de Caixa e Equivalentes
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Caixa', 'asset', '1.1.1.1', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Bancos Conta Movimento', 'asset', '1.1.1.2', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_bancos_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aplicações Financeiras de Curto Prazo', 'asset', '1.1.1.3', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 5: Bancos
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Banco do Brasil', 'asset', '1.1.1.2.1', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Caixa Econômica Federal', 'asset', '1.1.1.2.14', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Bradesco', 'asset', '1.1.1.2.237', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Itaú Unibanco', 'asset', '1.1.1.2.341', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Santander', 'asset', '1.1.1.2.33', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Nubank', 'asset', '1.1.1.2.26', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Banco Inter', 'asset', '1.1.1.2.77', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('C6 Bank', 'asset', '1.1.1.2.336', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('BTG Pactual', 'asset', '1.1.1.2.28', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Banco Safra', 'asset', '1.1.1.2.422', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Sicoob', 'asset', '1.1.1.2.756', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Sicredi', 'asset', '1.1.1.2.748', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PagBank', 'asset', '1.1.1.2.29', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('XP Investimentos', 'asset', '1.1.1.2.12', v_bancos_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Contas a Receber
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Clientes', 'asset', '1.1.2.1', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Duplicatas a Receber', 'asset', '1.1.2.2', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Adiantamentos a Fornecedores', 'asset', '1.1.2.3', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Estoques
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Mercadorias', 'asset', '1.1.3.1', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Produtos Acabados', 'asset', '1.1.3.2', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Matérias-Primas', 'asset', '1.1.3.3', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Impostos a Recuperar
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ICMS a Recuperar', 'asset', '1.1.4.1', v_impostos_recuperar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PIS a Recuperar', 'asset', '1.1.4.2', v_impostos_recuperar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('COFINS a Recuperar', 'asset', '1.1.4.3', v_impostos_recuperar_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Imobilizado
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Terrenos', 'asset', '1.2.2.1', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Edifícios e Construções', 'asset', '1.2.2.2', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Máquinas e Equipamentos', 'asset', '1.2.2.3', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Veículos', 'asset', '1.2.2.4', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Móveis e Utensílios', 'asset', '1.2.2.5', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Depreciação Acumulada', 'asset', '1.2.2.6', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Intangível
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Marcas e Patentes', 'asset', '1.2.3.1', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Softwares', 'asset', '1.2.3.2', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Amortização Acumulada', 'asset', '1.2.3.3', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Contas a Pagar
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Fornecedores', 'liability', '2.1.1.1', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Salários a Pagar', 'liability', '2.1.1.2', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aluguéis a Pagar', 'liability', '2.1.1.3', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Obrigações Fiscais
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ICMS a Recolher', 'liability', '2.1.2.1', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ISS a Recolher', 'liability', '2.1.2.2', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PIS a Recolher', 'liability', '2.1.2.3', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('COFINS a Recolher', 'liability', '2.1.2.4', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('IRPJ a Recolher', 'liability', '2.1.2.5', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('CSLL a Recolher', 'liability', '2.1.2.6', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Obrigações Trabalhistas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Salários e Ordenados a Pagar', 'liability', '2.1.3.1', v_obrigacoes_trabalhistas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('INSS a Recolher', 'liability', '2.1.3.2', v_obrigacoes_trabalhistas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('FGTS a Recolher', 'liability', '2.1.3.3', v_obrigacoes_trabalhistas_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas com Vendas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Comissões sobre Vendas', 'expense', '5.2.1.1', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Fretes e Carretos', 'expense', '5.2.1.2', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Publicidade e Propaganda', 'expense', '5.2.1.3', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Administrativas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Salários e Encargos', 'expense', '5.2.2.1', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aluguéis', 'expense', '5.2.2.2', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Energia Elétrica', 'expense', '5.2.2.3', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Água e Esgoto', 'expense', '5.2.2.4', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Telefone e Internet', 'expense', '5.2.2.5', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Depreciação', 'expense', '5.2.2.6', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Manutenção e Reparos', 'expense', '5.2.2.7', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Material de Escritório', 'expense', '5.2.2.8', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Serviços de Terceiros', 'expense', '5.2.2.9', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Viagens', 'expense', '5.2.2.1', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Financeiras
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Juros Passivos', 'expense', '5.3.1.1', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Bancárias', 'expense', '5.3.1.2', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Variações Monetárias Passivas', 'expense', '5.3.1.3', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Tributárias
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('IRPJ', 'expense', '5.3.2.1', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('CSLL', 'expense', '5.3.2.2', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PIS', 'expense', '5.3.2.3', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('COFINS', 'expense', '5.3.2.4', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ISS', 'expense', '5.3.2.5', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ICMS', 'expense', '5.3.2.6', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Taxas e Contribuições', 'expense', '5.3.2.7', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);

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
    fiscal_year INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_org_id UUID;
    new_period_id UUID;
    current_year INT;
    default_start_date DATE;
    default_end_date DATE;
    -- Adicionado para o regime padrão
    default_regime tax_regime_enum := 'simples_nacional';
    default_annex VARCHAR := 'annex_i';
BEGIN
    -- Cria a organização
    INSERT INTO public.organizations (name, is_personal, cnpj, razao_social, uf, municipio)
    VALUES (p_organization_name, FALSE, p_cnpj, p_razao_social, p_uf, p_municipio)
    RETURNING id, name INTO new_org_id, organization_name;

    -- Atribui o papel de 'owner'
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (p_user_id, new_org_id, 'owner');

    -- Cria o período contábil anual (principal)
    current_year := EXTRACT(YEAR FROM NOW());
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, fiscal_year, start_date, end_date, regime, annex, is_active, period_type)
    VALUES (new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex, TRUE, 'yearly')
    RETURNING id, fiscal_year INTO new_period_id, fiscal_year;

    -- Cria o registro no histórico de regimes
    INSERT INTO public.tax_regime_history (organization_id, regime, start_date, end_date)
    VALUES (new_org_id, default_regime, default_start_date, default_end_date);

    -- **NOVO: Chama a função para criar os períodos mensais**
    PERFORM public.create_monthly_accounting_periods(new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex);

    -- Atualiza o perfil do usuário
    UPDATE public.profiles
    SET organization_id = new_org_id, active_accounting_period_id = new_period_id
    WHERE id = p_user_id;

    -- Cria o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);

    RETURN QUERY SELECT new_org_id, organization_name, new_period_id, fiscal_year;
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
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
    new_org_id UUID;
    new_period_id UUID;
    generated_handle TEXT;
    base_handle_string TEXT;
    current_year INT;
    default_start_date DATE;
    default_end_date DATE;
    default_regime tax_regime_enum := 'simples_nacional';
    default_annex VARCHAR := 'annex_i';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Lógica para criar avatar e handle
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND LENGTH(NEW.raw_user_meta_data->>'first_name') > 0 THEN
        first_letter := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'first_name', 1, 1));
        base_handle_string := NEW.raw_user_meta_data->>'first_name';
    ELSE
        first_letter := UPPER(SUBSTRING(NEW.email, 1, 1));
        base_handle_string := '';
    END IF;
    generated_handle := public.generate_unique_handle(base_handle_string);
    avatar_svg := 
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' ||
        '<rect width="100" height="100" fill="#000000"/>' ||
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF">' || first_letter || '</text>' ||
        '</svg>';

    -- Cria a organização pessoal
    INSERT INTO public.organizations (name, is_personal)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Personal', TRUE)
    RETURNING id INTO new_org_id;

    -- Cria o período contábil anual (principal)
    current_year := EXTRACT(YEAR FROM NOW());
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, fiscal_year, start_date, end_date, regime, annex, is_active, period_type)
    VALUES (new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex, TRUE, 'yearly')
    RETURNING id INTO new_period_id;

    -- Cria o registro no histórico de regimes
    INSERT INTO public.tax_regime_history (organization_id, regime, start_date, end_date)
    VALUES (new_org_id, default_regime, default_start_date, default_end_date);

    -- **NOVO: Chama a função para criar os períodos mensais**
    PERFORM public.create_monthly_accounting_periods(new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex);

    -- Cria o perfil do usuário
    INSERT INTO public.profiles (id, username, email, role, avatar_url, organization_id, active_accounting_period_id, handle)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.email, 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id, generated_handle);

    -- Atribui o papel de 'owner'
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

    -- Cria o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$;

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


-- Função para atualizar a coluna updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_multiple_journal_entries_and_lines(
    p_journal_entry_ids UUID[],
    p_organization_id UUID,
    p_accounting_period_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete associated entry_lines first
    DELETE FROM public.entry_lines
    WHERE journal_entry_id = ANY(p_journal_entry_ids)
    AND organization_id = p_organization_id
    AND accounting_period_id = p_accounting_period_id;

    -- Delete the journal_entries
    DELETE FROM public.journal_entries
    WHERE id = ANY(p_journal_entry_ids)
    AND organization_id = p_organization_id
    AND accounting_period_id = p_accounting_period_id;

    RETURN TRUE;
END;
$$;

-- supabase/migrations/20250807215900_create_check_user_access_function.sql

CREATE OR REPLACE FUNCTION public.check_user_access_to_journal_entry(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_org_id UUID;
  entry_org_id UUID;
  entry_period_id UUID;
  user_active_period_id UUID;
BEGIN
  -- Get the organization_id and accounting_period_id of the journal entry
  SELECT organization_id, accounting_period_id
  INTO entry_org_id, entry_period_id
  FROM public.journal_entries
  WHERE id = entry_id;

  -- Get the user's current active organization and accounting period
  SELECT organization_id, id
  INTO user_org_id, user_active_period_id
  FROM public.accounting_periods
  WHERE is_active = TRUE AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()); -- Assuming user_id is linked to accounting_periods

  -- Check if the user's active organization and period match the entry's organization and period
  RETURN (user_org_id = entry_org_id AND user_active_period_id = entry_period_id);
END;
$$;

-- 2. Create a function to log history
CREATE OR REPLACE FUNCTION public.log_journal_entry_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  details_jsonb JSONB;
BEGIN
  -- Get the user's name from the profiles table
  IF auth.uid() IS NOT NULL THEN
    SELECT p.username INTO user_profile FROM public.profiles p WHERE p.id = auth.uid();
  END IF;

  details_jsonb := '{}'::jsonb;

  IF TG_OP = 'INSERT' THEN
    details_jsonb := jsonb_build_object(
      'new_data', to_jsonb(NEW)
    );
    INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
    VALUES (NEW.id, auth.uid(), 'CREATED', details_jsonb, COALESCE(user_profile.username, 'System'));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status change specifically
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      details_jsonb := jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      );
      INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
      VALUES (NEW.id, auth.uid(), 'STATUS_UPDATED', details_jsonb, COALESCE(user_profile.username, 'System'));
    END IF;

    -- You can add more specific field tracking here if needed
    -- For a general edit, we can log that as well
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) AND OLD.status = NEW.status THEN
       details_jsonb := jsonb_build_object(
        'changes', 'Lançamento foi editado' -- A more detailed diff could be implemented here
      );
       INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
       VALUES (NEW.id, auth.uid(), 'EDITED', details_jsonb, COALESCE(user_profile.username, 'System'));
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Create the moddatetime function for updated_at triggers
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the check_user_organization_access function
CREATE OR REPLACE FUNCTION public.check_user_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID := auth.uid();
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organization_roles
    WHERE user_id = check_user_organization_access.user_id
      AND organization_id = org_id
  )
  INTO has_access;

  RETURN has_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_monthly_accounting_periods(
    p_organization_id UUID,
    p_fiscal_year INT,
    p_start_date DATE,
    p_end_date DATE,
    p_regime tax_regime_enum,
    p_annex VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    month_start_date DATE;
    month_end_date DATE;
    current_month DATE;
BEGIN
    current_month := date_trunc('month', p_start_date)::DATE;

    WHILE current_month <= p_end_date LOOP
        month_start_date := current_month;
        month_end_date := (current_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

        INSERT INTO public.accounting_periods (
            organization_id,
            fiscal_year,
            start_date,
            end_date,
            regime,
            annex,
            is_active,
            period_type
        ) VALUES (
            p_organization_id,
            p_fiscal_year,
            month_start_date,
            month_end_date,
            p_regime,
            p_annex,
            FALSE, -- Períodos mensais não são ativos
            'monthly'
        );

        current_month := (current_month + INTERVAL '1 month')::DATE;
    END LOOP;
END;
$$;
-- Migração: Atualização do Plano de Contas Padrão
-- Esta migração substitui a função public.create_default_chart_of_accounts
-- para incluir um plano de contas mais detalhado e hierárquico.
-- Esta função será chamada automaticamente para novas organizações criadas.
-- Organizações existentes não terão seus planos de contas atualizados automaticamente por esta migração.

set check_function_bodies = off;

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
    v_emprestimos_lp_id UUID;
    v_outras_receitas_id UUID;
    v_despesas_vendas_id UUID;
    v_despesas_admin_id UUID;
    v_despesas_financeiras_id UUID;
    v_despesas_tributarias_id UUID;

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
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Impostos a Recuperar', 'asset', '1.1.4', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Antecipadas', 'asset', '1.1.5', v_ativo_circ_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 3: Contas do Ativo Não Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Investimentos', 'asset', '1.2.1', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_investimentos_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Imobilizado', 'asset', '1.2.2', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_imobilizado_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Intangível', 'asset', '1.2.3', v_ativo_nao_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_intangivel_id;

    -- Nível 3: Contas do Passivo Circulante
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Contas a Pagar', 'liability', '2.1.1', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_contas_pagar_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Obrigações Fiscais', 'liability', '2.1.2', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE) RETURNING id INTO v_obrigacoes_fiscais_id;
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Obrigações Trabalhistas', 'liability', '2.1.3', v_passivo_circ_id, p_organization_id, p_accounting_period_id, FALSE);
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
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Caixa Geral', 'asset', '1.1.1.01', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Bancos Conta Movimento', 'asset', '1.1.1.02', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aplicações Financeiras de Curto Prazo', 'asset', '1.1.1.03', v_caixa_equiv_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Contas a Receber
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Clientes', 'asset', '1.1.2.01', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Duplicatas a Receber', 'asset', '1.1.2.02', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Adiantamentos a Fornecedores', 'asset', '1.1.2.03', v_contas_receber_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Estoques
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Mercadorias', 'asset', '1.1.3.01', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Produtos Acabados', 'asset', '1.1.3.02', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Estoque de Matérias-Primas', 'asset', '1.1.3.03', v_estoques_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Imobilizado
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Terrenos', 'asset', '1.2.2.01', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Edifícios e Construções', 'asset', '1.2.2.02', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Máquinas e Equipamentos', 'asset', '1.2.2.03', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Veículos', 'asset', '1.2.2.04', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Móveis e Utensílios', 'asset', '1.2.2.05', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Depreciação Acumulada', 'asset', '1.2.2.06', v_imobilizado_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Intangível
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Marcas e Patentes', 'asset', '1.2.3.01', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Softwares', 'asset', '1.2.3.02', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Amortização Acumulada', 'asset', '1.2.3.03', v_intangivel_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Contas a Pagar
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Fornecedores', 'liability', '2.1.1.01', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Salários a Pagar', 'liability', '2.1.1.02', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aluguéis a Pagar', 'liability', '2.1.1.03', v_contas_pagar_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Obrigações Fiscais
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ICMS a Recolher', 'liability', '2.1.2.01', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ISS a Recolher', 'liability', '2.1.2.02', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PIS a Recolher', 'liability', '2.1.2.03', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('COFINS a Recolher', 'liability', '2.1.2.04', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('IRPJ a Recolher', 'liability', '2.1.2.05', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('CSLL a Recolher', 'liability', '2.1.2.06', v_obrigacoes_fiscais_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas com Vendas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Comissões sobre Vendas', 'expense', '5.2.1.01', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Fretes e Carretos', 'expense', '5.2.1.02', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Publicidade e Propaganda', 'expense', '5.2.1.03', v_despesas_vendas_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Administrativas
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Salários e Encargos', 'expense', '5.2.2.01', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Aluguéis', 'expense', '5.2.2.02', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Energia Elétrica', 'expense', '5.2.2.03', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Água e Esgoto', 'expense', '5.2.2.04', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas com Telefone e Internet', 'expense', '5.2.2.05', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Depreciação', 'expense', '5.2.2.06', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Manutenção e Reparos', 'expense', '5.2.2.07', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Material de Escritório', 'expense', '5.2.2.08', v_despesas_admin_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Financeiras
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Juros Passivos', 'expense', '5.3.1.01', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Despesas Bancárias', 'expense', '5.3.1.02', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('Variações Monetárias Passivas', 'expense', '5.3.1.03', v_despesas_financeiras_id, p_organization_id, p_accounting_period_id, FALSE);

    -- Nível 4: Despesas Tributárias
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('IRPJ', 'expense', '5.3.2.01', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('CSLL', 'expense', '5.3.2.02', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('PIS', 'expense', '5.3.2.03', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('COFINS', 'expense', '5.3.2.04', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ISS', 'expense', '5.3.2.05', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);
    INSERT INTO public.accounts (name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected) VALUES ('ICMS', 'expense', '5.3.2.06', v_despesas_tributarias_id, p_organization_id, p_accounting_period_id, FALSE);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

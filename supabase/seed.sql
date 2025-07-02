-- supabase/seed.sql

-- Inserir um plano de contas básico
-- Ativos
INSERT INTO accounts (name, type) VALUES
('Caixa', 'Ativo Circulante'),
('Bancos Conta Movimento', 'Ativo Circulante'),
('Aplicações de Liquidez Imediata', 'Ativo Circulante'),
('Contas a Receber', 'Ativo Circulante'),
('Estoques', 'Ativo Circulante'),
('Imóveis', 'Ativo Não Circulante'),
('Veículos', 'Ativo Não Circulante'),
('Máquinas e Equipamentos', 'Ativo Não Circulante');

-- Passivos
INSERT INTO accounts (name, type) VALUES
('Fornecedores', 'Passivo Circulante'),
('Salários a Pagar', 'Passivo Circulante'),
('Impostos a Recolher', 'Passivo Circulante'),
('Empréstimos de Curto Prazo', 'Passivo Circulante'),
('Financiamentos de Longo Prazo', 'Passivo Não Circulante');

-- Patrimônio Líquido
INSERT INTO accounts (name, type) VALUES
('Capital Social', 'Patrimônio Líquido'),
('Reservas de Lucro', 'Patrimônio Líquido'),
('Lucros/Prejuízos Acumulados', 'Patrimônio Líquido');

-- Contas de Resultado (Receitas)
INSERT INTO accounts (name, type) VALUES
('Receita de Vendas', 'Receita'),
('Receitas Financeiras', 'Receita');

-- Contas de Resultado (Despesas)
INSERT INTO accounts (name, type) VALUES
('Custo da Mercadoria Vendida (CMV)', 'Despesa'),
('Despesas com Salários', 'Despesa'),
('Despesas Administrativas', 'Despesa'),
('Despesas com Vendas', 'Despesa'),
('Despesas Financeiras', 'Despesa');

-- Inserir alguns produtos de exemplo
INSERT INTO products (name, description, unit_cost, current_stock, icms_rate) VALUES
('Produto A', 'Descrição do Produto A', 10.50, 100, 18.00),
('Produto B', 'Descrição do Produto B', 25.00, 50, 18.00),
('Serviço de Consultoria', 'Serviço de consultoria financeira por hora', 150.00, 0, 0.00);

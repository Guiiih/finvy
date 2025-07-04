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
-- Melhora a performance das junções (implícitas) ao buscar lançamentos com suas linhas.
CREATE INDEX IF NOT EXISTS idx_entry_lines_journal_entry_id ON public.entry_lines(journal_entry_id);

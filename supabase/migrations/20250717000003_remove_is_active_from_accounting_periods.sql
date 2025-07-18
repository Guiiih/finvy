-- Remover a coluna is_active da tabela accounting_periods
ALTER TABLE public.accounting_periods
DROP COLUMN is_active;

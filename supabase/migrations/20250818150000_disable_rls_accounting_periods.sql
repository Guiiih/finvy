-- Migração: Desabilita RLS para accounting_periods (para depuração)

ALTER TABLE public.accounting_periods DISABLE ROW LEVEL SECURITY;
-- Alterar a restrição de chave estrangeira para active_accounting_period_id na tabela user_presence
-- para ON DELETE SET NULL

-- 1. Remover a restrição de chave estrangeira existente
ALTER TABLE public.user_presence
DROP CONSTRAINT user_presence_active_accounting_period_id_fkey;

-- 2. Adicionar a nova restrição de chave estrangeira com ON DELETE SET NULL
ALTER TABLE public.user_presence
ADD CONSTRAINT user_presence_active_accounting_period_id_fkey
FOREIGN KEY (active_accounting_period_id) REFERENCES public.accounting_periods(id) ON DELETE SET NULL;
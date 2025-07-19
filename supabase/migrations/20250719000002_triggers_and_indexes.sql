
-- Migração: Triggers e Índices

-- Trigger para chamar handle_new_user após a inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para chamar delete_user_data ANTES da exclusão em auth.users
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

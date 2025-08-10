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

-- Optional: Index for faster lookup by user_id and read status
CREATE INDEX notifications_user_id_read_idx ON public.notifications (user_id, read);

-- Trigger para a tabela journal_entries
CREATE TRIGGER set_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 3. Create a trigger to execute the function
CREATE TRIGGER on_journal_entry_change
AFTER INSERT OR UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_journal_entry_change();

-- Optional: Add an index for faster lookups on ncm
CREATE INDEX IF NOT EXISTS idx_products_ncm ON products(ncm);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tax_rules_geo ON tax_rules (uf_origin, uf_destination);
CREATE INDEX IF NOT EXISTS idx_tax_rules_ncm ON tax_rules (ncm_pattern);
CREATE INDEX IF NOT EXISTS idx_tax_rules_org ON tax_rules (organization_id);

-- Trigger to update 'updated_at' timestamp on tax_rules table
CREATE TRIGGER handle_updated_at_tax_rules
BEFORE UPDATE ON tax_rules
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

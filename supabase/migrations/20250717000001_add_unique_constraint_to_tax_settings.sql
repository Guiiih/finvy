-- Adicionar restrição UNIQUE à coluna organization_id na tabela tax_settings
ALTER TABLE public.tax_settings
ADD CONSTRAINT tax_settings_organization_id_key UNIQUE (organization_id);

-- Migração: Atualiza a tabela accounting_periods para usar fiscal_year e adicionar annex

-- 1. Adiciona a coluna fiscal_year
ALTER TABLE public.accounting_periods
ADD COLUMN fiscal_year INTEGER;

-- 2. Adiciona a coluna annex
ALTER TABLE public.accounting_periods
ADD COLUMN annex VARCHAR(255);

-- 3. Atualiza os dados existentes para fiscal_year (extraindo do nome, se possível)
--    Assumindo que o 'name' original era algo como 'YYYY Fiscal Year'
UPDATE public.accounting_periods
SET fiscal_year = SUBSTRING(name FROM '^(\d{4})')::INTEGER
WHERE name IS NOT NULL AND name ~ '^\d{4} Fiscal Year';

-- 4. Torna fiscal_year NOT NULL (após a atualização dos dados existentes)
ALTER TABLE public.accounting_periods
ALTER COLUMN fiscal_year SET NOT NULL;

-- 5. Remove a coluna name
ALTER TABLE public.accounting_periods
DROP COLUMN name;

-- 6. Atualiza as restrições UNIQUE para usar fiscal_year
-- Primeiro, remove as restrições antigas
ALTER TABLE public.accounting_periods
DROP CONSTRAINT IF EXISTS accounting_periods_organization_id_name_key;

ALTER TABLE public.accounting_periods
DROP CONSTRAINT IF EXISTS accounting_periods_organization_id_start_date_end_date_key;

-- Adiciona novas restrições UNIQUE
ALTER TABLE public.accounting_periods
ADD CONSTRAINT accounting_periods_organization_id_fiscal_year_key UNIQUE (organization_id, fiscal_year);



-- 7. Atualiza a função create_organization_and_assign_owner
--    Esta parte será feita em um passo separado para garantir a sintaxe correta da função.

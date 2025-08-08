-- Adiciona colunas de alíquotas de impostos à tabela entry_lines
ALTER TABLE entry_lines
ADD COLUMN IF NOT EXISTS icms_rate NUMERIC,
ADD COLUMN IF NOT EXISTS irrf_rate NUMERIC,
ADD COLUMN IF NOT EXISTS csll_rate NUMERIC,
ADD COLUMN IF NOT EXISTS inss_rate NUMERIC;

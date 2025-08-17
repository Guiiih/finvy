-- Remove the old unique constraint
ALTER TABLE public.accounting_periods
DROP CONSTRAINT IF EXISTS accounting_periods_organization_id_fiscal_year_key;

-- Add the new partial unique index
CREATE UNIQUE INDEX accounting_periods_organization_id_fiscal_year_key ON public.accounting_periods (organization_id, fiscal_year) WHERE is_active IS TRUE;
ALTER TABLE public.accounting_periods
ADD COLUMN is_active BOOLEAN DEFAULT FALSE;

ALTER TABLE public.accounting_periods
ALTER COLUMN is_active SET NOT NULL;
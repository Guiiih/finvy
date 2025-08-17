UPDATE public.accounting_periods
SET period_type = 'yearly'
WHERE is_active IS TRUE AND EXTRACT(MONTH FROM start_date) = 1 AND EXTRACT(DAY FROM start_date) = 1 AND EXTRACT(MONTH FROM end_date) = 12 AND EXTRACT(DAY FROM end_date) = 31;

UPDATE public.accounting_periods
SET period_type = 'monthly'
WHERE is_active IS FALSE;
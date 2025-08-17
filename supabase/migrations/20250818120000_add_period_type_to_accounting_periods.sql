CREATE TYPE period_type_enum AS ENUM ('yearly', 'monthly');

ALTER TABLE public.accounting_periods
ADD COLUMN period_type period_type_enum NOT NULL DEFAULT 'monthly';
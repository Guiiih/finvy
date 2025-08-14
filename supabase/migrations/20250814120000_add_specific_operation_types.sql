CREATE TYPE public.operation_type_enum AS ENUM (
    'venda_mercadorias',
    'venda_servicos',
    'compra_materia_prima',
    'compra_servicos',
    'outros'
);

ALTER TABLE public.accounts
ADD COLUMN default_operation_type public.operation_type_enum;

ALTER TABLE public.tax_rules
ADD COLUMN operation_type public.operation_type_enum;

COMMENT ON COLUMN public.accounts.default_operation_type IS 'Default fiscal operation type associated with this account.';
COMMENT ON COLUMN public.tax_rules.operation_type IS 'Specific fiscal operation type this tax rule applies to.';

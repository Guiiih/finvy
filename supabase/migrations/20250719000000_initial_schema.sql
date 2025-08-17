-- Migração: Esquema Inicial Consolidado

-- Cria o tipo ENUM para o regime fiscal, se não existir
DO $$ BEGIN
    CREATE TYPE tax_regime_enum AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cria o tipo ENUM para o status do lançamento contábil, se não existir
DO $$ BEGIN
    CREATE TYPE public.journal_entry_status AS ENUM ('draft', 'posted', 'reviewed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cria o tipo ENUM para o tipo de operação fiscal
DO $$ BEGIN
    CREATE TYPE public.operation_type_enum AS ENUM (
        'venda_mercadorias',
        'venda_servicos',
        'compra_materia_prima',
        'compra_servicos',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cria o tipo ENUM para o tipo de período
DO $$ BEGIN
    CREATE TYPE period_type_enum AS ENUM ('yearly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- Cria a tabela de organizações com todas as colunas
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    razao_social VARCHAR(255),
    uf VARCHAR(2),
    municipio VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_personal BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE
);

-- Cria a tabela de períodos contábeis
CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    fiscal_year INTEGER NOT NULL,
    annex VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    regime tax_regime_enum,
    period_type period_type_enum NOT NULL DEFAULT 'monthly'
);

-- Cria a tabela de perfis (sem a restrição UNIQUE em username)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT, -- Restrição UNIQUE removida
    avatar_url TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    active_accounting_period_id UUID, -- Chave estrangeira adicionada abaixo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    handle TEXT UNIQUE NOT NULL
);

-- Adiciona chave estrangeira aos perfis para o período contábil ativo
-- (Mantido como ALTER porque a tabela 'accounting_periods' precisa existir primeiro)
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_active_accounting_period
FOREIGN KEY (active_accounting_period_id) REFERENCES public.accounting_periods(id) ON DELETE SET NULL;

-- Cria a tabela de contas com todas as colunas
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    code VARCHAR(25),
    parent_account_id UUID REFERENCES accounts(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE,
    fiscal_operation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_protected BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    default_operation_type public.operation_type_enum
);
COMMENT ON COLUMN public.accounts.default_operation_type IS 'Default fiscal operation type associated with this account.';

-- Cria a tabela de produtos com todas as colunas e restrições
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    accounting_period_id UUID REFERENCES accounting_periods(id),
    quantity_in_stock INT NOT NULL DEFAULT 0,
    ncm VARCHAR(8),
    product_service_type TEXT CHECK (product_service_type IN ('Produto', 'Serviço')),
    default_cfop_purchase TEXT,
    default_cfop_sale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE (name, organization_id, accounting_period_id),
    CONSTRAINT ncm_format_check CHECK (ncm ~ '^[0-9]{8}$')
);

-- Cria a tabela de lançamentos contábeis com todas as colunas
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(255) NOT NULL DEFAULT 'N/A',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE,
    status public.journal_entry_status NOT NULL DEFAULT 'draft',
    created_by_name TEXT,
    created_by_email TEXT,
    created_by_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE
);

-- Cria a tabela de linhas de lançamento com todas as colunas
CREATE TABLE entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    debit NUMERIC(10, 2) DEFAULT 0,
    credit NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    product_id UUID REFERENCES products(id),
    quantity INTEGER,
    unit_cost NUMERIC(10, 2),
    ipi_rate NUMERIC,
    pis_rate NUMERIC,
    cofins_rate NUMERIC,
    mva_rate NUMERIC,
    icms_rate NUMERIC,
    irrf_rate NUMERIC,
    csll_rate NUMERIC,
    inss_rate NUMERIC,
    icms_st_value NUMERIC,
    ipi_value NUMERIC,
    pis_value NUMERIC,
    cofins_value NUMERIC,
    icms_value NUMERIC,
    total_gross NUMERIC,
    total_net NUMERIC,
    transaction_type VARCHAR(50),
    uf_origin VARCHAR(2),
    uf_destination VARCHAR(2),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Cria a tabela de transações financeiras
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Ex: 'income', 'expense', 'payment'
    description TEXT,
    account_id UUID REFERENCES accounts(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Cria a tabela de papéis de usuário por organização
CREATE TABLE public.user_organization_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- e.g., 'owner', 'admin', 'member', 'guest'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, organization_id),
    CONSTRAINT fk_user_organization_roles_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Cria a tabela de períodos contábeis compartilhados
CREATE TABLE public.shared_accounting_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    accounting_period_id uuid REFERENCES public.accounting_periods(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level text NOT NULL, -- e.g., 'read', 'write'
    shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (accounting_period_id, shared_with_user_id),
    CONSTRAINT fk_shared_accounting_periods_shared_with_profile FOREIGN KEY (shared_with_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_shared_accounting_periods_shared_by_profile FOREIGN KEY (shared_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Cria a tabela de configurações fiscais
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    icms_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    ipi_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    pis_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cofins_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    mva_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, effective_date),
    CONSTRAINT tax_settings_organization_id_key UNIQUE (organization_id)
);

-- Cria a tabela de histórico de regime fiscal
CREATE TABLE IF NOT EXISTS tax_regime_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    regime tax_regime_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tax_regime_period UNIQUE (organization_id, start_date, end_date)
);

-- Cria a tabela de notificações
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text NOT NULL, -- e.g., 'financial_transaction_due', 'low_stock', 'accounting_period_closed'
    message text NOT NULL,
    read boolean DEFAULT FALSE,
    created_at timestamp with time zone DEFAULT now()
);

-- Cria a tabela de presença do usuário
CREATE TABLE public.user_presence (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    active_accounting_period_id uuid REFERENCES public.accounting_periods(id) ON DELETE CASCADE,
    last_seen timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id)
);

-- Cria a tabela de lotes de inventário
CREATE TABLE public.inventory_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_purchased INT NOT NULL,
    quantity_remaining INT NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID NOT NULL REFERENCES public.accounting_periods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Cria a tabela para armazenar as sequências de referência
CREATE TABLE reference_sequences (
    prefix VARCHAR(50) NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE CASCADE,
    PRIMARY KEY (prefix, organization_id, accounting_period_id)
);

-- Cria a tabela de histórico de lançamentos contábeis
CREATE TABLE public.journal_entry_history (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id),
    action_type TEXT NOT NULL, -- e.g., 'CREATED', 'STATUS_UPDATED', 'EDITED'
    details JSONB, -- To store old and new values
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL,
    changed_by_name TEXT -- To store the user's name or 'System'
);

-- Cria a tabela de regras fiscais
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uf_origin VARCHAR(2) NOT NULL,
    uf_destination VARCHAR(2) NOT NULL,
    ncm_pattern VARCHAR(8),
    tax_type VARCHAR(20) NOT NULL, -- e.g., 'ICMS', 'ICMS-ST', 'FCP'
    rate NUMERIC(5, 4) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    operation_type public.operation_type_enum,
    CONSTRAINT uq_tax_rule UNIQUE (organization_id, uf_origin, uf_destination, ncm_pattern, tax_type)
);
COMMENT ON COLUMN public.tax_rules.operation_type IS 'Specific fiscal operation type this tax rule applies to.';

-- Cria a tabela de histórico de cálculo de impostos
CREATE TABLE tax_calculation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    input_data JSONB NOT NULL,
    calculated_taxes JSONB NOT NULL,
    applied_rules JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE tax_calculation_history IS 'Stores a detailed history of tax calculations for auditing and reference.';
COMMENT ON COLUMN tax_calculation_history.input_data IS 'The fiscal operation data used as input for the calculation.';
COMMENT ON COLUMN tax_calculation_history.calculated_taxes IS 'The resulting calculated tax data.';
COMMENT ON COLUMN tax_calculation_history.applied_rules IS 'Which specific tax rules were applied during the calculation.';

UPDATE public.accounting_periods
SET period_type = 'yearly'
WHERE is_active IS TRUE AND EXTRACT(MONTH FROM start_date) = 1 AND EXTRACT(DAY FROM start_date) = 1 AND EXTRACT(MONTH FROM end_date) = 12 AND EXTRACT(DAY FROM end_date) = 31;

UPDATE public.accounting_periods
SET period_type = 'monthly'
WHERE is_active IS FALSE;
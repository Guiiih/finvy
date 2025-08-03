-- Migration: Add inventory_lots table and costing_method to accounting_periods

-- Create ENUM type for costing methods
CREATE TYPE costing_method_enum AS ENUM ('average', 'fifo', 'lifo');

-- Add costing_method column to accounting_periods table
ALTER TABLE public.accounting_periods
ADD COLUMN IF NOT EXISTS costing_method costing_method_enum NOT NULL DEFAULT 'average';

-- Create inventory_lots table
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

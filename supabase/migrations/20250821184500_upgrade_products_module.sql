-- Migração: Upgrade do Módulo de Produtos
-- Adiciona novos campos à tabela de produtos e cria a tabela de movimentações de estoque.

-- 1. Tipos ENUM

DO $$ BEGIN
    CREATE TYPE public.costing_method_enum AS ENUM ('fifo', 'lifo', 'average');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stock_movement_type_enum AS ENUM ('purchase', 'sale', 'adjustment', 'initial_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alterar Tabela `products`

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS brand TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'Unidade',
    ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT 100,
    ADD COLUMN IF NOT EXISTS costing_method public.costing_method_enum DEFAULT 'average',
    ADD COLUMN IF NOT EXISTS avg_cost NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS last_cost NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS last_movement_date DATE,
    ADD COLUMN IF NOT EXISTS supplier TEXT,
    ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 3),
    ADD COLUMN IF NOT EXISTS dimensions TEXT, -- Ex: "30x20x15 cm"
    ADD COLUMN IF NOT EXISTS location TEXT;   -- Ex: "A1-B2-C3"

-- Adiciona um índice para SKU para buscas rápidas, se não existir
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_class c
        JOIN   pg_namespace n ON n.oid = c.relnamespace
        WHERE  c.relname = 'idx_products_sku'
        AND    n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_products_sku ON public.products (sku);
    END IF;
END $$;

-- 3. Criar Tabela `stock_movements`

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    movement_type public.stock_movement_type_enum NOT NULL,
    quantity INT NOT NULL,
    unit_cost NUMERIC(10, 2),
    reason TEXT,
    reference_id UUID, -- ID da venda, compra ou ajuste
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Adiciona índices para otimizar consultas, se não existirem
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_class c
        JOIN   pg_namespace n ON n.oid = c.relnamespace
        WHERE  c.relname = 'idx_stock_movements_product_id'
        AND    n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_stock_movements_product_id ON public.stock_movements (product_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_class c
        JOIN   pg_namespace n ON n.oid = c.relnamespace
        WHERE  c.relname = 'idx_stock_movements_movement_type'
        AND    n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements (movement_type);
    END IF;
END $$;

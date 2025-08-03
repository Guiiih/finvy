-- Migration: Remove old stock logic and prepare for new costing methods

-- 1. Drop the RPC function if it exists
DROP FUNCTION IF EXISTS public.update_product_stock_and_cost;

-- 2. Alter the products table
ALTER TABLE public.products
DROP COLUMN IF EXISTS unit_cost,
ADD COLUMN IF NOT EXISTS quantity_in_stock INT NOT NULL DEFAULT 0;

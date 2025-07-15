
-- Create a function to handle atomic product stock and cost updates
CREATE OR REPLACE FUNCTION update_product_stock_and_cost(
    p_product_id UUID,
    p_quantity NUMERIC,
    p_transaction_unit_cost NUMERIC,
    p_transaction_type TEXT,
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    unit_cost NUMERIC,
    current_stock NUMERIC,
    organization_id UUID,
    accounting_period_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock NUMERIC;
    v_unit_cost NUMERIC;
    v_new_current_stock NUMERIC;
    v_new_unit_cost NUMERIC;
    v_product_name TEXT;
BEGIN
    -- Lock the product row to prevent race conditions
    SELECT current_stock, unit_cost, name
    INTO v_current_stock, v_unit_cost, v_product_name
    FROM products
    WHERE id = p_product_id
      AND organization_id = p_organization_id
      AND accounting_period_id = p_accounting_period_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or inaccessible.';
    END IF;

    v_new_current_stock := v_current_stock;
    v_new_unit_cost := v_unit_cost;

    IF p_transaction_type = 'purchase' THEN
        v_new_current_stock := v_current_stock + p_quantity;
        IF v_new_current_stock = 0 THEN
            v_new_unit_cost := 0;
        ELSE
            v_new_unit_cost := ((v_current_stock * v_unit_cost) + (p_quantity * p_transaction_unit_cost)) / v_new_current_stock;
        END IF;
    ELSIF p_transaction_type = 'sale' THEN
        IF v_current_stock < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', v_product_name, v_current_stock, p_quantity;
        END IF;
        v_new_current_stock := v_current_stock - p_quantity;
        -- For sales, the unit_cost of the product itself doesn't change, only the stock
        -- The cost of goods sold will be based on the current average unit_cost
    ELSE
        RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
    END IF;

    -- Update the product
    UPDATE products
    SET
        current_stock = v_new_current_stock,
        unit_cost = v_new_unit_cost
    WHERE id = p_product_id
      AND organization_id = p_organization_id
      AND accounting_period_id = p_accounting_period_id
    RETURNING id, name, unit_cost, current_stock, organization_id, accounting_period_id
    INTO id, name, unit_cost, current_stock, organization_id, accounting_period_id;

    RETURN NEXT;
END;
$$;

-- Migration: Add stock management functions

-- Function to record a purchase and create an inventory lot
CREATE OR REPLACE FUNCTION public.record_purchase(
    p_product_id UUID,
    p_quantity INT,
    p_unit_cost NUMERIC(10, 2),
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Insert a new inventory lot
    INSERT INTO public.inventory_lots (
        product_id,
        quantity_purchased,
        quantity_remaining,
        unit_cost,
        organization_id,
        accounting_period_id
    ) VALUES (
        p_product_id,
        p_quantity,
        p_quantity,
        p_unit_cost,
        p_organization_id,
        p_accounting_period_id
    );

    -- Update total quantity in products table
    UPDATE public.products
    SET quantity_in_stock = quantity_in_stock + p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate COGS for a sale based on costing method
CREATE OR REPLACE FUNCTION public.calculate_cogs_for_sale(
    p_product_id UUID,
    p_quantity_sold INT,
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
    v_costing_method costing_method_enum;
    v_cogs NUMERIC(10, 2) := 0;
    v_remaining_quantity_to_sell INT := p_quantity_sold;
    v_lot RECORD;
BEGIN
    -- Get the costing method for the accounting period
    SELECT costing_method INTO v_costing_method
    FROM public.accounting_periods
    WHERE id = p_accounting_period_id;

    IF v_costing_method IS NULL THEN
        RAISE EXCEPTION 'Costing method not defined for accounting period %.', p_accounting_period_id;
    END IF;

    -- Handle different costing methods
    IF v_costing_method = 'average' THEN
        -- Logic for Weighted Average Cost
        -- This will require calculating the average cost of all available stock
        -- and then multiplying by the quantity sold.
        -- This part will be implemented in the next step.
        DECLARE
            v_total_value NUMERIC(10, 2);
            v_total_quantity INT;
            v_average_unit_cost NUMERIC(10, 2);
        BEGIN
            -- Calculate total value and total quantity of all remaining stock for the product
            SELECT
                COALESCE(SUM(quantity_remaining * unit_cost), 0),
                COALESCE(SUM(quantity_remaining), 0)
            INTO
                v_total_value,
                v_total_quantity
            FROM
                public.inventory_lots
            WHERE
                product_id = p_product_id
                AND organization_id = p_organization_id
                AND accounting_period_id = p_accounting_period_id
                AND quantity_remaining > 0;

            IF v_total_quantity > 0 THEN
                v_average_unit_cost := v_total_value / v_total_quantity;
                v_cogs := p_quantity_sold * v_average_unit_cost;

                -- Now, we need to "consume" the lots to reflect the sale.
                -- For average cost, we can simply reduce quantity_remaining proportionally
                -- or mark lots as consumed based on the total quantity sold.
                -- A simpler approach for average cost is to just update the total stock
                -- and not worry about individual lot consumption for COGS calculation,
                -- but we still need to ensure quantity_remaining is accurate.
                -- We will consume from oldest lots first to simplify inventory management,
                -- even though the COGS is based on average.

                FOR v_lot IN (
                    SELECT id, quantity_remaining
                    FROM public.inventory_lots
                    WHERE product_id = p_product_id
                      AND organization_id = p_organization_id
                      AND accounting_period_id = p_accounting_period_id
                      AND quantity_remaining > 0
                    ORDER BY purchase_date ASC, created_at ASC
                ) LOOP
                    IF p_quantity_sold <= 0 THEN
                        EXIT;
                    END IF;

                    IF v_lot.quantity_remaining >= p_quantity_sold THEN
                        UPDATE public.inventory_lots
                        SET quantity_remaining = v_lot.quantity_remaining - p_quantity_sold
                        WHERE id = v_lot.id;
                        p_quantity_sold := 0;
                    ELSE
                        p_quantity_sold := p_quantity_sold - v_lot.quantity_remaining;
                        UPDATE public.inventory_lots
                        SET quantity_remaining = 0
                        WHERE id = v_lot.id;
                    END IF;
                END LOOP;

            ELSE
                RAISE EXCEPTION 'No stock available for product % in accounting period % to calculate average cost.', p_product_id, p_accounting_period_id;
            END IF;
        END;
    ELSIF v_costing_method = 'fifo' THEN
        -- Logic for FIFO (PEPS)
        FOR v_lot IN (
            SELECT id, quantity_remaining, unit_cost
            FROM public.inventory_lots
            WHERE product_id = p_product_id
              AND organization_id = p_organization_id
              AND accounting_period_id = p_accounting_period_id
              AND quantity_remaining > 0
            ORDER BY purchase_date ASC, created_at ASC -- FIFO: Oldest lots first
        ) LOOP
            IF v_remaining_quantity_to_sell <= 0 THEN
                EXIT;
            END IF;

            IF v_lot.quantity_remaining >= v_remaining_quantity_to_sell THEN
                -- Current lot can cover the remaining quantity
                v_cogs := v_cogs + (v_remaining_quantity_to_sell * v_lot.unit_cost);
                UPDATE public.inventory_lots
                SET quantity_remaining = v_lot.quantity_remaining - v_remaining_quantity_to_sell
                WHERE id = v_lot.id;
                v_remaining_quantity_to_sell := 0;
            ELSE
                -- Current lot is not enough, consume it entirely
                v_cogs := v_cogs + (v_lot.quantity_remaining * v_lot.unit_cost);
                v_remaining_quantity_to_sell := v_remaining_quantity_to_sell - v_lot.quantity_remaining;
                UPDATE public.inventory_lots
                SET quantity_remaining = 0
                WHERE id = v_lot.id;
            END IF;
        END LOOP;

    ELSIF v_costing_method = 'lifo' THEN
        -- Logic for LIFO (UEPS)
        FOR v_lot IN (
            SELECT id, quantity_remaining, unit_cost
            FROM public.inventory_lots
            WHERE product_id = p_product_id
              AND organization_id = p_organization_id
              AND accounting_period_id = p_accounting_period_id
              AND quantity_remaining > 0
            ORDER BY purchase_date DESC, created_at DESC -- LIFO: Newest lots first
        ) LOOP
            IF v_remaining_quantity_to_sell <= 0 THEN
                EXIT;
            END IF;

            IF v_lot.quantity_remaining >= v_remaining_quantity_to_sell THEN
                -- Current lot can cover the remaining quantity
                v_cogs := v_cogs + (v_remaining_quantity_to_sell * v_lot.unit_cost);
                UPDATE public.inventory_lots
                SET quantity_remaining = v_lot.quantity_remaining - v_remaining_quantity_to_sell
                WHERE id = v_lot.id;
                v_remaining_quantity_to_sell := 0;
            ELSE
                -- Current lot is not enough, consume it entirely
                v_cogs := v_cogs + (v_lot.quantity_remaining * v_lot.unit_cost);
                v_remaining_quantity_to_sell := v_remaining_quantity_to_sell - v_lot.quantity_remaining;
                UPDATE public.inventory_lots
                SET quantity_remaining = 0
                WHERE id = v_lot.id;
            END IF;
        END LOOP;
    END IF;

    -- Update total quantity in products table (decrement)
    UPDATE public.products
    SET quantity_in_stock = quantity_in_stock - p_quantity_sold
    WHERE id = p_product_id;

    RETURN v_cogs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

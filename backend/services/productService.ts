import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";

export async function recordProductPurchase(
  product_id: string,
  quantity: number,
  unit_cost: number,
  organization_id: string,
  accounting_period_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);

  try {
    const { error: rpcError } = await userSupabase.rpc(
      "record_purchase",
      {
        p_product_id: product_id,
        p_quantity: quantity,
        p_unit_cost: unit_cost,
        p_organization_id: organization_id,
        p_accounting_period_id: accounting_period_id,
      },
    );

    if (rpcError) {
      logger.error(
        `Error calling RPC record_purchase for product_id: ${product_id}`,
        rpcError,
      );
      throw new Error(`Error recording product purchase: ${rpcError.message}`);
    }

    logger.info(`Product (ID: ${product_id}) purchase recorded via RPC.`);
  } catch (error: unknown) {
    logger.error("Error in recordProductPurchase:", error);
    throw error;
  }
}

export async function calculateCogsForSale(
  product_id: string,
  quantity_sold: number,
  organization_id: string,
  accounting_period_id: string,
  token: string,
): Promise<number> {
  const userSupabase = getSupabaseClient(token);

  try {
    const { data: cogs, error: rpcError } = await userSupabase.rpc(
      "calculate_cogs_for_sale",
      {
        p_product_id: product_id,
        p_quantity_sold: quantity_sold,
        p_organization_id: organization_id,
        p_accounting_period_id: accounting_period_id,
      },
    );

    if (rpcError) {
      logger.error(
        `Error calling RPC calculate_cogs_for_sale for product_id: ${product_id}`,
        rpcError,
      );
      throw new Error(`Error calculating COGS for sale: ${rpcError.message}`);
    }

    logger.info(`COGS for product (ID: ${product_id}) calculated via RPC.`);
    return cogs as number;
  } catch (error: unknown) {
    logger.error("Error in calculateCogsForSale:", error);
    throw error;
  }
}

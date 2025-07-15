import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";

export async function updateProductStockAndCost(
  product_id: string,
  quantity: number,
  transaction_unit_cost: number,
  transaction_type: "purchase" | "sale",
  organization_id: string,
  accounting_period_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);

  try {
    const { data: updatedProduct, error: rpcError } = await userSupabase.rpc(
      "update_product_stock_and_cost",
      {
        p_product_id: product_id,
        p_quantity: quantity,
        p_transaction_unit_cost: transaction_unit_cost,
        p_transaction_type: transaction_type,
        p_organization_id: organization_id,
        p_accounting_period_id: accounting_period_id,
      },
    );

    if (rpcError) {
      logger.error(
        `Error calling RPC update_product_stock_and_cost for product_id: ${product_id}`,
        rpcError,
      );
      throw new Error(
        `Error updating product stock and cost: ${rpcError.message}`,
      );
    }

    logger.info(
      `Product (ID: ${product_id}) stock and cost updated via RPC.`,
    );
    return updatedProduct;
  } catch (error: unknown) {
    logger.error("Error in updateProductStockAndCost:", error);
    throw error; // Re-throw to be handled by the caller
  }
}

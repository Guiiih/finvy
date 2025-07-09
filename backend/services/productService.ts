import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";

export async function updateProductStockAndCost(
  product_id: string,
  quantity: number,
  transaction_unit_cost: number,
  transaction_type: "purchase" | "sale",
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);

  try {
    // 1. Fetch current product data
    const { data: product, error: fetchError } = await userSupabase
      .from("products")
      .select("id, name, unit_cost, current_stock")
      .eq("id", product_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !product) {
      logger.error(
        `Product not found or fetch error for product_id: ${product_id}, user_id: ${user_id}`,
        fetchError,
      );
      throw new Error(
        `Product not found or fetch error: ${fetchError?.message || "Unknown error"}`,
      );
    }

    let new_current_stock = product.current_stock;
    let new_unit_cost = product.unit_cost;

    if (transaction_type === "purchase") {
      new_current_stock = product.current_stock + quantity;
      if (new_current_stock === 0) {
        new_unit_cost = 0; // Avoid division by zero if stock was 0 and quantity is 0
      } else {
        new_unit_cost =
          (product.current_stock * product.unit_cost +
            quantity * transaction_unit_cost) /
          new_current_stock;
      }
    } else if (transaction_type === "sale") {
      if (product.current_stock < quantity) {
        throw new Error(
          `Insufficient stock for product ${product.name}. Available: ${product.current_stock}, Requested: ${quantity}`,
        );
      }
      new_current_stock = product.current_stock - quantity;
      // For sales, the unit_cost of the product itself doesn't change, only the stock
      // The cost of goods sold will be based on the current average unit_cost
    }

    // 2. Update product stock and unit_cost (average cost)
    const { data: updatedProduct, error: updateError } = await userSupabase
      .from("products")
      .update({ current_stock: new_current_stock, unit_cost: new_unit_cost })
      .eq("id", product_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      logger.error(
        `Error updating product stock and cost for product_id: ${product_id}, user_id: ${user_id}`,
        updateError,
      );
      throw new Error(
        `Error updating product: ${updateError?.message || "Unknown error"}`,
      );
    }

    logger.info(
      `Product ${product.name} (ID: ${product_id}) stock updated to ${new_current_stock}, unit_cost updated to ${new_unit_cost}`,
    );
    return updatedProduct;
  } catch (error: unknown) {
    logger.error("Error in updateProductStockAndCost:", error);
    throw error; // Re-throw to be handled by the caller
  }
}

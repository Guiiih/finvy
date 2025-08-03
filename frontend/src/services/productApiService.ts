import { api } from './api'

export async function recordProductPurchase(
  product_id: string,
  quantity: number,
  unit_cost: number,
  organization_id: string,
  accounting_period_id: string,
) {
  return api.post('/products/purchase', {
    product_id,
    quantity,
    unit_cost,
    organization_id,
    accounting_period_id,
  })
}

export async function calculateCogsForSale(
  product_id: string,
  quantity_sold: number,
  organization_id: string,
  accounting_period_id: string,
): Promise<number> {
  const response = await api.post<{ cogs: number }, { product_id: string; quantity_sold: number; organization_id: string; accounting_period_id: string }>('/products/calculate-cogs', {
    product_id,
    quantity_sold,
    organization_id,
    accounting_period_id,
  })
  return response.cogs
}

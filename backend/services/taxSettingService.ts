import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { TaxSetting } from '../types/index.js'

export async function getTaxSettings(
  organization_id: string,
  token: string,
): Promise<TaxSetting | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error } = await userSupabase
    .from('tax_settings')
    .select('*')
    .eq('organization_id', organization_id)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows found
    logger.error({ error }, 'Tax Settings Service: Erro ao buscar configurações de impostos:')
    throw error
  }

  return data as TaxSetting | null
}

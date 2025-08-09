import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { TaxSetting, TaxRegimeHistory } from '../types/index.js'

export async function getTaxSettings(
  organization_id: string,
  token: string,
  transaction_date: string, // Adicionado
): Promise<TaxSetting | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error } = await userSupabase
    .from('tax_settings')
    .select('*')
    .eq('organization_id', organization_id)
    .lte('effective_date', transaction_date) // Filtra por data da transação
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

export async function getTaxRegimeHistory(
  organization_id: string,
  token: string,
): Promise<TaxRegimeHistory | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error } = await userSupabase
    .from('tax_regime_history')
    .select('*')
    .eq('organization_id', organization_id)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Tax Settings Service: Erro ao buscar histórico de regime tributário:')
    throw error
  }

  return data as TaxRegimeHistory | null
}

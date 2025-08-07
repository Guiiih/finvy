import { createClient } from '@supabase/supabase-js'
import logger from '../utils/logger.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Interface para um lançamento contábil
interface JournalEntry {
  id: string
  entry_date: string
  description: string
  organization_id: string
  accounting_period_id: string
  created_at: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  logger.error(
    'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão configuradas para o Journal Entry Search Service.',
  )
  throw new Error('Variáveis de ambiente do Supabase não configuradas.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function searchJournalEntriesByDescription(
  description: string,
  organization_id: string,
  active_accounting_period_id: string,
): Promise<JournalEntry[]> {
  // CORRIGIDO: de any[] para JournalEntry[]
  const normalizedDescription = description.trim()
  logger.info(
    `[JournalEntrySearchService] Buscando lançamentos com descrição normalizada: "${normalizedDescription}" para org: ${organization_id}, period: ${active_accounting_period_id}`,
  )

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .ilike('description', `%${normalizedDescription}%`)

    logger.info(
      `[JournalEntrySearchService] Query executada: description LIKE '%${normalizedDescription}%', organization_id = ${organization_id}, accounting_period_id = ${active_accounting_period_id}`,
    )
    logger.info(`[JournalEntrySearchService] Dados retornados: ${JSON.stringify(data)}`)

    if (error) {
      logger.error({ error }, 'Erro ao buscar lançamentos no Supabase:')
      throw new Error(`Erro ao buscar lançamentos: ${error.message}`)
    }

    logger.info(`[JournalEntrySearchService] Encontrados ${data?.length || 0} lançamentos.`)
    return data || []
  } catch (error) {
    logger.error({ error }, 'Erro inesperado no Journal Entry Search Service:')
    throw error
  }
}

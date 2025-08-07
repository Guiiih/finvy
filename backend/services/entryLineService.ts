import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { EntryLine } from '../types/index.js'

interface SimpleEntryLine {
  account_id: string
  debit: number | null
  credit: number | null
}

export async function createSimpleEntryLines(
  journal_entry_id: string,
  lines: SimpleEntryLine[],
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<EntryLine[]> {
  const userSupabase = getSupabaseClient(token)

  const linesToInsert = lines.map((line) => ({
    journal_entry_id,
    account_id: line.account_id,
    debit: line.debit,
    credit: line.credit,
    organization_id,
    accounting_period_id: active_accounting_period_id,
  }))

  const { data, error } = await userSupabase.from('entry_lines').insert(linesToInsert).select()

  if (error) {
    logger.error('Erro ao criar linhas de lançamento simples:', { error })
    throw error
  }

  return data as EntryLine[]
}

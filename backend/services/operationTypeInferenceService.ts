import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { Account, EntryLine } from '../types/index.js'
import { OperationType } from '../types/tax.js'

async function getEntryLines(journal_entry_id: string, token: string): Promise<EntryLine[]> {
  const userSupabase = getSupabaseClient(token)
  const { data, error } = await userSupabase
    .from('entry_lines')
    .select('*')
    .eq('journal_entry_id', journal_entry_id)

  if (error) {
    logger.error({ error }, `Error fetching entry lines for journal entry ${journal_entry_id}`)
    throw error
  }
  return data || []
}

async function getAccounts(account_ids: string[], token: string): Promise<Account[]> {
  const userSupabase = getSupabaseClient(token)
  const { data, error } = await userSupabase
    .from('accounts')
    .select('*')
    .in('id', account_ids)

  if (error) {
    logger.error({ error }, `Error fetching accounts`)
    throw error
  }
  return data || []
}

export async function inferOperationType(
  journal_entry_id: string,
  token: string,
): Promise<OperationType | null> {
  try {
    const entryLines = await getEntryLines(journal_entry_id, token)
    if (entryLines.length === 0) {
      return null
    }

    const accountIds = entryLines.map((line) => line.account_id)
    const accounts = await getAccounts(accountIds, token)
    const accountMap = new Map(accounts.map((acc) => [acc.id, acc]))

    // Prioritization: revenue -> expense -> asset -> liability -> equity
    const priority: Account['type'][] = ['revenue', 'expense', 'asset', 'liability', 'equity']

    for (const accountType of priority) {
      for (const line of entryLines) {
        const account = accountMap.get(line.account_id)
        if (account && account.type === accountType && account.default_operation_type) {
          logger.info(
            `Inferred operation type '${account.default_operation_type}' from account '${account.name}' (type: ${account.type}) for journal entry ${journal_entry_id}`,
          )
          return account.default_operation_type as OperationType
        }
      }
    }

    logger.warn(`Could not infer operation type for journal entry ${journal_entry_id}`)
    return null
  } catch (error) {
    logger.error({ error }, `Error inferring operation type for journal entry ${journal_entry_id}`)
    return null
  }
}

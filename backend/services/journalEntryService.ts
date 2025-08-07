import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { JournalEntry } from '../types/index.js'

export async function getJournalEntries(
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  filters: {
    dateFrom?: string | null
    dateTo?: string | null
    amountFrom?: number | null
    amountTo?: number | null
    createdBy?: string | null
    hasProduct?: boolean
    hasTaxes?: boolean
    accounts?: string[]
  } | null = null,
): Promise<{ data: JournalEntry[]; count: number }> {
  const userSupabase = getSupabaseClient(token)

  const offset = (page - 1) * limit

  let query = userSupabase
    .from('journal_entries')
    .select(
      'id, entry_date, description, reference, status, organization_id, accounting_period_id, created_by_name, created_by_email, created_by_username, created_at',
      {
        count: 'exact',
      },
    )
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)

  if (status) {
    query = query.eq('status', status)
  }

  if (filters) {
    if (filters.dateFrom) {
      query = query.gte('entry_date', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('entry_date', filters.dateTo)
    }
    if (filters.createdBy) {
      query = query.ilike('created_by_name', `%${filters.createdBy}%`)
    }

    // Filters requiring subqueries on 'entry_lines'
    if (filters.hasProduct) {
      const { data: productEntryIds, error: productError } = await userSupabase
        .from('entry_lines')
        .select('journal_entry_id')
        .not('product_id', 'is', null)
        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)

      if (productError) {
        logger.error({ productError }, 'Erro ao buscar IDs de lançamentos com produto:')
        throw productError
      }
      const ids = productEntryIds.map((item) => item.journal_entry_id)
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        // If no matching entry_lines, ensure no journal entries are returned
        query = query.eq('id', 'non_existent_id')
      }
    }

    if (filters.hasTaxes) {
      const { data: taxEntryIds, error: taxError } = await userSupabase
        .from('entry_lines')
        .select('journal_entry_id')
        .not('icms_value', 'is', null) // Assuming icms_value indicates taxes
        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)

      if (taxError) {
        logger.error({ taxError }, 'Erro ao buscar IDs de lançamentos com impostos:')
        throw taxError
      }
      const ids = taxEntryIds.map((item) => item.journal_entry_id)
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        query = query.eq('id', 'non_existent_id')
      }
    }

    if (filters.accounts && filters.accounts.length > 0) {
      const { data: accountEntryIds, error: accountError } = await userSupabase
        .from('entry_lines')
        .select('journal_entry_id')
        .in('account_id', filters.accounts)
        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)

      if (accountError) {
        logger.error({ accountError }, 'Erro ao buscar IDs de lançamentos por conta:')
        throw accountError
      }
      const ids = accountEntryIds.map((item) => item.journal_entry_id)
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        query = query.eq('id', 'non_existent_id')
      }
    }

    // Amount filters (amountFrom, amountTo) are complex as they require aggregation on entry_lines
    // and then filtering on the aggregated sum. This is not directly supported by Supabase client-side
    // query builder for joins/aggregations on related tables in a single query.
    // A common solution is to create a PostgreSQL function or view in Supabase that calculates
    // the total amount for each journal entry and then query that function/view.
    // For now, these filters will not be implemented directly here.
    if (filters.amountFrom !== null || filters.amountTo !== null) {
      logger.warn(
        'Amount filters (amountFrom, amountTo) are not fully implemented due to Supabase client-side query limitations for aggregation on related tables. Consider using a PostgreSQL function or view for this.',
      )
    }
  }

  const {
    data,
    error: dbError,
    count,
  } = await query.order('entry_date', { ascending: false }).range(offset, offset + limit - 1)

  if (dbError) {
    logger.error({ dbError }, 'Journal Entries Service: Erro ao buscar lançamentos de diário:')
    throw dbError
  }

  return { data: data as JournalEntry[], count: count || 0 }
}

export async function createJournalEntry(
  newEntry: Omit<JournalEntry, 'id' | 'lines'> & { reference: string },
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error: dbError } = await userSupabase
    .from('journal_entries')
    .insert([
      {
        ...newEntry,
        organization_id,
        accounting_period_id: active_accounting_period_id,
      },
    ])
    .select()

  if (dbError) {
    logger.error({ dbError }, 'Journal Entries Service: Erro ao criar lançamento de diário:')
    throw dbError
  }

  return data[0] as JournalEntry
}

export async function updateJournalEntry(
  id: string,
  updateData: Partial<Omit<JournalEntry, 'id' | 'lines'> & { reference: string }>,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error: dbError } = await userSupabase
    .from('journal_entries')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)
    .select()

  if (dbError) {
    logger.error({ dbError }, 'Journal Entries Service: Erro ao atualizar lançamento de diário:')
    throw dbError
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0] as JournalEntry
}

export async function deleteJournalEntry(
  id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
  user_id: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token)

  const { data, error: dbError } = await userSupabase.rpc('delete_journal_entry_and_lines', {
    p_journal_entry_id: id,
    p_organization_id: organization_id,
    p_accounting_period_id: active_accounting_period_id,
    p_user_id: user_id,
  })

  if (dbError) {
    logger.error({ dbError }, `Journal Entries Service: Erro ao deletar lançamento principal ${id} via RPC:`)
    throw dbError
  }

  return data // A função RPC retorna TRUE se deletado, FALSE caso contrário
}

export async function checkDoubleEntryBalance(
  journal_entry_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token)

  try {
    const { data: entryLines, error } = await userSupabase
      .from('entry_lines')
      .select('debit, credit')
      .eq('journal_entry_id', journal_entry_id)

    if (error) {
      logger.error({ error }, `Error fetching entry lines for journal entry ${journal_entry_id}:`)
      return false
    }

    if (!entryLines || entryLines.length === 0) {
      logger.warn(`No entry lines found for journal entry ${journal_entry_id}.`)
      return true // Or false, depending on whether an empty entry is considered balanced
    }

    let totalDebits = 0
    let totalCredits = 0

    for (const line of entryLines) {
      totalDebits += line.debit || 0
      totalCredits += line.credit || 0
    }

    const isBalanced = totalDebits.toFixed(2) === totalCredits.toFixed(2)

    if (!isBalanced) {
      logger.warn(
        `Journal entry ${journal_entry_id} is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      )
    }

    return isBalanced
  } catch (error) {
    logger.error(error, `Unexpected error in checkDoubleEntryBalance for journal entry ${journal_entry_id}:`)
    return false
  }
}

export async function bulkDeleteJournalEntries(
  ids: string[],
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
  user_id: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token)

  try {
    const { data, error: dbError } = await userSupabase.rpc('delete_multiple_journal_entries_and_lines', {
      p_journal_entry_ids: ids,
      p_organization_id: organization_id,
      p_accounting_period_id: active_accounting_period_id,
      p_user_id: user_id,
    })

    if (dbError) {
      logger.error({ dbError }, `Journal Entries Service: Erro ao deletar múltiplos lançamentos via RPC:`)
      throw dbError
    }

    return data // A função RPC retorna TRUE se deletado, FALSE caso contrário
  } catch (error) {
    logger.error(error, `Unexpected error in bulkDeleteJournalEntries:`)
    throw error
  }
}

export async function bulkUpdateJournalEntryStatus(
  ids: string[],
  status: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token)

  try {
    const { error: dbError } = await userSupabase
      .from('journal_entries')
      .update({ status: status })
      .in('id', ids)
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)

    if (dbError) {
      logger.error({ dbError }, `Journal Entries Service: Erro ao atualizar status de múltiplos lançamentos:`)
      throw dbError
    }

    return true
  } catch (error) {
    logger.error(error, `Unexpected error in bulkUpdateJournalEntryStatus:`)
    throw error
  }
}

import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";
import { JournalEntry } from "../types/index.js";

export const journalEntriesCache = new Map<
  string,
  { data: JournalEntry[]; timestamp: number }
>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

function getCacheKey(organizationId: string, accountingPeriodId: string): string {
  return `${organizationId}-${accountingPeriodId}`;
}

export function getCachedJournalEntries(organizationId: string, accountingPeriodId: string): JournalEntry[] | null {
  const key = getCacheKey(organizationId, accountingPeriodId);
  const cached = journalEntriesCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

export function setCachedJournalEntries(organizationId: string, accountingPeriodId: string, data: JournalEntry[]) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  journalEntriesCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateJournalEntriesCache(organizationId: string, accountingPeriodId: string) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  journalEntriesCache.delete(key);
}

export async function getJournalEntries(
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry[] | null> {
  const userSupabase = getSupabaseClient(token);

  const cachedData = getCachedJournalEntries(organization_id, active_accounting_period_id);
  if (cachedData) {
    logger.info("Journal Entries Service: Retornando lançamentos do cache.");
    return cachedData;
  }

  const { data, error: dbError } = await userSupabase
    .from("journal_entries")
    .select(
      "id, entry_date, description, organization_id, accounting_period_id",
    )
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id)
    .order("entry_date", { ascending: false });

  if (dbError) {
    logger.error(
      "Journal Entries Service: Erro ao buscar lançamentos de diário:",
      dbError,
    );
    throw dbError;
  }

  setCachedJournalEntries(organization_id, active_accounting_period_id, data as JournalEntry[]);
  return data as JournalEntry[];
}

export async function createJournalEntry(
  newEntry: Omit<JournalEntry, "id" | "lines">,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry | null> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase
    .from("journal_entries")
    .insert([
      {
        ...newEntry,
        organization_id,
        accounting_period_id: active_accounting_period_id,
      },
    ])
    .select();

  if (dbError) {
    logger.error(
      "Journal Entries Service: Erro ao criar lançamento de diário:",
      dbError,
    );
    throw dbError;
  }

  invalidateJournalEntriesCache(organization_id, active_accounting_period_id);
  return data[0] as JournalEntry;
}

export async function updateJournalEntry(
  id: string,
  updateData: Partial<Omit<JournalEntry, "id" | "lines">>,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry | null> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase
    .from("journal_entries")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id)
    .select();

  if (dbError) {
    logger.error(
      "Journal Entries Service: Erro ao atualizar lançamento de diário:",
      dbError,
    );
    throw dbError;
  }

  if (!data || data.length === 0) {
    return null;
  }

  invalidateJournalEntriesCache(organization_id, active_accounting_period_id);
  return data[0] as JournalEntry;
}

export async function deleteJournalEntry(
  id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase.rpc(
    "delete_journal_entry_and_lines",
    {
      p_journal_entry_id: id,
      p_organization_id: organization_id,
      p_accounting_period_id: active_accounting_period_id,
    },
  );

  if (dbError) {
    logger.error(
      `Journal Entries Service: Erro ao deletar lançamento principal ${id} via RPC:`,
      dbError,
    );
    throw dbError;
  }

  invalidateJournalEntriesCache(organization_id, active_accounting_period_id);
  return data; // A função RPC retorna TRUE se deletado, FALSE caso contrário
}

export async function checkDoubleEntryBalance(
  journal_entry_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token);

  try {
    const { data: entryLines, error } = await userSupabase
      .from("entry_lines")
      .select("debit, credit")
      .eq("journal_entry_id", journal_entry_id);

    if (error) {
      logger.error(
        `Error fetching entry lines for journal entry ${journal_entry_id}:`,
        error,
      );
      return false;
    }

    if (!entryLines || entryLines.length === 0) {
      logger.warn(
        `No entry lines found for journal entry ${journal_entry_id}.`,
      );
      return true; // Or false, depending on whether an empty entry is considered balanced
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of entryLines) {
      totalDebits += line.debit || 0;
      totalCredits += line.credit || 0;
    }

    const isBalanced = totalDebits.toFixed(2) === totalCredits.toFixed(2);

    if (!isBalanced) {
      logger.warn(
        `Journal entry ${journal_entry_id} is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      );
    }

    return isBalanced;
  } catch (error) {
    logger.error(
      `Unexpected error in checkDoubleEntryBalance for journal entry ${journal_entry_id}:`,
      error,
    );
    return false;
  }
}

import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";
import { JournalEntry } from "../types/index.js";

const journalEntriesCache = new Map<
  string,
  { data: JournalEntry[]; timestamp: number }
>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

function getCachedJournalEntries(userId: string): JournalEntry[] | null {
  const cached = journalEntriesCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedJournalEntries(userId: string, data: JournalEntry[]) {
  journalEntriesCache.set(userId, { data, timestamp: Date.now() });
}

export function invalidateJournalEntriesCache(userId: string) {
  journalEntriesCache.delete(userId);
}

export async function getJournalEntries(
  user_id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry[] | null> {
  const userSupabase = getSupabaseClient(token);

  const cachedData = getCachedJournalEntries(user_id);
  if (cachedData) {
    logger.info("Journal Entries Service: Retornando lançamentos do cache.");
    return cachedData;
  }

  const { data, error: dbError } = await userSupabase
    .from("journal_entries")
    .select(
      "id, entry_date, description, user_id, organization_id, accounting_period_id",
    )
    .eq("user_id", user_id)
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

  setCachedJournalEntries(user_id, data as JournalEntry[]);
  return data as JournalEntry[];
}

export async function createJournalEntry(
  newEntry: Omit<JournalEntry, "id" | "lines">,
  user_id: string,
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
        user_id,
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

  invalidateJournalEntriesCache(user_id);
  return data[0] as JournalEntry;
}

export async function updateJournalEntry(
  id: string,
  updateData: Partial<Omit<JournalEntry, "id" | "lines">>,
  user_id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<JournalEntry | null> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase
    .from("journal_entries")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user_id)
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

  invalidateJournalEntriesCache(user_id);
  return data[0] as JournalEntry;
}

export async function deleteJournalEntry(
  id: string,
  user_id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token);

  // First, delete all associated entry_lines
  const { error: deleteLinesError } = await userSupabase
    .from("entry_lines")
    .delete()
    .eq("journal_entry_id", id)
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id);

  if (deleteLinesError) {
    logger.error(
      `Journal Entries Service: Erro ao deletar linhas de lançamento para ${id}:`,
      deleteLinesError,
    );
    throw deleteLinesError;
  }

  const { error: dbError, count } = await userSupabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id)
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id);

  if (dbError) {
    logger.error(
      `Journal Entries Service: Erro ao deletar lançamento principal ${id}:`,
      dbError,
    );
    throw dbError;
  }

  if (count === 0) {
    return false;
  }

  invalidateJournalEntriesCache(user_id);
  return true;
}

export async function checkDoubleEntryBalance(
  journal_entry_id: string,
  user_id: string,
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

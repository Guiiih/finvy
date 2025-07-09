import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";

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

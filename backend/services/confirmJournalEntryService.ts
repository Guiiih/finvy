import logger from "../utils/logger.js";
import { getOrCreateAccount } from "./accountService.js";
import { createJournalEntry } from "./journalEntryService.js";
import { JournalEntry, EntryLine } from "../types/index.js";
import { createSimpleEntryLines } from "./entryLineService.js";

interface ProposedEntry {
  date: string;
  description: string;
  reference?: string; // Adicionado o campo reference
  debits: Array<{ account: string; value: number }>;
  credits: Array<{ account: string; value: number }>;
}

export async function confirmProposedJournalEntries(
  proposedEntries: ProposedEntry[],
  organization_id: string,
  active_accounting_period_id: string,
    token: string,
): Promise<Array<JournalEntry & { lines: EntryLine[] }>> {
  logger.info(`[ConfirmJournalEntryService] Confirmando e criando lançamentos propostos.`);

  const createdEntries = [];

  for (const entry of proposedEntries) {
    // 1. Criar o Journal Entry principal
    const journalEntry = await createJournalEntry(
      { entry_date: new Date(entry.date).toISOString().slice(0, 10), description: entry.description, reference: entry.reference || 'AUTO-GENERATED' },
      organization_id,
      active_accounting_period_id,
      token
    );

    if (!journalEntry) {
      throw new Error("Falha ao criar o cabeçalho do lançamento contábil.");
    }

    // 2. Mapear nomes de conta para IDs
    const linesToCreate = [];
    for (const debit of entry.debits) {
      const account = await getOrCreateAccount(debit.account, organization_id, active_accounting_period_id, token, entry.description);
      linesToCreate.push({ account_id: account.id, debit: debit.value, credit: null });
    }
    for (const credit of entry.credits) {
      const account = await getOrCreateAccount(credit.account, organization_id, active_accounting_period_id, token, entry.description);
      linesToCreate.push({ account_id: account.id, debit: null, credit: credit.value });
    }

    // 3. Criar as Entry Lines
    logger.debug(`[ConfirmJournalEntryService] Linhas a serem inseridas para o lançamento ${journalEntry.id}:`, linesToCreate);
    const createdLines = await createSimpleEntryLines(
      journalEntry.id,
      linesToCreate,
      organization_id,
      active_accounting_period_id,
      token
    );

    createdEntries.push({ ...journalEntry, lines: createdLines });
  }

  logger.info(`[ConfirmJournalEntryService] ${createdEntries.length} lançamentos criados com sucesso.`);
  return createdEntries;
}

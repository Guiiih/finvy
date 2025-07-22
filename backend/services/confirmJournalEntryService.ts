import logger from "../utils/logger.js";
import { findAccountByName } from "./accountService.js";
import { createJournalEntry } from "./journalEntryService.js";
import { createSimpleEntryLines } from "./entryLineService.js";

interface ProposedEntry {
  date: string;
  description: string;
  debits: Array<{ account: string; value: number }>;
  credits: Array<{ account: string; value: number }>;
}

export async function confirmProposedJournalEntries(
  proposedEntries: ProposedEntry[],
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<any[]> {
  logger.info(`[ConfirmJournalEntryService] Confirmando e criando lançamentos propostos.`);

  const createdEntries = [];

  for (const entry of proposedEntries) {
    // 1. Criar o Journal Entry principal
    const journalEntry = await createJournalEntry(
      { entry_date: new Date(entry.date).toISOString().slice(0, 10), description: entry.description },
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
      const account = await findAccountByName(debit.account, organization_id, active_accounting_period_id, token);
      if (!account) {
        throw new Error(`A conta de débito "${debit.account}" não foi encontrada. Por favor, crie a conta antes de continuar.`);
      }
      linesToCreate.push({ account_id: account.id, debit: debit.value, credit: null });
    }
    for (const credit of entry.credits) {
      const account = await findAccountByName(credit.account, organization_id, active_accounting_period_id, token);
      if (!account) {
        throw new Error(`A conta de crédito "${credit.account}" não foi encontrada. Por favor, crie a conta antes de continuar.`);
      }
      linesToCreate.push({ account_id: account.id, debit: null, credit: credit.value });
    }

    // 3. Criar as Entry Lines
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

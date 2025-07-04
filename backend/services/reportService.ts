
import { getSupabaseClient } from "../utils/supabaseClient.js";
import type {
  Account,
  JournalEntry,
  LedgerAccount as FrontendLedgerAccount,
} from "../../frontend/src/types/index.js";

interface EntryLine {
  account_id: string;
  debit: number;
  credit: number;
}

interface StockBalance {
  product_id: string;
  product_name: string;
  balance: number;
}

type LedgerAccount = FrontendLedgerAccount;

async function getAccounts(user_id: string, token: string): Promise<Account[]> {
  const userSupabase = getSupabaseClient(token);
  const { data, error } = await userSupabase
    .from("accounts")
    .select("id, name, type")
    .eq("user_id", user_id);
  if (error) throw error;
  return data;
}

interface JournalEntryWithLines extends JournalEntry {
  entry_lines: EntryLine[];
}

async function getJournalEntries(
  user_id: string,
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<JournalEntry[]> {
  const userSupabase = getSupabaseClient(token);
  let query = userSupabase
    .from("journal_entries")
    .select("*, entry_lines(*)")
    .eq("user_id", user_id);

  if (startDate) {
    query = query.gte("entry_date", startDate);
  }
  if (endDate) {
    query = query.lte("entry_date", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((entry: JournalEntryWithLines) => ({
    ...entry,
    lines: entry.entry_lines.map((line: EntryLine) => {
       
      return {
        account_id: line.account_id,
        type: line.debit > 0 ? "debit" : "credit",
        amount: line.debit > 0 ? line.debit : line.credit,
        debit: line.debit,
        credit: line.credit,
      };
    }),
  }));
}

export function calculateTrialBalance(
  accounts: Account[],
  journalEntries: JournalEntry[],
): LedgerAccount[] {
  const accountsMap = new Map<string, LedgerAccount>();
  accounts.forEach((account) => {
    accountsMap.set(account.id, {
      account_id: account.id,
      accountName: account.name,
      type: account.type,
      debitEntries: [],
      creditEntries: [],
      totalDebits: 0,
      totalCredits: 0,
      debits: 0,
      credits: 0,
      finalBalance: 0,
    });
  });

  journalEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const accountData = accountsMap.get(line.account_id);
      if (accountData) {
        if (line.debit) {
          accountData.totalDebits += line.debit;
        }
        if (line.credit) {
          accountData.totalCredits += line.credit;
        }
      }
    });
  });

  accountsMap.forEach((accountData) => {
    const isDebitNature = [
      "Ativo Circulante",
      "Ativo Não Circulante",
      "Despesa",
    ].includes(accountData.type);
    accountData.finalBalance = isDebitNature
      ? accountData.totalDebits - accountData.totalCredits
      : accountData.totalCredits - accountData.totalDebits;
  });

  return Array.from(accountsMap.values());
}

// Placeholder for DRE calculation
function generateDreData() {
   
  // TODO: Implement actual DRE calculation logic
  return { lucroLiquido: 1000 }; // Placeholder
}

// Placeholder for Balance Sheet calculation
function generateBalanceSheetData() {
   
  // TODO: Implement actual Balance Sheet calculation logic
  return {
    totalDoAtivo: 5000,
    totalPassivoEPatrimonioLiquido: 5000,
    isBalanced: true,
  }; // Placeholder
}

export async function generateReports(
  user_id: string,
  token: string,
  startDate?: string,
  endDate?: string,
) {
  const [accounts, journalEntries] = await Promise.all([
    getAccounts(user_id, token),
    getJournalEntries(user_id, token, startDate, endDate),
  ]);

  const ledgerAccountsList = calculateTrialBalance(accounts, journalEntries);

  const dreData = generateDreData();
  const balanceSheetData = generateBalanceSheetData();
  const stockBalances: StockBalance[] = []; // TODO: Properly type when stock control is implemented

  return {
    trialBalanceData: ledgerAccountsList,
    dreData,
    balanceSheetData,
    stockBalances,
  };
}

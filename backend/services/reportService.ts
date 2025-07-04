// backend/services/reportService.ts

import { getSupabaseClient } from "../utils/supabaseClient.js";
import type {
  Account,
  JournalEntry,
  LedgerAccount as FrontendLedgerAccount,
  AccountType,
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

// Helper to map Portuguese account types to English enum types for calculations
function mapAccountTypeForCalculation(accountType: string): AccountType | undefined {
  switch (accountType) {
    case "Receita":
      return "revenue";
    case "Despesa":
      return "expense";
    case "Ativo Circulante":
    case "Ativo Não Circulante":
      return "asset";
    case "Passivo":
      return "liability";
    case "Patrimônio Líquido":
      return "equity";
    default:
      return undefined; // Or throw an error for unknown types
  }
}


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

// New function for detailed ledger reports
export function calculateLedgerDetails(
  accounts: Account[],
  journalEntries: JournalEntry[],
) {
  const ledgerDetails: { [accountId: string]: any[] } = {}; // Using 'any' for simplicity, should be more specific

  accounts.forEach(account => {
    ledgerDetails[account.id] = [];
  });

  journalEntries.forEach(entry => {
    entry.lines.forEach(line => {
      if (ledgerDetails[line.account_id]) {
        ledgerDetails[line.account_id].push({
          journalEntryId: entry.id,
          entryDate: entry.entry_date,
          description: entry.description,
          debit: line.debit,
          credit: line.credit,
        });
      }
    });
  });

  return ledgerDetails;
}


// Actual DRE calculation
function calculateDreData(accounts: Account[], journalEntries: JournalEntry[]) {
  let totalRevenue = 0;
  let totalExpenses = 0;

  const trialBalance = calculateTrialBalance(accounts, journalEntries);

  trialBalance.forEach(account => {
    const mappedType = mapAccountTypeForCalculation(account.type);
    if (mappedType === 'revenue') {
      totalRevenue += account.finalBalance;
    } else if (mappedType === 'expense') {
      totalExpenses += account.finalBalance;
    }
  });

  const netIncome = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    netIncome,
  };
}

// Actual Balance Sheet calculation
function calculateBalanceSheetData(accounts: Account[], journalEntries: JournalEntry[]) {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const trialBalance = calculateTrialBalance(accounts, journalEntries);

  trialBalance.forEach(account => {
    const mappedType = mapAccountTypeForCalculation(account.type);
    if (mappedType === 'asset') {
      totalAssets += account.finalBalance;
    } else if (mappedType === 'liability') {
      totalLiabilities += account.finalBalance;
    } else if (mappedType === 'equity') {
      totalEquity += account.finalBalance;
    }
  });

  const isBalanced = totalAssets === (totalLiabilities + totalEquity);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced,
  };
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

  const dreData = calculateDreData(accounts, journalEntries); // Use actual DRE calculation
  const balanceSheetData = calculateBalanceSheetData(accounts, journalEntries); // Use actual Balance Sheet calculation
  const ledgerDetails = calculateLedgerDetails(accounts, journalEntries); // New detailed ledger report
  const stockBalances: StockBalance[] = []; // TODO: Properly type when stock control is implemented

  return {
    trialBalanceData: ledgerAccountsList,
    dreData,
    balanceSheetData,
    ledgerDetails,
    stockBalances,
  };
}
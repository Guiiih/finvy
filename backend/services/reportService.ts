import { getSupabaseClient } from "../utils/supabaseClient.js";
import type {
  Account,
  JournalEntry,
  LedgerAccount as FrontendLedgerAccount,
  AccountType,
} from "../../frontend/src/types/index.js";



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
  if (error) throw new Error(error.message || "Erro ao buscar dados.");
  return data;
}

interface SupabaseRawJournalEntry {
  id: string;
  entry_date: string;
  description: string;
  user_id?: string;
  entry_lines: Array<{
    id: string;
    account_id: string;
    debit: number | null;
    credit: number | null;
    product_id: string | null;
    quantity: number | null;
    unit_cost: number | null;
    total_gross: number | null;
    icms_value: number | null;
    ipi_value: number | null;
    pis_value: number | null;
    cofins_value: number | null;
    mva_rate: number | null;
    icms_st_value: number | null;
    total_net: number | null;
    transaction_type: string | null;
  }>;
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
    .select("id, entry_date, description, entry_lines(id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, ipi_value, pis_value, cofins_value, mva_rate, icms_st_value, total_net, transaction_type)")
    .eq("user_id", user_id);

  if (startDate) {
    query = query.gte("entry_date", startDate);
  }
  if (endDate) {
    query = query.lte("entry_date", endDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Erro ao buscar lançamentos contábeis.");

  return data.map((entry: SupabaseRawJournalEntry): JournalEntry => {
    const { entry_lines, ...restOfEntry } = entry;
    return {
      ...restOfEntry,
      lines: entry_lines.map((line) => {
        return {
          account_id: line.account_id,
          type: (line.debit ?? 0) > 0 ? "debit" : "credit",
          amount: (line.debit ?? 0) > 0 ? (line.debit ?? 0) : (line.credit ?? 0),
          debit: line.debit || 0,
          credit: line.credit || 0,
        };
      }),
    };
  });
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
        if (line.debit !== null) {
          accountData.totalDebits += line.debit ?? 0;
        }
        if (line.credit !== null) {
          accountData.totalCredits += line.credit ?? 0;
        }
      }
    });
  });

  accountsMap.forEach((accountData) => {
    const isDebitNature = ["asset", "expense"].includes(accountData.type);
    accountData.finalBalance = isDebitNature
      ? accountData.totalDebits - accountData.totalCredits
      : accountData.totalCredits - accountData.totalDebits;
  });

  return Array.from(accountsMap.values());
}

export function calculateLedgerDetails(
  accounts: Account[],
  journalEntries: JournalEntry[],
) {
  const ledgerDetails: { [accountId: string]: { journalEntryId: string; entryDate: string; description: string; debit: number; credit: number; }[] } = {};

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
          debit: line.debit ?? 0,
          credit: line.credit ?? 0,
        });
      }
    });
  });

  return ledgerDetails;
}


export function calculateDreData(accounts: Account[], journalEntries: JournalEntry[]) {
  let totalRevenue = 0;
  let totalExpenses = 0;

  const trialBalance = calculateTrialBalance(accounts, journalEntries);

  trialBalance.forEach(account => {
    if (account.type === 'revenue') {
      totalRevenue += account.finalBalance;
    } else if (account.type === 'expense') {
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

export function calculateBalanceSheetData(accounts: Account[], journalEntries: JournalEntry[]) {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const trialBalance = calculateTrialBalance(accounts, journalEntries);

  trialBalance.forEach(account => {
    if (account.type === 'asset') {
      totalAssets += account.finalBalance;
    } else if (account.type === 'liability') {
      totalLiabilities += account.finalBalance;
    } else if (account.type === 'equity') {
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

export function calculateDfcData(accounts: Account[], journalEntries: JournalEntry[]) {
  let operatingActivities = 0;
  let investingActivities = 0;
  let financingActivities = 0;

  const cashAccountIds = accounts.filter(acc => acc.name === 'Cash' || acc.name === 'Bank Account').map(acc => acc.id);
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

  journalEntries.forEach(entry => {
    entry.lines.forEach(line => {
      // Only consider lines that affect cash accounts
      if (cashAccountIds.includes(line.account_id)) {
        const relatedAccountLine = entry.lines.find(l => l.account_id !== line.account_id); // The other side of the entry
        if (!relatedAccountLine) return; // Should not happen for balanced entries

        const relatedAccount = accountMap.get(relatedAccountLine.account_id);
        if (!relatedAccount) return;

        const amount = (line.debit ?? 0) > 0 ? (line.debit ?? 0) : (line.credit ?? 0); // Cash movement amount

        // Determine if cash is flowing in or out from the perspective of the cash account
        // If cash account is debited, it's an inflow. If credited, it's an outflow.
        const cashFlowDirection = (line.debit ?? 0) > 0 ? 1 : -1; 

        // Categorization based on related account type and name
        if (['revenue', 'expense'].includes(relatedAccount.type)) {
          operatingActivities += (amount * cashFlowDirection);
        } else if (relatedAccount.name === 'Equipment' || relatedAccount.name.includes('Invest')) { // Example for investing
          investingActivities += (amount * cashFlowDirection);
        } else if (['liability', 'equity'].includes(relatedAccount.type) && (relatedAccount.name.includes('Loan') || relatedAccount.name.includes('Capital'))) { // Example for financing
          financingActivities += (amount * cashFlowDirection);
        } else { // Fallback for other operating activities if not explicitly categorized
          operatingActivities += (amount * cashFlowDirection);
        }
      }
    });
  });

  const netCashFlow = operatingActivities + investingActivities + financingActivities;

  return {
    operatingActivities,
    investingActivities,
    financingActivities,
    netCashFlow,
  };
}


async function getProductStockBalances(user_id: string, token: string): Promise<StockBalance[]> {
  const userSupabase = getSupabaseClient(token);
  const { data, error } = await userSupabase
    .from("products")
    .select("id, name, current_stock"); // Assuming 'name' is product name

  if (error) throw new Error(error.message || "Error fetching product stock balances.");

  return data.map(product => ({
    product_id: product.id,
    product_name: product.name,
    balance: product.current_stock,
  }));
}

export async function generateReports(
  user_id: string,
  token: string,
  startDate?: string,
  endDate?: string,
) {
  const [accounts, journalEntries, productStockBalances] = await Promise.all([
    getAccounts(user_id, token),
    getJournalEntries(user_id, token, startDate, endDate),
    getProductStockBalances(user_id, token), // Fetch product stock balances
  ]);

  const ledgerAccountsList = calculateTrialBalance(accounts, journalEntries);

  const dreData = calculateDreData(accounts, journalEntries);
  const balanceSheetData = calculateBalanceSheetData(accounts, journalEntries);
  const dfcData = calculateDfcData(accounts, journalEntries);
  const ledgerDetails = calculateLedgerDetails(accounts, journalEntries);
  const stockBalances: StockBalance[] = productStockBalances; // Populate stockBalances

  return {
    accounts,
    journalEntries,
    trialBalanceData: ledgerAccountsList,
    dreData,
    balanceSheetData,
    dfcData,
    ledgerDetails,
    stockBalances,
  };
}
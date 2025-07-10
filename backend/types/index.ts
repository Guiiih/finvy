export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Account {
  id: string
  name: string
  type: AccountType
  parentId?: string | null
  user_id?: string
  code?: number
  organization_id?: string
  accounting_period_id?: string
}

export type EntryType = 'debit' | 'credit'

export interface EntryLine {
  id?: string
  account_id: string
  type: EntryType
  amount: number
  product_id?: string
  quantity?: number
  unit_cost?: number
  total_gross?: number
  icms_value?: number
  icms_rate?: number
  total_net?: number
  debit?: number
  credit?: number
  organization_id?: string;
  accounting_period_id?: string;
}

export interface JournalEntry {
  id: string
  entry_date: string
  description: string
  lines: EntryLine[]
  user_id?: string
  organization_id?: string;
  accounting_period_id?: string;
}

export interface LedgerAccount {
  account_id: string
  accountName: string
  type: AccountType
  debitEntries: number[]
  creditEntries: number[]
  totalDebits: number
  totalCredits: number
  debits: number
  credits: number
  finalBalance: number
}

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

export interface Product {
  id: string
  name: string
  description?: string
  unit_cost: number
  current_stock: number
  icms_rate?: number
  user_id?: string
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

export interface JournalEntryPayload extends Omit<JournalEntry, 'id' | 'lines' | 'user_id'> {
  organization_id?: string;
  accounting_period_id?: string;
}


export interface StockMovement {
  id: string
  journalEntryId?: string
  date: string
  type: 'purchase' | 'sale' | 'in' | 'out'
  productId: string
  quantity: number
  unit_cost: number
  totalValue: number
}

export interface ProductBalance {
  product_id: string
  productName: string
  quantity: number
  unit_cost: number
  totalValue: number
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

export interface FinancialTransaction {
  id: string
  description: string
  amount: number
  due_date: string
  paid_date?: string | null
  received_date?: string | null
  is_paid?: boolean
  is_received?: boolean
  created_at: string
}

export interface AccountingPeriod {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}
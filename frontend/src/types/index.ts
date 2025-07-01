// frontend/src/types/index.ts

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  parentId?: string | null;
  user_id?: string;
  code?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  unit_cost: number; 
  current_stock: number;
  icms_rate?: number; // Nova propriedade para alíquota de ICMS
  user_id?: string;
}

export type EntryType = 'debit' | 'credit'; 

export interface EntryLine {
  account_id: string;
  type: EntryType; // 'debit' or 'credit'
  amount: number;
  product_id?: string;
  quantity?: number;
  unit_cost?: number; // Custo unitário do produto na linha
  total_gross?: number; // Valor total bruto da linha (quantidade * unit_cost)
  icms_value?: number; // Valor do ICMS calculado para a linha
  icms_rate?: number; // Alíquota de ICMS para a linha
  total_net?: number; // Valor total líquido da linha (total_gross - icms_value)
  debit?: number;
  credit?: number;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  description: string;
  lines: EntryLine[];
  user_id?: string;
}

export interface StockMovement {
  id: string;
  journalEntryId?: string;
  date: string;
  type: 'purchase' | 'sale' | 'in' | 'out';
  productId: string;
  quantity: number;
  unit_cost: number; 
  totalValue: number;
}

export interface ProductBalance {
  product_id: string;
  productName: string;
  quantity: number;
  unit_cost: number; 
  totalValue: number;
}

export interface LedgerAccount {
  account_id: string;
  accountName: string;
  type: AccountType;
  debitEntries: number[];
  creditEntries: number[];
  totalDebits: number;
  totalCredits: number;
  debits: number;
  credits: number;
  finalBalance: number;
}
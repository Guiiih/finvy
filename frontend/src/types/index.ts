// frontend/src/types/index.ts

export type AccountNature = 'debit' | 'credit';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  name: string;
  nature: AccountNature;
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
  quantity?: number; 
  user_id?: string;
}

export type EntryType = 'debit' | 'credit'; 

export interface EntryLine {
  accountId: string;
  debit?: number;
  credit?: number;
  productId?: string;
  quantity?: number;
  unit_cost?: number; 
  amount: number; 
}

export interface JournalEntry {
  id: string;
  date: string;
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
  productId: string;
  productName: string;
  quantity: number;
  unit_cost: number; 
  totalValue: number;
}

export interface LedgerAccount {
  accountId: string;
  accountName: string;
  type: AccountType;
  nature: AccountNature;
  debitEntries: number[];
  creditEntries: number[];
  totalDebits: number;
  totalCredits: number;
  debits: number;
  credits: number;
  finalBalance: number;
}
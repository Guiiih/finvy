// frontend/src/types/index.ts

// Define a natureza da conta (Ativo, Passivo, PL, Receita ou Despesa)
export type AccountNature = 'debit' | 'credit'

// Define o tipo da conta para ajudar na geração dos relatórios
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

// A estrutura de uma conta no nosso Plano de Contas
export interface Account {
  id: string;
  name: string;      // Ex: "Caixa", "Forncedores"
  nature: AccountNature;
  type: AccountType;
}

// A estrutura de um produto
export interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// A estrutura de uma linha dentro de um lançamento contábil
export type EntryType = 'debit' | 'credit';

export interface EntryLine {
  accountId: string; // ID da conta que está sendo movimentada
  type: 'debit' | 'credit';
  amount: number;
}

// O lançamento contábil que representa uma operação completa
export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: EntryLine[];
}

// Tipos para Controle de Estoque
export interface StockMovement {
  id: string;
  journalEntryId?: string; // Link para o lançamento contábil que gerou o movimento
  date: string;
  type: 'purchase' | 'sale'; // Tipo de movimento
  productId: string;
  quantity: number;
  unitCost: number; // Custo unitário da compra ou custo médio da venda
  totalValue: number;
}

export interface StockBalance {
  productId: string;
  quantity: number;
  unitCost: number; // Custo médio atual
  totalValue: number;
}

// NOVO: Interface para uma conta com saldos do razão
export interface LedgerAccount extends Account {
  debits: number;
  credits: number;
  finalBalance: number;
}
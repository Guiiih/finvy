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
  parentId?: string | null; // Adicionado como opcional, se estiver usando
}

// A estrutura de um produto
export interface Product {
  id: string;
  name: string;
  quantity: number; // Quantidade atual em estoque (se relevante para produto)
  unitPrice: number; // Preço unitário (custo de aquisição)
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
  type: 'purchase' | 'sale' | 'in' | 'out'; // Tipo de movimento
  productId: string;
  quantity: number;
  unitPrice: number; // Custo unitário do movimento
  totalValue: number; // Valor total do movimento
}

export interface StockBalance { // Foi renomeada para ProductBalance no stockControlStore
  productId: string;
  quantity: number;
  unitCost: number; // Custo médio atual
  totalValue: number;
}

export interface LedgerAccount {
  accountId: string;
  accountName: string;
  type: AccountType;
  nature: AccountNature;
  
  // Lista das entradas individuais (usado para exibir no Razão)
  debitEntries: number[];
  creditEntries: number[];
  
  // Totalizadores das entradas individuais (soma dos debitEntries/creditEntries)
  totalDebits: number;
  totalCredits: number;
  
  debits: number; // Adicionado para compatibilidade com a inicialização no accountsMap.set
  credits: number; // Adicionado para compatibilidade com a inicialização no accountsMap.set

  finalBalance: number;
}
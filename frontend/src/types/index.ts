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

// A estrutura de uma linha dentro de um lançamento contábil
export interface EntryLine {
  accountId: string; // ID da conta que está sendo movimentada
  type: 'debit' | 'credit';
  amount: number;
}

// O lançamento contábil que representa uma operação completa
export interface JournalEntry {
  id: string;
  date: Date;
  description: string; // Ex: "Venda de mercadoria conf. NF 123"
  lines: EntryLine[];  // Um lançamento sempre terá pelo menos 2 linhas (débito e crédito)
}
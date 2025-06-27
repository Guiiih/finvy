import { supabase } from './utils/supabaseClient';
import type { AccountType } from '../frontend/src/types';

interface SeedAccount {
  name: string;
  type: AccountType;
}

const seedAccounts: SeedAccount[] = [
  // Ativos
  { name: 'Caixa', type: 'asset' },
  { name: 'Banco Itaú', type: 'asset' },
  { name: 'Banco Bradesco', type: 'asset' },
  { name: 'Caixa Econômica Federal', type: 'asset' },
  { name: 'Clientes', type: 'asset' },
  { name: 'Estoque de Mercadorias', type: 'asset' },
  { name: 'Móveis e Utensílios', type: 'asset' },
  { name: 'ICMS a Recuperar', type: 'asset' },
  { name: 'ICMS Antecipado', type: 'asset' },

  // Passivos
  { name: 'Fornecedores', type: 'liability' },
  { name: 'Salários a Pagar', type: 'liability' },
  { name: 'Impostos a Pagar', type: 'liability' },
  { name: 'ICMS a Recolher', type: 'liability' },

  // Patrimônio Líquido
  { name: 'Capital Social Subscrito', type: 'equity' },
  { name: 'Capital Social a Integralizar', type: 'equity' },
  { name: 'Reserva de Lucro', type: 'equity' },

  // Receitas
  { name: 'Receita de Vendas', type: 'revenue' },

  // Despesas
  { name: 'Despesas com Salários', type: 'expense' },
  { name: 'CMV', type: 'expense' }, // Custo da Mercadoria Vendida
  { name: 'ICMS sobre Vendas', type: 'expense' },
  { name: 'ICMS sobre Compras', type: 'expense' },

  // Contas de Apuração/Resultado (podem ser tratadas como expense/revenue para simplificar)
  { name: 'Resultado Bruto', type: 'revenue' }, // Ou um tipo especial se houver
  { name: 'C/C ICMS', type: 'asset' }, // Conta de compensação para ICMS
  { name: 'Estoque Final', type: 'asset' }, // Conta para ajuste de estoque
];

async function seedDatabase() {
  console.log('Iniciando o seeding de contas...');

  // Para cada usuário existente, insere as contas padrão
  const { data: users, error: usersError } = await supabase.from('users').select('id', { schema: 'auth' });

  if (usersError) {
    console.error('Erro ao buscar usuários:', usersError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.warn('Nenhum usuário encontrado. Por favor, registre um usuário primeiro.');
    return;
  }

  for (const user of users) {
    console.log(`Processando contas para o usuário: ${user.id}`);
    const accountsToInsert = seedAccounts.map(account => ({
      ...account,
      user_id: user.id,
    }));

    const { data: existingAccounts, error: fetchError } = await supabase
      .from('accounts')
      .select('name')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error(`Erro ao buscar contas existentes para o usuário ${user.id}:`, fetchError.message);
      continue;
    }

    const existingAccountNames = new Set(existingAccounts?.map(acc => acc.name));
    const newAccountsOnly = accountsToInsert.filter(acc => !existingAccountNames.has(acc.name));

    if (newAccountsOnly.length > 0) {
      const { error: insertError } = await supabase.from('accounts').insert(newAccountsOnly);

      if (insertError) {
        console.error(`Erro ao inserir contas para o usuário ${user.id}:`, insertError.message);
      } else {
        console.log(`Contas padrão inseridas para o usuário ${user.id}.`);
      }
    } else {
      console.log(`Todas as contas padrão já existem para o usuário ${user.id}.`);
    }
  }

  console.log('Seeding de contas concluído.');
}

seedDatabase();

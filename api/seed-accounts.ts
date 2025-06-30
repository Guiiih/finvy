import { supabase } from './utils/supabaseClient';
import type { AccountType } from '../frontend/src/types';

interface SeedAccount {
  name: string;
  type: AccountType;
  code: number;
}

const seedAccounts: SeedAccount[] = [
  // Ativos
  { name: 'Caixa', type: 'asset', code: 10101 },
  { name: 'Banco Itaú', type: 'asset', code: 10102 },
  { name: 'Banco Bradesco', type: 'asset', code: 10103 },
  { name: 'Caixa Econômica Federal', type: 'asset', code: 10104 },
  { name: 'Clientes', type: 'asset', code: 10105 },
  { name: 'Estoque de Mercadorias', type: 'asset', code: 10106 },
  { name: 'Móveis e Utensílios', type: 'asset', code: 10201 },
  { name: 'ICMS a Recuperar', type: 'asset', code: 10301 },
  { name: 'ICMS Antecipado', type: 'asset', code: 10302 },

  // Passivos
  { name: 'Fornecedores', type: 'liability', code: 20101 },
  { name: 'Salários a Pagar', type: 'liability', code: 20102 },
  { name: 'Impostos a Pagar', type: 'liability', code: 20103 },
  { name: 'ICMS a Recolher', type: 'liability', code: 20104 },

  // Patrimônio Líquido
  { name: 'Capital Social Subscrito', type: 'equity', code: 30101 },
  { name: 'Capital Social a Integralizar', type: 'equity', code: 30102 },
  { name: 'Reserva de Lucro', type: 'equity', code: 30201 },

  // Receitas
  { name: 'Receita de Vendas', type: 'revenue', code: 40101 },

  // Despesas
  { name: 'Despesas com Salários', type: 'expense', code: 50101 },
  { name: 'CMV', type: 'expense', code: 50102 }, // Custo da Mercadoria Vendida
  { name: 'ICMS sobre Vendas', type: 'expense', code: 50103 },
  { name: 'ICMS sobre Compras', type: 'expense', code: 50104 },

  // Contas de Apuração/Resultado (podem ser tratadas como expense/revenue para simplificar)
  { name: 'Resultado Bruto', type: 'revenue', code: 60101 }, // Ou um tipo especial se houver
  
  { name: 'Estoque Final', type: 'asset', code: 60103 }, // Conta para ajuste de estoque
];

async function seedDatabase() {
  console.log('Iniciando o seeding de contas...');

  // Para cada usuário existente, insere as contas padrão
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

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
      .select('code')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error(`Erro ao buscar contas existentes para o usuário ${user.id}:`, fetchError.message);
      continue;
    }

    const existingAccountCodes = new Set(existingAccounts?.map(acc => acc.code));
    const newAccountsOnly = accountsToInsert.filter(acc => !existingAccountCodes.has(acc.code));

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

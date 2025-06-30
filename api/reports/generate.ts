
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from '../utils/supabaseClient';
import { handleCors } from '../utils/corsHandler';
import { AuthApiError } from '@supabase/supabase-js';
import type { Account, JournalEntry, Product, EntryLine, LedgerAccount as FrontendLedgerAccount } from '../../frontend/src/types';

// Tipos locais para evitar dependência direta de arquivos do frontend no backend
type LedgerAccount = FrontendLedgerAccount;

const getAccountByName = (accounts: Account[], name: string): Account | undefined => accounts.find(acc => acc.name === name);

export default async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) {
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return handleErrorResponse(res, 401, 'Token de autenticação não fornecido.');
  }

  let user_id: string;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw error || new Error('Usuário não encontrado.');
    }
    user_id = user.id;
  } catch (error) {
    const authError = error as AuthApiError;
    return handleErrorResponse(res, authError.status || 401, `Falha na autenticação: ${authError.message}`);
  }

  try {
    // 1. Fetch all necessary data from Supabase
    const { data: accounts, error: accountsError } = await supabase.from('accounts').select('*').eq('user_id', user_id);
    if (accountsError) throw accountsError;

    const { data: journalEntriesData, error: journalEntriesError } = await supabase.from('journal_entries').select('*, entry_lines(*)').eq('user_id', user_id);
    if (journalEntriesError) throw journalEntriesError;

    const { data: products, error: productsError } = await supabase.from('products').select('*').eq('user_id', user_id);
    if (productsError) throw productsError;

    // 2. Map Supabase data to frontend types
    const journalEntries: JournalEntry[] = journalEntriesData.map(entry => ({
      ...entry,
      entry_date: entry.entry_date,
      lines: entry.entry_lines.map((line: any) => ({
        accountId: line.account_id,
        type: line.debit > 0 ? 'debit' : 'credit',
        amount: line.debit > 0 ? line.debit : line.credit,
        productId: line.product_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        debit: line.debit,
        credit: line.credit,
      }))
    }));

    // 3. Perform Calculations (ported from frontend stores)
    
    // --- Stock Control Logic ---
    const productBalancesMap = new Map<string, { quantity: number; totalCost: number }>();
    journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
            if (line.productId && line.quantity && line.unit_cost) {
                const currentBalance = productBalancesMap.get(line.productId) || { quantity: 0, totalCost: 0 };
                if (line.debit && line.debit > 0) { // Purchase
                    currentBalance.quantity += line.quantity;
                    currentBalance.totalCost += line.quantity * line.unit_cost;
                } else if (line.credit && line.credit > 0) { // Sale
                    if (currentBalance.quantity > 0) {
                        const averageUnitCost = currentBalance.totalCost / currentBalance.quantity;
                        currentBalance.quantity -= line.quantity;
                        currentBalance.totalCost -= line.quantity * averageUnitCost;
                    }
                }
                productBalancesMap.set(line.productId, currentBalance);
            }
        });
    });
    const stockBalances = Array.from(productBalancesMap.entries()).map(([productId, data]) => ({
        productId,
        quantity: data.quantity,
        unitCost: data.quantity > 0 ? data.totalCost / data.quantity : 0,
        totalValue: data.totalCost,
    }));
    const totalEstoqueFinalValue = stockBalances.reduce((sum, pb) => sum + pb.totalValue, 0);


    // --- Ledger Calculation ---
    const accountsMap = new Map<string, LedgerAccount>();
    accounts.forEach(account => {
      accountsMap.set(account.id, {
        accountId: account.id, accountName: account.name, type: account.type,
        debitEntries: [], creditEntries: [], totalDebits: 0, totalCredits: 0,
        debits: 0, credits: 0, finalBalance: 0,
      });
    });

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const accountData = accountsMap.get(line.accountId);
        if (accountData) {
          if (line.debit) {
            accountData.debitEntries.push(line.debit);
            accountData.totalDebits += line.debit;
            accountData.debits += line.debit;
          }
          if (line.credit) {
            accountData.creditEntries.push(line.credit);
            accountData.totalCredits += line.credit;
            accountData.credits += line.credit;
          }
        }
      });
    });

    accountsMap.forEach(accountData => {
        const accountDetails = accounts.find(acc => acc.id === accountData.accountId);
        if (accountDetails) {
            const isDebitNature = ['asset', 'expense'].includes(accountDetails.type);
            accountData.finalBalance = isDebitNature ? (accountData.totalDebits - accountData.totalCredits) : (accountData.totalCredits - accountData.totalDebits);
        }
    });
    
    const ledgerAccountsList = Array.from(accountsMap.values());

    const getAccountBalance = (name: string) => ledgerAccountsList.find(acc => acc.accountName === name)?.finalBalance || 0;

    // --- DRE Calculation ---
    const receitaBrutaVendas = getAccountBalance('Receita de Vendas');
    const icmsSobreVendas = getAccountBalance('ICMS sobre Vendas');
    const cmv = getAccountBalance('CMV'); // Assuming CMV is calculated elsewhere or stored
    const receitaLiquidaVendas = receitaBrutaVendas - icmsSobreVendas;
    const lucroBruto = receitaLiquidaVendas - cmv;
    const lucroLiquido = lucroBruto; // Simplified
    const dreData = { receitaBrutaVendas, deducoesReceitaBruta: icmsSobreVendas, receitaLiquidaVendas, cmv, lucroBruto, lucroLiquido };

    // --- Balance Sheet Calculation ---
    const caixa = getAccountBalance('Caixa');
    const clientes = getAccountBalance('Clientes');
    const fornecedores = getAccountBalance('Fornecedores');
    const capitalSocial = getAccountBalance('Capital Social Subscrito') - getAccountBalance('Capital Social a Integralizar');
    const totalDoAtivo = caixa + clientes + totalEstoqueFinalValue;
    const totalDoPassivo = fornecedores;
    const totalPatrimonioLiquido = capitalSocial + lucroLiquido;
    const totalPassivoEPatrimonioLiquido = totalDoPassivo + totalPatrimonioLiquido;
    const balanceSheetData = {
        totalDoAtivo,
        totalDoPassivo,
        totalPatrimonioLiquido,
        totalPassivoEPatrimonioLiquido,
        isBalanced: Math.abs(totalDoAtivo - totalPassivoEPatrimonioLiquido) < 0.01,
        // Add more detailed fields if needed by the frontend view
    };

    // 4. Return all calculated reports
    res.status(200).json({
      ledgerAccounts: ledgerAccountsList,
      dreData,
      balanceSheetData,
      stockBalances,
      // Add other reports like DFC, Variation here if logic is ported
    });

  } catch (error: unknown) {
    console.error('Erro ao gerar relatórios:', error);
    const dbError = error as any;
    handleErrorResponse(res, dbError.status || 500, `Erro no servidor: ${dbError.message}`);
  }
};

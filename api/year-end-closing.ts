import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import { AuthApiError } from '@supabase/supabase-js';
import type { Account, JournalEntry, EntryLine } from '../../frontend/src/types';

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  }

  const { closingDate } = req.body; // Expected format: YYYY-MM-DD

  if (!closingDate) {
    return handleErrorResponse(res, 400, 'Data de fechamento é obrigatória.');
  }

  try {
    // 1. Fetch all accounts for the user
    const { data: accounts, error: accountsError } = await supabase.from('accounts').select('*').eq('user_id', user_id);
    if (accountsError) throw accountsError;

    // 2. Fetch all journal entries and their lines up to the closing date
    const { data: journalEntriesData, error: journalEntriesError } = await supabase
      .from('journal_entries')
      .select('*, entry_lines(*)')
      .eq('user_id', user_id)
      .lte('entry_date', closingDate);

    if (journalEntriesError) throw journalEntriesError;

    const journalEntries: JournalEntry[] = journalEntriesData.map(entry => ({
      ...entry,
      entry_date: entry.entry_date,
      lines: entry.entry_lines.map((line: any) => ({
        account_id: line.account_id,
        type: line.debit > 0 ? 'debit' : 'credit',
        amount: line.debit > 0 ? line.debit : line.credit,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        total_gross: line.total_gross,
        icms_value: line.icms_value,
        total_net: line.total_net,
        debit: line.debit,
        credit: line.credit,
      }))
    }));

    // Calculate balances for revenue and expense accounts
    const revenueExpenseBalances: { [accountId: string]: { debits: number; credits: number; finalBalance: number; name: string; type: string } } = {};

    accounts.forEach(account => {
      if (account.type === 'revenue' || account.type === 'expense') {
        revenueExpenseBalances[account.id] = {
          debits: 0,
          credits: 0,
          finalBalance: 0,
          name: account.name,
          type: account.type,
        };
      }
    });

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (revenueExpenseBalances[line.account_id]) {
          revenueExpenseBalances[line.account_id].debits += (line.debit || 0);
          revenueExpenseBalances[line.account_id].credits += (line.credit || 0);
        }
      });
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    for (const accountId in revenueExpenseBalances) {
      const balance = revenueExpenseBalances[accountId];
      if (balance.type === 'revenue') {
        balance.finalBalance = balance.credits - balance.debits; // Revenue has a natural credit balance
        totalRevenue += balance.finalBalance;
      } else if (balance.type === 'expense') {
        balance.finalBalance = balance.debits - balance.credits; // Expense has a natural debit balance
        totalExpense += balance.finalBalance;
      }
    }

    const netIncome = totalRevenue - totalExpense;

    // Find or create the 'Lucros/Prejuízos Acumulados' account
    let retainedEarningsAccount = accounts.find(acc => acc.name === 'Lucros/Prejuízos Acumulados' && acc.user_id === user_id);

    if (!retainedEarningsAccount) {
      const { data: newAccount, error: newAccountError } = await supabase
        .from('accounts')
        .insert({
          name: 'Lucros/Prejuízos Acumulados',
          type: 'equity',
          user_id: user_id,
          code: 9999, // A placeholder code, consider a proper code generation
        })
        .select()
        .single();

      if (newAccountError) throw newAccountError;
      retainedEarningsAccount = newAccount;
    }

    // Generate closing entries
    const closingEntries: JournalEntry[] = [];
    const closingDateFormatted = closingDate; // Already YYYY-MM-DD

    // 1. Close Revenue Accounts to DRE Summary Account
    // (Assuming a temporary DRE Summary account is used, or directly to P&L)
    // For simplicity, we'll directly close to Retained Earnings for now.
    // In a real system, you'd close to a temporary 'Income Summary' account first.

    for (const accountId in revenueExpenseBalances) {
      const balance = revenueExpenseBalances[accountId];
      if (balance.finalBalance !== 0) {
        const closingEntryLines: EntryLine[] = [
          {
            account_id: accountId,
            type: balance.type === 'revenue' ? 'debit' : 'credit', // Reverse balance
            amount: Math.abs(balance.finalBalance),
          },
          {
            account_id: retainedEarningsAccount.id,
            type: balance.type === 'revenue' ? 'credit' : 'debit', // Effect on Retained Earnings
            amount: Math.abs(balance.finalBalance),
          },
        ];

        closingEntries.push({
          id: `YE-${Date.now()}-${accountId}`,
          entry_date: closingDateFormatted,
          description: `Zeramento da conta ${balance.name} (${balance.type}) - Fechamento de Exercício`,
          lines: closingEntryLines,
          user_id: user_id,
        });
      }
    }

    // 2. Post closing entries to the database
    for (const entry of closingEntries) {
      const { lines, ...entryHeader } = entry;
      const { data: newJournalEntry, error: journalEntryError } = await supabase
        .from('journal_entries')
        .insert({ ...entryHeader, user_id: user_id })
        .select()
        .single();

      if (journalEntryError) throw journalEntryError;

      for (const line of lines) {
        const lineToSend = {
          journal_entry_id: newJournalEntry.id,
          account_id: line.account_id,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
          product_id: line.product_id || null,
          quantity: line.quantity || null,
          unit_cost: line.unit_cost || null,
          total_gross: line.total_gross || null,
          icms_value: line.icms_value || null,
          total_net: line.total_net || null,
        };
        const { error: lineError } = await supabase.from('entry_lines').insert([lineToSend]);
        if (lineError) throw lineError;
      }
    }

    res.status(200).json({ message: `Fechamento de exercício para ${closingDate} realizado com sucesso. Lucro Líquido: R$ ${netIncome.toFixed(2)}` });

  } catch (error: unknown) {
    console.error('Erro ao processar fechamento de exercício:', error);
    const dbError = error as any;
    handleErrorResponse(res, dbError.status || 500, `Erro no servidor: ${dbError.message}`);
  }
};

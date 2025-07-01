import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import { AuthApiError } from '@supabase/supabase-js';
import type { Account, JournalEntry, EntryLine, LedgerAccount as FrontendLedgerAccount } from '../frontend/src/types';

// Tipos locais para evitar dependência direta de arquivos do frontend no backend
type LedgerAccount = FrontendLedgerAccount;

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
    const { data: accounts, error: accountsError } = await supabase.from('accounts').select('*').eq('user_id', user_id);
    if (accountsError) throw accountsError;

    const { startDate, endDate } = req.query;

    let journalEntriesQuery = supabase.from('journal_entries').select('*, entry_lines(*)').eq('user_id', user_id);

    if (startDate) {
      journalEntriesQuery = journalEntriesQuery.gte('entry_date', startDate as string);
    }
    if (endDate) {
      journalEntriesQuery = journalEntriesQuery.lte('entry_date', endDate as string);
    }

    const { data: journalEntriesData, error: journalEntriesError } = await journalEntriesQuery;
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

    const accountsMap = new Map<string, LedgerAccount>();
    accounts.forEach(account => {
      accountsMap.set(account.id, {
        account_id: account.id, accountName: account.name, type: account.type,
        debitEntries: [], creditEntries: [], totalDebits: 0, totalCredits: 0,
        debits: 0, credits: 0, finalBalance: 0,
      });
    });

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const accountData = accountsMap.get(line.account_id);
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
        const accountDetails = accounts.find(acc => acc.id === accountData.account_id);
        if (accountDetails) {
            const isDebitNature = ['asset', 'expense'].includes(accountDetails.type);
            accountData.finalBalance = isDebitNature ? (accountData.totalDebits - accountData.totalCredits) : (accountData.totalCredits - accountData.totalDebits);
        }
    });
    
    const ledgerAccountsList = Array.from(accountsMap.values());

    res.status(200).json({
      ledgerAccounts: ledgerAccountsList,
    });

  } catch (error: unknown) {
    console.error('Erro ao gerar balancete:', error);
    const dbError = error as any;
    handleErrorResponse(res, dbError.status || 500, `Erro no servidor: ${dbError.message}`);
  }
};

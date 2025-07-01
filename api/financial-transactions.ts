import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import { AuthApiError } from '@supabase/supabase-js';
import type { EntryLine } from '../frontend/src/types';
import {
  idSchema,
  createFinancialTransactionSchema,
  updateFinancialTransactionSchema
} from './utils/schemas';

export default async function (req: VercelRequest, res: VercelResponse) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError?.message || 'Usuário não encontrado.');
      if (authError && authError instanceof AuthApiError) {
        return handleErrorResponse(res, 401, `Falha na autenticação: ${authError.message}`);
      }
      return handleErrorResponse(res, 401, 'Token de autenticação inválido ou expirado.');
    }
    user_id = user.id;
  } catch (error: unknown) {
    console.error('Erro ao verificar token (capturado):', error);
    let message = 'Erro interno ao verificar autenticação.';
    if (error instanceof Error) {
        message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }

  try {
    const { type } = req.query; // 'payable' or 'receivable'
    const tableName = type === 'payable' ? 'accounts_payable' : 'accounts_receivable';

    if (req.method === 'GET') {
      const { data, error: dbError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user_id);

      if (dbError) throw dbError;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const parsedBody = createFinancialTransactionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const newTransaction = { ...parsedBody.data, user_id };

      const { data: newFinancialTransaction, error: dbError } = await supabase
        .from(tableName)
        .insert([newTransaction])
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate initial journal entry
      const accountsData = await supabase.from('accounts').select('*').eq('user_id', user_id);
      if (accountsData.error) throw accountsData.error;
      const accounts = accountsData.data;

      const accountsPayableAccount = accounts.find(acc => acc.name === 'Contas a Pagar');
      const accountsReceivableAccount = accounts.find(acc => acc.name === 'Contas a Receber');

      if (!accountsPayableAccount || !accountsReceivableAccount) {
        return handleErrorResponse(res, 500, 'Contas contábeis "Contas a Pagar" ou "Contas a Receber" não encontradas.');
      }

      const journalEntryDescription = `Registro de ${type === 'payable' ? 'Conta a Pagar' : 'Conta a Receber'}: ${newTransaction.description}`;
      const journalEntryLines: EntryLine[] = [];

      if (type === 'payable') {
        // When a payable is created: Debit Expense/Asset, Credit Accounts Payable
        // For simplicity, we'll assume a generic expense account for now.
        // In a real system, this would be linked to a specific expense/asset account.
        const expenseAccount = accounts.find(acc => acc.type === 'expense'); // Find any expense account
        if (!expenseAccount) {
          return handleErrorResponse(res, 500, 'Nenhuma conta de despesa encontrada para o lançamento.');
        }
        journalEntryLines.push(
          { account_id: expenseAccount.id, type: 'debit', amount: newTransaction.amount },
          { account_id: accountsPayableAccount.id, type: 'credit', amount: newTransaction.amount }
        );
      } else {
        // When a receivable is created: Debit Accounts Receivable, Credit Revenue
        const revenueAccount = accounts.find(acc => acc.type === 'revenue'); // Find any revenue account
        if (!revenueAccount) {
          return handleErrorResponse(res, 500, 'Nenhuma conta de receita encontrada para o lançamento.');
        }
        journalEntryLines.push(
          { account_id: accountsReceivableAccount.id, type: 'debit', amount: newTransaction.amount },
          { account_id: revenueAccount.id, type: 'credit', amount: newTransaction.amount }
        );
      }

      const { data: newJournalEntry, error: journalEntryError } = await supabase
        .from('journal_entries')
        .insert({
          entry_date: newFinancialTransaction.created_at.split('T')[0], // Use creation date of the financial transaction
          description: journalEntryDescription,
          user_id: user_id,
        })
        .select()
        .single();

      if (journalEntryError) throw journalEntryError;

      for (const line of journalEntryLines) {
        const { error: lineError } = await supabase.from('entry_lines').insert({
          journal_entry_id: newJournalEntry.id,
          account_id: line.account_id,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0,
        });
        if (lineError) throw lineError;
      }

      return res.status(201).json(newFinancialTransaction);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateFinancialTransactionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      // Fetch the existing transaction to check its status
      const { data: existingTransaction, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingTransaction) {
        return handleErrorResponse(res, 404, `Transação ${type} não encontrada ou não autorizada.`);
      }

      const { data, error: dbError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id) // Ensure user owns the record
        .select()
        .single();

      if (dbError) throw dbError;
      if (!data) {
        return handleErrorResponse(res, 404, `Transação ${type} não encontrada ou não autorizada.`);
      }

      // Generate journal entry if status changed to paid/received
      if (type === 'payable' && updateData.is_paid && !existingTransaction.is_paid) {
        const accountsData = await supabase.from('accounts').select('*').eq('user_id', user_id);
        if (accountsData.error) throw accountsData.error;
        const accounts = accountsData.data;

        const accountsPayableAccount = accounts.find(acc => acc.name === 'Contas a Pagar');
        const cashAccount = accounts.find(acc => acc.name === 'Caixa'); // Assuming a Cash account

        if (!accountsPayableAccount || !cashAccount) {
          return handleErrorResponse(res, 500, 'Contas contábeis "Contas a Pagar" ou "Caixa" não encontradas.');
        }

        const journalEntryDescription = `Pagamento de Conta a Pagar: ${existingTransaction.description}`;
        const journalEntryLines: EntryLine[] = [
          { account_id: accountsPayableAccount.id, type: 'debit', amount: existingTransaction.amount },
          { account_id: cashAccount.id, type: 'credit', amount: existingTransaction.amount },
        ];

        const { data: newJournalEntry, error: journalEntryError } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: updateData.paid_date || new Date().toISOString().split('T')[0],
            description: journalEntryDescription,
            user_id: user_id,
          })
          .select()
          .single();

        if (journalEntryError) throw journalEntryError;

        for (const line of journalEntryLines) {
          const { error: lineError } = await supabase.from('entry_lines').insert({
            journal_entry_id: newJournalEntry.id,
            account_id: line.account_id,
            debit: line.type === 'debit' ? line.amount : 0,
            credit: line.type === 'credit' ? line.amount : 0,
          });
          if (lineError) throw lineError;
        }
      } else if (type === 'receivable' && updateData.is_received && !existingTransaction.is_received) {
        const accountsData = await supabase.from('accounts').select('*').eq('user_id', user_id);
        if (accountsData.error) throw accountsData.error;
        const accounts = accountsData.data;

        const accountsReceivableAccount = accounts.find(acc => acc.name === 'Contas a Receber');
        const cashAccount = accounts.find(acc => acc.name === 'Caixa'); // Assuming a Cash account

        if (!accountsReceivableAccount || !cashAccount) {
          return handleErrorResponse(res, 500, 'Contas contábeis "Contas a Receber" ou "Caixa" não encontradas.');
        }

        const journalEntryDescription = `Recebimento de Conta a Receber: ${existingTransaction.description}`;
        const journalEntryLines: EntryLine[] = [
          { account_id: cashAccount.id, type: 'debit', amount: existingTransaction.amount },
          { account_id: accountsReceivableAccount.id, type: 'credit', amount: existingTransaction.amount },
        ];

        const { data: newJournalEntry, error: journalEntryError } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: updateData.received_date || new Date().toISOString().split('T')[0],
            description: journalEntryDescription,
            user_id: user_id,
          })
          .select()
          .single();

        if (journalEntryError) throw journalEntryError;

        for (const line of journalEntryLines) {
          const { error: lineError } = await supabase.from('entry_lines').insert({
            journal_entry_id: newJournalEntry.id,
            account_id: line.account_id,
            debit: line.type === 'debit' ? line.amount : 0,
            credit: line.type === 'credit' ? line.amount : 0,
          });
          if (lineError) throw lineError;
        }
      }
      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const { error: dbError, count } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); // Ensure user owns the record

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(res, 404, `Transação ${type} não encontrada ou não autorizada para exclusão.`);
      }
      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) {
    console.error('Erro inesperado na API de transações financeiras:', error);
    let message = 'Erro interno do servidor.';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message; 
    }
    return handleErrorResponse(res, 500, message);
  }
}

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

    // --- Logic for calculating balances and generating closing entries will go here ---
    // For now, just return a success message

    res.status(200).json({ message: `Fechamento de exercício para ${closingDate} processado com sucesso (lógica de zeramento a ser implementada).` });

  } catch (error: unknown) {
    console.error('Erro ao processar fechamento de exercício:', error);
    const dbError = error as any;
    handleErrorResponse(res, dbError.status || 500, `Erro no servidor: ${dbError.message}`);
  }
};

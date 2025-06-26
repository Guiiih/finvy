import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import {
  idSchema,
  createEntryLineSchema,
  updateEntryLineSchema
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
      return handleErrorResponse(res, 401, 'Token de autenticação inválido ou expirado.');
    }
    user_id = user.id;
  } catch (error: any) {
    console.error('Erro ao verificar token:', error);
    return handleErrorResponse(res, 500, 'Erro interno ao verificar autenticação.');
  }

  try {
    if (req.method === 'GET') {
      const { journal_entry_id: query_journal_entry_id } = req.query;

      let query = supabase.from('entry_lines').select('*');

      if (query_journal_entry_id) {
        const parsedId = idSchema.safeParse({ id: query_journal_entry_id });
        if (!parsedId.success) {
          return handleErrorResponse(res, 400, `ID do lançamento diário inválido: ${parsedId.error.errors.map(err => err.message).join(', ')}`);
        }
        const { data: journalEntry, error: journalError } = await supabase
          .from('journal_entries')
          .select('id, user_id')
          .eq('id', parsedId.data.id)
          .eq('user_id', user_id)
          .single();

        if (journalError || !journalEntry) {
          console.error('Erro ao verificar lançamento diário:', journalError);
          return handleErrorResponse(res, 403, 'Você não tem permissão para acessar este lançamento diário ou ele não existe.');
        }

        query = query.eq('journal_entry_id', parsedId.data.id);
      } else {
        query = supabase
          .from('entry_lines')
          .select('*, journal_entry_id(user_id)') 
          .eq('journal_entry_id.user_id', user_id); 
      }


      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar linhas de lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      const formattedData = data.map(line => {
        const { journal_entry_id: je, ...rest } = line;
        if (typeof je === 'object' && je !== null && 'id' in je) {
          return { ...rest, journal_entry_id: (je as { id: string }).id };
        }
        return line; 
      });


      return res.status(200).json(formattedData);
    } else if (req.method === 'POST') {
      const parsedBody = createEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const { journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost } = parsedBody.data;

      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .select('id, user_id')
        .eq('id', journal_entry_id)
        .eq('user_id', user_id)
        .single();

      if (journalError || !journalEntry) {
        console.error('Erro ao verificar lançamento diário:', journalError);
        return handleErrorResponse(res, 403, 'Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.');
      }

      const { data, error } = await supabase
        .from('entry_lines')
        .insert([{ journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost }])
        .select();

      if (error) {
        console.error('Erro ao criar linha de lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(201).json(data[0]);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const { data: entryLine, error: fetchError } = await supabase
        .from('entry_lines')
        .select('journal_entry_id')
        .eq('id', id)
        .single();

      if (fetchError || !entryLine) {
        console.error('Erro ao buscar linha de lançamento para atualização:', fetchError);
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada.');
      }

      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .select('id, user_id')
        .eq('id', entryLine.journal_entry_id)
        .eq('user_id', user_id)
        .single();

      if (journalError || !journalEntry) {
        console.error('Erro ao verificar lançamento diário pai:', journalError);
        return handleErrorResponse(res, 403, 'Você não tem permissão para atualizar esta linha de lançamento.');
      }

      const { data, error } = await supabase
        .from('entry_lines')
        .update(updateData)
        .eq('id', id)
        .select(); 

      if (error) {
        console.error('Erro ao atualizar linha de lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada ou não autorizada para atualização.');
      }

      return res.status(200).json(data[0]);
    } else if (req.method === 'DELETE') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const { data: entryLine, error: fetchError } = await supabase
        .from('entry_lines')
        .select('journal_entry_id')
        .eq('id', id)
        .single();

      if (fetchError || !entryLine) {
        console.error('Erro ao buscar linha de lançamento para exclusão:', fetchError);
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada.');
      }

      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .select('id, user_id')
        .eq('id', entryLine.journal_entry_id)
        .eq('user_id', user_id)
        .single();

      if (journalError || !journalEntry) {
        console.error('Erro ao verificar lançamento diário pai:', journalError);
        return handleErrorResponse(res, 403, 'Você não tem permissão para deletar esta linha de lançamento.');
      }

      const { error, count } = await supabase
        .from('entry_lines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar linha de lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (count === 0) {
        return handleErrorResponse(res, 404, 'Linha de lançamento não encontrada ou não autorizada para exclusão.');
      }

      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Erro inesperado na API de linhas de lançamento:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import {
  idSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema
} from './utils/schemas';
import { AuthApiError } from '@supabase/supabase-js'; 

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
    if (req.method === 'GET') {
      const { data, error: dbError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user_id) 
        .order('entry_date', { ascending: false });

      if (dbError) throw dbError;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const parsedBody = createJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const { entry_date, description } = parsedBody.data;

      const { data, error: dbError } = await supabase
        .from('journal_entries')
        .insert([{ entry_date, description, user_id }])
        .select();

      if (dbError) throw dbError;
      return res.status(201).json(data[0]);
    } else if (req.method === 'PUT') {
      const id = req.query.id as string;

      const parsedBody = updateJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const { data, error: dbError } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id) 
        .select();

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Lançamento não encontrado ou você não tem permissão para atualizar.');
      }

      return res.status(200).json(data[0]);
    } else if (req.method === 'DELETE') {
      const id = req.query.id as string;

      const { error: dbError, count } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); 

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(res, 404, 'Lançamento não encontrado ou você não tem permissão para deletar.');
      }

      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) { 
    console.error('Erro inesperado na API de lançamentos:', error);
    let message = 'Erro interno do servidor.';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message; 
    }
    return handleErrorResponse(res, 500, message);
  }
}
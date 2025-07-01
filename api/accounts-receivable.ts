import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import { AuthApiError } from '@supabase/supabase-js';
import {
  idSchema,
  createAccountsReceivableSchema,
  updateAccountsReceivableSchema
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
    if (req.method === 'GET') {
      const { data, error: dbError } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('user_id', user_id);

      if (dbError) throw dbError;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const parsedBody = createAccountsReceivableSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const newAccountReceivable = { ...parsedBody.data, user_id };

      const { data, error: dbError } = await supabase
        .from('accounts_receivable')
        .insert([newAccountReceivable])
        .select()
        .single();

      if (dbError) throw dbError;
      return res.status(201).json(data);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateAccountsReceivableSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const { data, error: dbError } = await supabase
        .from('accounts_receivable')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id) // Ensure user owns the record
        .select()
        .single();

      if (dbError) throw dbError;
      if (!data) {
        return handleErrorResponse(res, 404, 'Conta a receber não encontrada ou não autorizada.');
      }
      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const { error: dbError, count } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); // Ensure user owns the record

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(res, 404, 'Conta a receber não encontrada ou não autorizada para exclusão.');
      }
      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) {
    console.error('Erro inesperado na API de contas a receber:', error);
    let message = 'Erro interno do servidor.';
    if (error instanceof Error) {
        message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }
}

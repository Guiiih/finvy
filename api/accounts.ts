import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import {
  idSchema,
  createAccountSchema,
  updateAccountSchema
} from './utils/schemas';

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
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user_id); 

      if (error) {
        console.error('Erro ao buscar contas:', error);
        return handleErrorResponse(res, 500, error.message);
      }
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const parsedBody = createAccountSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const { name, type } = parsedBody.data; 

      const { data, error } = await supabase.from('accounts').insert({ name, type, user_id }).select();
      if (error) {
        console.error('Erro ao criar conta:', error);
        return handleErrorResponse(res, 500, error.message);
      }
      return res.status(201).json(data);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateAccountSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id) 
        .select();

      if (error) {
        console.error('Erro ao atualizar conta:', error);
        return handleErrorResponse(res, 500, error.message);
      }
      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Conta não encontrada ou você não tem permissão para atualizar esta conta.');
      }
      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const { error, count } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); 

      if (error) {
        console.error('Erro ao deletar conta:', error);
        return handleErrorResponse(res, 500, error.message);
      }
      if (count === 0) {
        return handleErrorResponse(res, 404, 'Conta não encontrada ou você não tem permissão para deletar esta conta.');
      }
      return res.status(204).send('');
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Erro inesperado na API de contas:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
};
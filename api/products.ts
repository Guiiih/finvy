import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient';
import { handleCors } from './utils/corsHandler';
import {
  idSchema,
  createProductSchema,
  updateProductSchema
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user_id) 
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const parsedBody = createProductSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const { name, description, unit_cost, current_stock } = parsedBody.data; 

      const { data, error } = await supabase
        .from('products')
        .insert([{ name, description, unit_cost, current_stock, user_id }]) 
        .select();

      if (error) {
        console.error('Erro ao criar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(201).json(data[0]);
    } else if (req.method === 'PUT') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const parsedBody = updateProductSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(res, 400, parsedBody.error.errors.map(err => err.message).join(', '));
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id) 
        .select();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Produto não encontrado ou você não tem permissão para atualizar.');
      }

      return res.status(200).json(data[0]);
    } else if (req.method === 'DELETE') {
      const parsedQuery = idSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return handleErrorResponse(res, 400, parsedQuery.error.errors.map(err => err.message).join(', '));
      }
      const { id } = parsedQuery.data;

      const { error, count } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); 

      if (error) {
        console.error('Erro ao deletar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (count === 0) {
        return handleErrorResponse(res, 404, 'Produto não encontrado ou você não tem permissão para deletar.');
      }

      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Erro inesperado na API de produtos:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
}
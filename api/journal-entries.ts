import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient'; 

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://finvy.vercel.app'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { entry_date, description, user_id } = req.body;

      if (!entry_date || !description || !user_id) {
        return handleErrorResponse(res, 400, 'Campos obrigatórios faltando: entry_date, description, user_id.');
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{ entry_date, description, user_id }])
        .select();

      if (error) {
        console.error('Erro ao criar lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(201).json(data[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query; 
      const { entry_date, description, user_id } = req.body;

      if (!id) {
        return handleErrorResponse(res, 400, 'ID do lançamento é obrigatório para atualização.');
      }

      if (!entry_date && !description && !user_id) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const updateData: { [key: string]: any } = {};
      if (entry_date) updateData.entry_date = entry_date;
      if (description) updateData.description = description;
      if (user_id) updateData.user_id = user_id;

      const { data, error } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Lançamento não encontrado ou não autorizado para atualização.');
      }

      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query; 

      if (!id) {
        return handleErrorResponse(res, 400, 'ID do lançamento é obrigatório para exclusão.');
      }

      const { error, count } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (count === 0) {
        return handleErrorResponse(res, 404, 'Lançamento não encontrado ou não autorizado para exclusão.');
      }

      return res.status(204).end(); 
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Erro inesperado na API de lançamentos:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
}
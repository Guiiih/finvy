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
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name, description, unit_cost, current_stock, user_id } = req.body;

      if (!name || !unit_cost || !user_id) {
        return handleErrorResponse(res, 400, 'Campos obrigatórios faltando: name, unit_cost, user_id.');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{ name, description, unit_cost, current_stock, user_id }])
        .select();

      if (error) {
        console.error('Erro ao criar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(201).json(data[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query; 
      const { name, description, unit_cost, current_stock, user_id } = req.body;

      if (!id) {
        return handleErrorResponse(res, 400, 'ID do produto é obrigatório para atualização.');
      }

      if (!name && !description && !unit_cost && !current_stock && !user_id) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const updateData: { [key: string]: any } = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (unit_cost) updateData.unit_cost = unit_cost;
      if (current_stock) updateData.current_stock = current_stock;
      if (user_id) updateData.user_id = user_id;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (!data || data.length === 0) {
        return handleErrorResponse(res, 404, 'Produto não encontrado ou não autorizado para atualização.');
      }

      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query; 

      if (!id) {
        return handleErrorResponse(res, 400, 'ID do produto é obrigatório para exclusão.');
      }

      const { error, count } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar produto:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      if (count === 0) {
        return handleErrorResponse(res, 404, 'Produto não encontrado ou não autorizado para exclusão.');
      }

      return res.status(204).end(); 
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Erro inesperado na API de produtos:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
}
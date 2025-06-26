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
      const { journal_entry_id } = req.query;
      let query = supabase.from('entry_lines').select('*');

      if (journal_entry_id) {
        query = query.eq('journal_entry_id', journal_entry_id);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar linhas de lançamento:', error);
        return handleErrorResponse(res, 500, error.message);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost } = req.body;

      if (!journal_entry_id || !account_id || (debit === undefined && credit === undefined)) {
        return handleErrorResponse(res, 400, 'Campos obrigatórios faltando: journal_entry_id, account_id, e pelo menos debit ou credit.');
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
    }

    if (req.method === 'PUT') {
      const { id } = req.query; 
      const { account_id, debit, credit, product_id, quantity, unit_cost } = req.body;

      if (!id) {
        return handleErrorResponse(res, 400, 'ID da linha de lançamento é obrigatório para atualização.');
      }

      if (!account_id && debit === undefined && credit === undefined && product_id === undefined && quantity === undefined && unit_cost === undefined) {
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.');
      }

      const updateData: { [key: string]: any } = {};
      if (account_id) updateData.account_id = account_id;
      if (debit !== undefined) updateData.debit = debit;
      if (credit !== undefined) updateData.credit = credit;
      if (product_id !== undefined) updateData.product_id = product_id;
      if (quantity !== undefined) updateData.quantity = quantity;
      if (unit_cost !== undefined) updateData.unit_cost = unit_cost;

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
    }

    if (req.method === 'DELETE') {
      const { id } = req.query; 

      if (!id) {
        return handleErrorResponse(res, 400, 'ID da linha de lançamento é obrigatório para exclusão.');
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
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Erro inesperado na API de linhas de lançamento:', error);
    return handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
  }
}
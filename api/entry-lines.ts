import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) não configuradas.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lógica para requisições GET: Listar linhas de lançamento (opcionalmente por journal_entry_id)
  if (req.method === 'GET') {
    try {
      const { journal_entry_id } = req.query;
      let query = supabase.from('entry_lines').select('*');

      if (journal_entry_id) {
        query = query.eq('journal_entry_id', journal_entry_id);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar linhas de lançamento:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);

    } catch (error: any) {
      console.error('Erro inesperado ao buscar linhas de lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições POST: Criar uma nova linha de lançamento
  if (req.method === 'POST') {
    try {
      const { journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost } = req.body;

      if (!journal_entry_id || !account_id || (debit === undefined && credit === undefined)) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: journal_entry_id, account_id, e pelo menos debit ou credit.' });
      }

      const { data, error } = await supabase
        .from('entry_lines')
        .insert([{ journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost }])
        .select();

      if (error) {
        console.error('Erro ao criar linha de lançamento:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao criar linha de lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições PUT: Atualizar uma linha de lançamento existente
  if (req.method === 'PUT') {
    try {
      const { id } = req.query; // ID da linha de lançamento a ser atualizada
      const { account_id, debit, credit, product_id, quantity, unit_cost } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da linha de lançamento é obrigatório para atualização.' });
      }

      if (!account_id && debit === undefined && credit === undefined && product_id === undefined && quantity === undefined && unit_cost === undefined) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
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
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Linha de lançamento não encontrada ou não autorizada para atualização.' });
      }

      return res.status(200).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao atualizar linha de lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições DELETE: Remover uma linha de lançamento
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query; // ID da linha de lançamento a ser deletada

      if (!id) {
        return res.status(400).json({ error: 'ID da linha de lançamento é obrigatório para exclusão.' });
      }

      const { error, count } = await supabase
        .from('entry_lines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar linha de lançamento:', error);
        return res.status(500).json({ error: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: 'Linha de lançamento não encontrada ou não autorizada para exclusão.' });
      }

      return res.status(204).end(); // No Content

    } catch (error: any) {
      console.error('Erro inesperado ao deletar linha de lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Se o método HTTP não for suportado
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) não configuradas.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Em produção, substitua '*' pelo domínio do seu frontend
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lógica para requisições GET: Listar lançamentos
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);

    } catch (error: any) {
      console.error('Erro inesperado ao buscar lançamentos:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições POST: Criar um novo lançamento
  if (req.method === 'POST') {
    try {
      const { entry_date, description, user_id } = req.body;

      if (!entry_date || !description || !user_id) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: entry_date, description, user_id.' });
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{ entry_date, description, user_id }])
        .select();

      if (error) {
        console.error('Erro ao criar lançamento:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao criar lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições PUT: Atualizar um lançamento existente
  if (req.method === 'PUT') {
    try {
      const { id } = req.query; // ID do lançamento a ser atualizado
      const { entry_date, description, user_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do lançamento é obrigatório para atualização.' });
      }

      if (!entry_date && !description && !user_id) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
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
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Lançamento não encontrado ou não autorizado para atualização.' });
      }

      return res.status(200).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao atualizar lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições DELETE: Remover um lançamento
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query; // ID do lançamento a ser deletado

      if (!id) {
        return res.status(400).json({ error: 'ID do lançamento é obrigatório para exclusão.' });
      }

      const { error, count } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lançamento:', error);
        return res.status(500).json({ error: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: 'Lançamento não encontrado ou não autorizado para exclusão.' });
      }

      return res.status(204).end(); // No Content

    } catch (error: any) {
      console.error('Erro inesperado ao deletar lançamento:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Se o método HTTP não for suportado
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

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

  // Lógica para requisições GET: Listar contas
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.error('Erro ao buscar contas:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);

    } catch (error: any) {
      console.error('Erro inesperado ao buscar contas:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições POST: Criar uma nova conta
  if (req.method === 'POST') {
    try {
      const { code, name, type, nature, user_id } = req.body;

      if (!code || !name || !type || !nature || !user_id) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: code, name, type, nature, user_id.' });
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([{ code, name, type, nature, user_id }])
        .select();

      if (error) {
        console.error('Erro ao criar conta:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao criar conta:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições PUT: Atualizar uma conta existente
  if (req.method === 'PUT') {
    try {
      const { id } = req.query; // ID da conta a ser atualizada
      const { code, name, type, nature, user_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da conta é obrigatório para atualização.' });
      }

      if (!code && !name && !type && !nature && !user_id) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
      }

      const updateData: { [key: string]: any } = {};
      if (code) updateData.code = code;
      if (name) updateData.name = name;
      if (type) updateData.type = type;
      if (nature) updateData.nature = nature;
      if (user_id) updateData.user_id = user_id;

      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar conta:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Conta não encontrada ou não autorizada para atualização.' });
      }

      return res.status(200).json(data[0]);

    } catch (error: any) {
      console.error('Erro inesperado ao atualizar conta:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Lógica para requisições DELETE: Remover uma conta
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query; // ID da conta a ser deletada

      if (!id) {
        return res.status(400).json({ error: 'ID da conta é obrigatório para exclusão.' });
      }

      const { error, count } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar conta:', error);
        return res.status(500).json({ error: error.message });
      }

      if (count === 0) {
        return res.status(404).json({ error: 'Conta não encontrada ou não autorizada para exclusão.' });
      }

      return res.status(204).end(); // No Content

    } catch (error: any) {
      console.error('Erro inesperado ao deletar conta:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  // Se o método HTTP não for suportado
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

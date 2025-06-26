import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleErrorResponse } from './utils/supabaseClient'; 

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const { name, type, user_id } = req.body;
      if (!name || !type || !user_id) {
        return handleErrorResponse(res, 400, 'Nome, tipo e user_id são obrigatórios.');
      }
      const { data, error } = await supabase.from('accounts').insert({ name, type, user_id }).select();
      if (error) throw error;
      return res.status(201).json(data);
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, type } = req.body;
      if (!id) {
        return handleErrorResponse(res, 400, 'ID da conta é obrigatório.');
      }
      if (!name || !type) {
        return handleErrorResponse(res, 400, 'Nome e tipo da conta são obrigatórios.');
      }
      const { data, error } = await supabase.from('accounts').update({ name, type }).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return handleErrorResponse(res, 400, 'ID da conta é obrigatório.');
      }
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).send(''); 
    } else {
      return handleErrorResponse(res, 405, 'Método não permitido');
    }
  } catch (error: any) {
    console.error('Erro na API de contas:', error.message);
    return handleErrorResponse(res, 500, 'Erro interno do servidor: ' + error.message);
  }
};
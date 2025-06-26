import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não definidas.');
  throw new Error('Variáveis de ambiente do Supabase não configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleErrorResponse = (res: VercelResponse, statusCode: number, message: string) => {
  res.status(statusCode).json({ error: message });
};
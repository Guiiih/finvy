import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error(
    "Erro: Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) não definidas.",
  );
  throw new Error("Variáveis de ambiente do Supabase não configuradas.");
}

// Cliente Supabase para operações que não exigem autenticação de usuário (ex: auth.getUser no middleware)
export const anonSupabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Cliente Supabase com Service Role Key (ignora RLS - usar com cautela no backend)
export const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

// Função para obter um cliente Supabase autenticado com o JWT do usuário (para RLS)
export function getSupabaseClient(token: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

export const handleErrorResponse = (
  res: VercelResponse,
  statusCode: number,
  message: string,
) => {
  res.status(statusCode).json({ error: message });
};

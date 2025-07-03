import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VercelRequest, VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não definidas.",
  );
  throw new Error("Variáveis de ambiente do Supabase não configuradas.");
}

// Cliente Supabase para operações que não exigem autenticação de usuário (ex: auth.getUser no middleware)
export const anonSupabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Função para obter um cliente Supabase autenticado com o JWT do usuário
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

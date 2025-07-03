import { createClient } from "@supabase/supabase-js";
import { VercelRequest, VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.",
  );
  throw new Error("Variáveis de ambiente do Supabase não configuradas.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const handleErrorResponse = (
  res: VercelResponse,
  statusCode: number,
  message: string,
) => {
  res.status(statusCode).json({ error: message });
};

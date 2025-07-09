import { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    // Check for Supabase PostgrestError specific properties
    const supabaseError = error as PostgrestError;
    if (supabaseError.code && supabaseError.message) {
      // Common Supabase error codes
      switch (supabaseError.code) {
        case "23505": // unique_violation
          return `Erro de duplicidade: ${supabaseError.details || supabaseError.message}. Este item já existe.`;
        case "23503": // foreign_key_violation
          return `Erro de referência: ${supabaseError.details || supabaseError.message}. Verifique se os IDs relacionados (e.g., conta, produto) são válidos.`;
        case "22P02": // invalid_text_representation
          return `Erro de formato de dados: ${supabaseError.details || supabaseError.message}. Verifique se os valores estão no formato correto (e.g., UUIDs, números).`;
        // Add more cases as needed for specific error codes
        default:
          return `Erro no banco de dados (${supabaseError.code}): ${supabaseError.message}.`;
      }
    }
    return error.message;
  }
  return "Erro interno do servidor.";
}

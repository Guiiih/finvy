import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from "../utils/schemas.js";

const journalEntriesCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

function getCachedJournalEntries(userId: string) {
  const cached = journalEntriesCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedJournalEntries(userId: string, data: unknown) {
  journalEntriesCache.set(userId, { data, timestamp: Date.now() });
}

function invalidateJournalEntriesCache(userId: string) {
  journalEntriesCache.delete(userId);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string,
) {
  const userSupabase = getSupabaseClient(token);
  console.log(`Journal Entries Handler: Recebendo requisição ${req.method} para ${req.url}`);
  try {
    if (req.method === "GET") {
      const cachedData = getCachedJournalEntries(user_id);
      if (cachedData) {
        console.log("Journal Entries Handler: Retornando lançamentos do cache para user_id:", user_id);
        return res.status(200).json(cachedData);
      }

      const { data, error: dbError } = await userSupabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false });

      if (dbError) throw dbError;
      setCachedJournalEntries(user_id, data);
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      console.log("Journal Entries Handler: Processando POST para criar lançamento.");
      const parsedBody = createJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
        console.error("Journal Entries Handler: Erro de validação no POST:", parsedBody.error.errors);
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { entry_date, description } = parsedBody.data;

      const { data, error: dbError } = await userSupabase
        .from("journal_entries")
        .insert([{ entry_date, description, user_id }])
        .select();

      if (dbError) throw dbError;
      invalidateJournalEntriesCache(user_id);
      console.log("Journal Entries Handler: Lançamento criado com sucesso.");
      return res.status(201).json(data[0]);
    }

    if (req.method === "PUT") {
      const id = req.query.id as string;
      console.log(`Journal Entries Handler: Processando PUT para atualizar lançamento ${id}.`);
      const parsedBody = updateJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
        console.error("Journal Entries Handler: Erro de validação no PUT:", parsedBody.error.errors);
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
        console.warn("Journal Entries Handler: Nenhuma campo para atualizar fornecido no PUT.");
        return handleErrorResponse(
          res,
          400,
          "Nenhum campo para atualizar fornecido.",
        );
      }

      const { data, error: dbError } = await userSupabase
        .from("journal_entries")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user_id)
        .select();

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        console.warn(`Journal Entries Handler: Lançamento ${id} não encontrado ou sem permissão para atualizar.`);
        return handleErrorResponse(
          res,
          404,
          "Lançamento não encontrado ou você não tem permissão para atualizar.",
        );
      }
      invalidateJournalEntriesCache(user_id);
      console.log(`Journal Entries Handler: Lançamento ${id} atualizado com sucesso.`);
      return res.status(200).json(data[0]);
    }

    if (req.method === "DELETE") {
      const id = req.url?.split('?')[0].split('/').pop() as string;
      console.log(`Journal Entries Handler: Processando DELETE para lançamento ${id}.`);

      // First, delete all associated entry_lines
      console.log(`Journal Entries Handler: Deletando linhas de lançamento para ${id}.`);
      const { error: deleteLinesError } = await userSupabase
        .from("entry_lines")
        .delete()
        .eq("journal_entry_id", id);

      if (deleteLinesError) {
        console.error(`Journal Entries Handler: Erro ao deletar linhas de lançamento para ${id}:`, deleteLinesError);
        throw deleteLinesError;
      }
      console.log(`Journal Entries Handler: Linhas de lançamento para ${id} deletadas com sucesso.`);

      // Then, delete the journal_entry itself
      console.log(`Journal Entries Handler: Deletando lançamento principal ${id}.`);
      const { error: dbError, count } = await userSupabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);

      if (dbError) {
        console.error(`Journal Entries Handler: Erro ao deletar lançamento principal ${id}:`, dbError);
        throw dbError;
      }
      if (count === 0) {
        console.warn(`Journal Entries Handler: Lançamento ${id} não encontrado ou sem permissão para deletar.`);
        return handleErrorResponse(
          res,
          404,
          "Lançamento não encontrado ou você não tem permissão para deletar.",
        );
      }
      invalidateJournalEntriesCache(user_id);
      console.log(`Journal Entries Handler: Lançamento ${id} deletado com sucesso.`);
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    console.warn(`Journal Entries Handler: Método ${req.method} não permitido.`);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Journal Entries Handler: Erro inesperado na API de lançamentos:", error);
    let message = "Erro interno do servidor.";
    if (error instanceof Error) {
      message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }
}
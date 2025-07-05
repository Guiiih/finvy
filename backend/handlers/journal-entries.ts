import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from "../utils/schemas.js";

// Cache em memória para os lançamentos contábeis
const journalEntriesCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos de cache

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
  user_role: string, // NOVO: Adicionado o nível de permissão do usuário
) {
  const userSupabase = getSupabaseClient(token);
  try {
    if (req.method === "GET") {
      const cachedData = getCachedJournalEntries(user_id);
      if (cachedData) {
        console.log("Journal Entries Handler: Retornando lançamentos do cache para user_id:", user_id);
        return res.status(200).json(cachedData);
      }

      const { data, error: dbError } = await userSupabase // Usando o cliente com token do usuário
        .from("journal_entries")
        .select("*")
        .eq("user_id", user_id) // Adicionado filtro por user_id
        .order("entry_date", { ascending: false });

      if (dbError) throw dbError;
      setCachedJournalEntries(user_id, data); // Armazena no cache
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const parsedBody = createJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
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
      invalidateJournalEntriesCache(user_id); // Invalida o cache após adicionar
      return res.status(201).json(data[0]);
    }

    if (req.method === "PUT") {
      const id = req.query.id as string;
      const parsedBody = updateJournalEntrySchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const updateData = parsedBody.data;

      if (Object.keys(updateData).length === 0) {
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
        return handleErrorResponse(
          res,
          404,
          "Lançamento não encontrado ou você não tem permissão para atualizar.",
        );
      }
      invalidateJournalEntriesCache(user_id); // Invalida o cache após atualizar
      return res.status(200).json(data[0]);
    }

    if (req.method === "DELETE") {
      const id = req.query.id as string;
      const { error: dbError, count } = await userSupabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(
          res,
          404,
          "Lançamento não encontrado ou você não tem permissão para deletar.",
        );
      }
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Erro inesperado na API de lançamentos:", error);
    let message = "Erro interno do servidor.";
    if (error instanceof Error) {
      message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }
}

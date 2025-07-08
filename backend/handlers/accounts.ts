import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse } from "../utils/supabaseClient.js";
import { z } from "zod";
import { createAccountSchema, updateAccountSchema, uuidSchema } from "../utils/schemas.js";

// Cache em memória para as contas
const accountsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; 

function getCachedAccounts(userId: string) {
  const cached = accountsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedAccounts(userId: string, data: unknown) {
  accountsCache.set(userId, { data, timestamp: Date.now() });
}

function invalidateAccountsCache(userId: string) {
  accountsCache.delete(userId);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string,
) {
  console.log("Accounts Handler: user_id recebido:", user_id);
  const userSupabase = getSupabaseClient(token);
  try {
    if (req.method === "GET") {
      const cachedData = getCachedAccounts(user_id);
      if (cachedData) {
        console.log("Accounts Handler: Retornando contas do cache para user_id:", user_id);
        return res.status(200).json(cachedData);
      }

      const { data, error: dbError } = await userSupabase 
        .from("accounts")
        .select("*")
        .eq("user_id", user_id) 
        .order("name", { ascending: true });

      if (dbError) throw dbError;
      setCachedAccounts(user_id, data); 
      return res.status(200).json(data);
    } else if (req.method === "POST") {
      const parsedBody = createAccountSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { name, type } = parsedBody.data;

      const { data, error: dbError } = await userSupabase 
        .from("accounts")
        .insert({ name, type, user_id })
        .select();
      if (dbError) throw dbError;
      invalidateAccountsCache(user_id); 
      return res.status(201).json(data[0]);
    } else if (req.method === "PUT") {
      const id = req.query.id as string;
      const parsedBody = updateAccountSchema.safeParse(req.body);
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
        .from("accounts")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user_id)
        .select();
      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        return handleErrorResponse(
          res,
          404,
          "Conta não encontrada ou você não tem permissão para atualizar esta conta.",
        );
      }
      invalidateAccountsCache(user_id); 
      return res.status(200).json(data[0]);
    } else if (req.method === "DELETE") {
      const pathSegments = (req.query.path as string).split('/');
      const id = pathSegments[pathSegments.length - 1];
      const parsedId = uuidSchema.safeParse(id);
      if (!parsedId.success) {
        return handleErrorResponse(
          res,
          400,
          parsedId.error.errors.map((err: z.ZodIssue) => err.message).join(", "),
        );
      }
      const { error: dbError, count } = await userSupabase 
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(
          res,
          404,
          "Conta não encontrada ou você não tem permissão para deletar esta conta.",
        );
      }
      invalidateAccountsCache(user_id); 
      return res.status(204).send("");
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) {
    console.error("Erro inesperado na API de contas:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}
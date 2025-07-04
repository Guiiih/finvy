import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse } from "../utils/supabaseClient.js";
import { z } from "zod";
import { createAccountSchema, updateAccountSchema, uuidSchema } from "../utils/schemas.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string, // NOVO: Adicionado o nível de permissão do usuário
) {
  console.log("Accounts Handler: user_id recebido:", user_id);
  const userSupabase = getSupabaseClient(token);
  try {
    if (req.method === "GET") {
      const { data, error: dbError } = await userSupabase // Usando o cliente com token do usuário
        .from("accounts")
        .select("*")
        .eq("user_id", user_id);
      if (dbError) {
        console.error("Erro do Supabase ao buscar contas:", dbError);
        throw dbError;
      }
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const parsedBody = createAccountSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { name, type } = parsedBody.data;

      const { data, error: dbError } = await userSupabase // Usando o cliente com token do usuário
        .from("accounts")
        .insert({ name, type, user_id })
        .select();
      if (dbError) throw dbError;
      return res.status(201).json(data[0]);
    }

    if (req.method === "PUT") {
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

      const { data, error: dbError } = await userSupabase // Usando o cliente com token do usuário
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
      return res.status(200).json(data[0]);
    }

    if (req.method === "DELETE") {
      // Apenas administradores podem deletar contas
      if (user_role !== 'admin') {
        return handleErrorResponse(res, 403, "Acesso negado. Apenas administradores podem deletar contas.");
      }

      const id = req.query.id as string;
      const parsedId = uuidSchema.safeParse(id);
      if (!parsedId.success) {
        return handleErrorResponse(
          res,
          400,
          parsedId.error.errors.map((err: z.ZodIssue) => err.message).join(", "),
        );
      }
      const { error: dbError, count } = await userSupabase // Usando o cliente com token do usuário
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
      return res.status(204).send("");
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Erro inesperado na API de contas:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}

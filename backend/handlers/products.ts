import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";
import { createProductSchema, updateProductSchema } from "../utils/schemas.js";

// Cache em memória para os produtos
const productsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos de cache

function getCachedProducts(userId: string) {
  const cached = productsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedProducts(userId: string, data: any) {
  productsCache.set(userId, { data, timestamp: Date.now() });
}

function invalidateProductsCache(userId: string) {
  productsCache.delete(userId);
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
      const cachedData = getCachedProducts(user_id);
      if (cachedData) {
        console.log("Products Handler: Retornando produtos do cache para user_id:", user_id);
        return res.status(200).json(cachedData);
      }

      const { data, error: dbError } = await userSupabase // Usando o cliente com token do usuário
        .from("products")
        .select("*")
        .eq("user_id", user_id) // Adicionado filtro por user_id
        .order("name", { ascending: true });

      if (dbError) throw dbError;
      setCachedProducts(user_id, data); // Armazena no cache
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const parsedBody = createProductSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { name, description, unit_cost, current_stock } = parsedBody.data;

      const { data, error: dbError } = await userSupabase
        .from("products")
        .insert([{ name, description, unit_cost, current_stock, user_id }])
        .select();

      if (dbError) throw dbError;
      invalidateProductsCache(user_id); // Invalida o cache após adicionar
      return res.status(201).json(data[0]);
    }

    if (req.method === "PUT") {
      const id = req.query.id as string;
      const parsedBody = updateProductSchema.safeParse(req.body);
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
        .from("products")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user_id)
        .select();

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        return handleErrorResponse(
          res,
          404,
          "Produto não encontrado ou você não tem permissão para atualizar.",
        );
      }
      invalidateProductsCache(user_id); // Invalida o cache após atualizar
      return res.status(200).json(data[0]);

    if (req.method === "DELETE") {
      // Apenas administradores podem deletar produtos
      if (user_role !== 'admin') {
        return handleErrorResponse(res, 403, "Acesso negado. Apenas administradores podem deletar produtos.");
      }

      const id = req.query.id as string;
      const { error: dbError, count } = await userSupabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(
          res,
          404,
          "Produto não encontrado ou você não tem permissão para deletar.",
        );
      }
      invalidateProductsCache(user_id); // Invalida o cache após deletar
      return res.status(204).end();

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Erro inesperado na API de produtos:", error);
    let message = "Erro interno do servidor.";
    if (error instanceof Error) {
      message = error.message;
    }
    return handleErrorResponse(res, 500, message);
  }
}

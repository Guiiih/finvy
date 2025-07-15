import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { createProductSchema, updateProductSchema } from "../utils/schemas.js";
import { formatSupabaseError } from "../utils/errorUtils.js";

const productsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

function getCacheKey(organizationId: string, accountingPeriodId: string): string {
  return `${organizationId}-${accountingPeriodId}`;
}

function getCachedProducts(organizationId: string, accountingPeriodId: string) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  const cached = productsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedProducts(organizationId: string, accountingPeriodId: string, data: unknown) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  productsCache.set(key, { data, timestamp: Date.now() });
}

function invalidateProductsCache(organizationId: string, accountingPeriodId: string) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  productsCache.delete(key);
}

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retorna todos os produtos do usuário autenticado.
 *     description: Retorna uma lista de todos os produtos associados ao usuário autenticado. Os dados são cacheados por 5 minutos.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Uma lista de produtos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: O ID único do produto.
 *                   name:
 *                     type: string
 *                     description: O nome do produto.
 *                   description:
 *                     type: string
 *                     description: A descrição do produto (opcional).
 *                   unit_cost:
 *                     type: number
 *                     format: float
 *                     description: O custo unitário do produto.
 *                   current_stock:
 *                     type: number
 *                     format: integer
 *                     description: O estoque atual do produto.
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                     description: O ID do usuário ao qual o produto pertence.
 *       401:
 *         description: Não autorizado. Token de autenticação ausente ou inválido.
 *       500:
 *         description: Erro interno do servidor.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);

  const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token);
  if (!userOrgAndPeriod) {
    return handleErrorResponse(
      res,
      403,
      "Organização ou período contábil não encontrado para o usuário.",
    );
  }
  const { organization_id, active_accounting_period_id } = userOrgAndPeriod;

  try {
    if (req.method === "GET") {
      const cachedData = getCachedProducts(organization_id, active_accounting_period_id);
      if (cachedData) {
        logger.info(
          "Products Handler: Retornando produtos do cache para organization_id:",
          organization_id,
        );
        return res.status(200).json(cachedData);
      }

      const { data, error: dbError } = await userSupabase
        .from("products")
        .select(
          "id, name, description, unit_cost, current_stock, organization_id, accounting_period_id",
        )
        .eq("organization_id", organization_id)
        .eq("accounting_period_id", active_accounting_period_id)
        .order("name", { ascending: true });

      if (dbError) throw dbError;
      setCachedProducts(organization_id, active_accounting_period_id, data);
      return res.status(200).json(data);
    }

    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Cria um novo produto.
     *     description: Cria um novo produto para o usuário autenticado.
     *     tags:
     *       - Products
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - unit_cost
     *               - current_stock
     *             properties:
     *               name:
     *                 type: string
     *                 description: O nome do novo produto.
     *               description:
     *                 type: string
     *                 description: A descrição do produto (opcional).
     *               unit_cost:
     *                 type: number
     *                 format: float
     *                 description: O custo unitário do produto.
     *               current_stock:
     *                 type: number
     *                 format: integer
     *                 description: O estoque inicial do produto.
     *     responses:
     *       201:
     *         description: Produto criado com sucesso.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID único do produto criado.
     *                 name:
     *                   type: string
     *                   description: O nome do produto criado.
     *                 description:
     *                   type: string
     *                   description: A descrição do produto criado.
     *                 unit_cost:
     *                   type: number
     *                   format: float
     *                   description: O custo unitário do produto criado.
     *                 current_stock:
     *                   type: number
     *                   format: integer
     *                   description: O estoque atual do produto criado.
     *                 user_id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID do usuário ao qual o produto pertence.
     *       400:
     *         description: Requisição inválida. Dados fornecidos são inválidos.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       500:
     *         description: Erro interno do servidor.
     */
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
        .insert([
          {
            name,
            description,
            unit_cost,
            current_stock,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          },
        ])
        .select();

      if (dbError) throw dbError;
      invalidateProductsCache(organization_id, active_accounting_period_id);
      return res.status(201).json(data[0]);
    }

    /**
     * @swagger
     * /products/{id}:
     *   put:
     *     summary: Atualiza um produto existente.
     *     description: Atualiza os detalhes de um produto específico pelo seu ID.
     *     tags:
     *       - Products
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: O ID do produto a ser atualizado.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: O novo nome do produto.
     *               description:
     *                 type: string
     *                 description: A nova descrição do produto.
     *               unit_cost:
     *                 type: number
     *                 format: float
     *                 description: O novo custo unitário do produto.
     *               current_stock:
     *                 type: number
     *                 format: integer
     *                 description: O novo estoque atual do produto.
     *     responses:
     *       200:
     *         description: Produto atualizado com sucesso.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID único do produto atualizado.
     *                 name:
     *                   type: string
     *                   description: O nome do produto atualizado.
     *                 description:
     *                   type: string
     *                   description: A descrição do produto atualizado.
     *                 unit_cost:
     *                   type: number
     *                   format: float
     *                   description: O custo unitário do produto atualizado.
     *                 current_stock:
     *                   type: number
     *                   format: integer
     *                   description: O estoque atual do produto atualizado.
     *                 user_id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID do usuário ao qual o produto pertence.
     *       400:
     *         description: Requisição inválida. Dados fornecidos são inválidos ou nenhum campo para atualizar foi fornecido.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       404:
     *         description: Produto não encontrado ou você não tem permissão para atualizar este produto.
     *       500:
     *         description: Erro interno do servidor.
     */
    if (req.method === "PUT") {
      const id = req.url?.split("?")[0].split("/").pop() as string;
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
        .eq("organization_id", organization_id)
        .eq("accounting_period_id", active_accounting_period_id)
        .select();

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        return handleErrorResponse(
          res,
          404,
          "Produto não encontrado ou você não tem permissão para atualizar.",
        );
      }
      invalidateProductsCache(organization_id, active_accounting_period_id);
      return res.status(200).json(data[0]);
    }

    /**
     * @swagger
     * /products/{id}:
     *   delete:
     *     summary: Deleta um produto.
     *     description: Deleta um produto específico pelo seu ID.
     *     tags:
     *       - Products
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: O ID do produto a ser deletado.
     *     responses:
     *       204:
     *         description: Produto deletado com sucesso. Nenhuma resposta de conteúdo.
     *       400:
     *         description: Requisição inválida. ID do produto fornecido é inválido.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       404:
     *         description: Produto não encontrado ou você não tem permissão para deletar este produto.
     *       500:
     *         description: Erro interno do servidor.
     */
    if (req.method === "DELETE") {
      const id = req.url?.split("?")[0].split("/").pop() as string;
      const { error: dbError, count } = await userSupabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization_id)
        .eq("accounting_period_id", active_accounting_period_id);

      if (dbError) throw dbError;
      if (count === 0) {
        return handleErrorResponse(
          res,
          404,
          "Produto não encontrado ou você não tem permissão para deletar.",
        );
      }
      invalidateProductsCache(organization_id, active_accounting_period_id);
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de produtos:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}

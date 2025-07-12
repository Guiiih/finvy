import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import {
  createAccountSchema,
  updateAccountSchema,
  uuidSchema,
} from "../utils/schemas.js";
import { formatSupabaseError } from "../utils/errorUtils.js";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../services/accountService.js";

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Retorna todas as contas do usuário autenticado.
 *     description: Retorna uma lista de todas as contas financeiras associadas ao usuário autenticado. Os dados são cacheados por 5 minutos.
 *     tags:
 *       - Accounts
 *     responses:
 *       200:
 *         description: Uma lista de contas.
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
 *                     description: O ID único da conta.
 *                   name:
 *                     type: string
 *                     description: O nome da conta.
 *                   type:
 *                     type: string
 *                     description: O tipo da conta (e.g., 'Asset', 'Liability').
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                     description: O ID do usuário ao qual a conta pertence.
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
  logger.info("Accounts Handler: user_id recebido:", user_id);
  

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
      const data = await getAccounts(user_id, organization_id, active_accounting_period_id, token);
      return res.status(200).json(data);
    } else if (req.method === "POST") {
      /**
       * @swagger
       * /accounts:
       *   post:
       *     summary: Cria uma nova conta.
       *     description: Cria uma nova conta financeira para o usuário autenticado.
       *     tags:
       *       - Accounts
       *     requestBody:
       *       required: true
       *       content:
       *         application/json:
       *           schema:
       *             type: object
       *             required:
       *               - name
       *               - type
       *             properties:
       *               name:
       *                 type: string
       *                 description: O nome da nova conta.
       *               type:
       *                 type: string
       *                 description: O tipo da nova conta (e.g., 'Asset', 'Liability').
       *     responses:
       *       201:
       *         description: Conta criada com sucesso.
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 id:
       *                   type: string
       *                   format: uuid
       *                   description: O ID único da conta criada.
       *                 name:
       *                   type: string
       *                   description: O nome da conta criada.
       *                 type:
       *                   type: string
       *                   description: O tipo da conta criada.
       *                 user_id:
       *                   type: string
       *                   format: uuid
       *                   description: O ID do usuário ao qual a conta pertence.
       *       400:
       *         description: Requisição inválida. Dados fornecidos são inválidos.
       *       401:
       *         description: Não autorizado. Token de autenticação ausente ou inválido.
       *       500:
       *         description: Erro interno do servidor.
       */
      const parsedBody = createAccountSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { name, type, parent_account_id } = parsedBody.data;

      const newAccount = { name, type, parent_account_id };
      const createdAccount = await createAccount(newAccount, user_id, organization_id, active_accounting_period_id, token);
      return res.status(201).json(createdAccount);
    } else if (req.method === "PUT") {
      /**
       * @swagger
       * /accounts/{id}:
       *   put:
       *     summary: Atualiza uma conta existente.
       *     description: Atualiza os detalhes de uma conta financeira específica pelo seu ID.
       *     tags:
       *       - Accounts
       *     parameters:
       *       - in: path
       *         name: id
       *         schema:
       *           type: string
       *           format: uuid
       *         required: true
       *         description: O ID da conta a ser atualizada.
       *     requestBody:
       *       required: true
       *       content:
       *         application/json:
       *           schema:
       *             type: object
       *             properties:
       *               name:
       *                 type: string
       *                 description: O novo nome da conta.
       *               type:
       *                 type: string
       *                 description: O novo tipo da conta.
       *     responses:
       *       200:
       *         description: Conta atualizada com sucesso.
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 id:
       *                   type: string
       *                   format: uuid
       *                   description: O ID único da conta atualizada.
       *                 name:
       *                   type: string
       *                   description: O nome da conta atualizada.
       *                 type:
       *                   type: string
       *                   description: O tipo da conta atualizada.
       *                 user_id:
       *                   type: string
       *                   format: uuid
       *                   description: O ID do usuário ao qual a conta pertence.
       *       400:
       *         description: Requisição inválida. Dados fornecidos são inválidos ou nenhum campo para atualizar foi fornecido.
       *       401:
       *         description: Não autorizado. Token de autenticação ausente ou inválido.
       *       404:
       *         description: Conta não encontrada ou você não tem permissão para atualizar esta conta.
       *       500:
       *         description: Erro interno do servidor.
       */
      const id = req.url?.split("?")[0].split("/").pop() as string;
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

      const updatedAccount = await updateAccount(id, updateData, user_id, organization_id, active_accounting_period_id, token);
      if (!updatedAccount) {
        return handleErrorResponse(
          res,
          404,
          "Conta não encontrada ou você não tem permissão para atualizar esta conta.",
        );
      }
      return res.status(200).json(updatedAccount);
    } else if (req.method === "DELETE") {
      /**
       * @swagger
       * /accounts/{id}:
       *   delete:
       *     summary: Deleta uma conta.
       *     description: Deleta uma conta financeira específica pelo seu ID.
       *     tags:
       *       - Accounts
       *     parameters:
       *       - in: path
       *         name: id
       *         schema:
       *           type: string
       *           format: uuid
       *         required: true
       *         description: O ID da conta a ser deletada.
       *     responses:
       *       204:
       *         description: Conta deletada com sucesso. Nenhuma resposta de conteúdo.
       *       400:
       *         description: Requisição inválida. ID da conta fornecido é inválido.
       *       401:
       *         description: Não autorizado. Token de autenticação ausente ou inválido.
       *       404:
       *         description: Conta não encontrada ou você não tem permissão para deletar esta conta.
       *       500:
       *         description: Erro interno do servidor.
       */
      const id = req.url?.split("?")[0].split("/").pop() as string;
      const parsedId = uuidSchema.safeParse(id);
      if (!parsedId.success) {
        return handleErrorResponse(
          res,
          400,
          parsedId.error.errors
            .map((err: z.ZodIssue) => err.message)
            .join(", "),
        );
      }
      const deleted = await deleteAccount(id, user_id, organization_id, active_accounting_period_id, token);

      if (!deleted) {
        return handleErrorResponse(
          res,
          404,
          "Conta não encontrada ou você não tem permissão para deletar esta conta.",
        );
      }
      return res.status(204).send("");
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de contas:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}

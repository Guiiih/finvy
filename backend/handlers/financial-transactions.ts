import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { createFinancialTransactionSchema } from "../utils/schemas.js";
import {
  getFinancialTransactions,
  createFinancialTransaction,
} from "../services/financialTransactionService.js";

/**
 * @swagger
 * /financial-transactions:
 *   get:
 *     summary: Retorna contas a pagar ou a receber.
 *     description: Retorna uma lista de todas as contas a pagar ou a receber para o usuário, dependendo do parâmetro 'type'.
 *     tags:
 *       - Financial Transactions
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [payable, receivable]
 *         required: true
 *         description: O tipo de transação a ser retornado.
 *     responses:
 *       200:
 *         description: Uma lista de transações financeiras.
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
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *                     format: float
 *                   due_date:
 *                     type: string
 *                     format: date
 *                   is_paid:
 *                     type: boolean
 *                   paid_date:
 *                     type: string
 *                     format: date
 *                   is_received:
 *                     type: boolean
 *                   received_date:
 *                     type: string
 *                     format: date
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 *   post:
 *     summary: Cria uma nova conta a pagar ou a receber.
 *     description: Cria uma nova transação financeira (conta a pagar ou a receber) para o usuário.
 *     tags:
 *       - Financial Transactions
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [payable, receivable]
 *         required: true
 *         description: O tipo de transação a ser criada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - due_date
 *             properties:
 *               description:
 *                 type: string
 *                 description: Descrição da transação.
 *               amount:
 *                 type: number
 *                 description: O valor da transação.
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento.
 *               paid_date:
 *                 type: string
 *                 format: date
 *                 description: Data de pagamento (para contas a pagar).
 *               is_paid:
 *                 type: boolean
 *                 description: Status de pagamento.
 *               received_date:
 *                 type: string
 *                 format: date
 *                 description: Data de recebimento (para contas a receber).
 *               is_received:
 *                 type: boolean
 *                 description: Status de recebimento.
 *     responses:
 *       201:
 *         description: Transação criada com sucesso.
 *       400:
 *         description: Requisição inválida.
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  

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
    const { type } = req.query;
    const tableName =
      type === "payable" ? "accounts_payable" : "accounts_receivable";

    if (req.method === "GET") {
      const data = await getFinancialTransactions(type as "payable" | "receivable", user_id, organization_id, active_accounting_period_id, token);
      if (!data) {
        return handleErrorResponse(res, 404, "Transações financeiras não encontradas.");
      }
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const parsedBody = createFinancialTransactionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const newTransaction = parsedBody.data;

      const createdTransaction = await createFinancialTransaction(type as "payable" | "receivable", newTransaction, user_id, organization_id, active_accounting_period_id, token);

      return res.status(201).json(createdTransaction);
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de transações financeiras:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}

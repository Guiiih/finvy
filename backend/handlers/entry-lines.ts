import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";
import { createEntryLineSchema } from "../utils/schemas.js";
import { updateProductStockAndCost } from "../services/productService.js";
import { calculateTaxes } from "../services/taxService.js";

/**
 * @swagger
 * /entry-lines:
 *   get:
 *     summary: Retorna as linhas de um lançamento de diário.
 *     description: Retorna todas as linhas de lançamento associadas a um `journal_entry_id` específico ou todas as linhas do usuário se nenhum ID for fornecido.
 *     tags:
 *       - Entry Lines
 *     parameters:
 *       - in: query
 *         name: journal_entry_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: O ID do lançamento de diário para filtrar as linhas.
 *     responses:
 *       200:
 *         description: Uma lista de linhas de lançamento.
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
 *                   journal_entry_id:
 *                     type: string
 *                     format: uuid
 *                   account_id:
 *                     type: string
 *                     format: uuid
 *                   debit:
 *                     type: number
 *                     format: float
 *                   credit:
 *                     type: number
 *                     format: float
 *                   product_id:
 *                     type: string
 *                     format: uuid
 *                   quantity:
 *                     type: integer
 *                   unit_cost:
 *                     type: number
 *                     format: float
 *                   total_gross:
 *                      type: number
 *                      format: float
 *                   icms_value:
 *                      type: number
 *                      format: float
 *                   ipi_value:
 *                      type: number
 *                      format: float
 *                   pis_value:
 *                      type: number
 *                      format: float
 *                   cofins_value:
 *                      type: number
 *                      format: float
 *                   icms_st_value:
 *                      type: number
 *                      format: float
 *                   total_net:
 *                      type: number
 *                      format: float
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 *   post:
 *     summary: Cria uma ou mais linhas de lançamento.
 *     description: Cria novas linhas de lançamento para um lançamento de diário existente, tratando a lógica de impostos e estoque para vendas e compras.
 *     tags:
 *       - Entry Lines
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - journal_entry_id
 *               - account_id
 *             properties:
 *               journal_entry_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do lançamento de diário ao qual a linha pertence.
 *               account_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da conta principal (e.g., Clientes para venda, Fornecedores para compra).
 *               debit:
 *                 type: number
 *                 description: Valor do débito. Pelo menos um entre débito e crédito deve ser fornecido.
 *               credit:
 *                 type: number
 *                 description: Valor do crédito. Pelo menos um entre débito e crédito deve ser fornecido.
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do produto (opcional, para transações de estoque).
 *               quantity:
 *                 type: integer
 *                 description: Quantidade do produto (opcional).
 *               unit_cost:
 *                 type: number
 *                 description: Custo unitário do produto (opcional).
 *               total_gross:
 *                 type: number
 *                 description: Valor total bruto da transação (base para impostos).
 *               icms_rate:
 *                 type: number
 *                 description: Alíquota de ICMS (%).
 *               ipi_rate:
 *                 type: number
 *                 description: Alíquota de IPI (%).
 *               pis_rate:
 *                 type: number
 *                 description: Alíquota de PIS (%).
 *               cofins_rate:
 *                 type: number
 *                 description: Alíquota de COFINS (%).
 *               mva_rate:
 *                 type: number
 *                 description: Alíquota de MVA para ICMS-ST (%).
 *               total_net:
 *                 type: number
 *                 description: Valor líquido total da nota (usado em compras). Se não fornecido em vendas, é calculado.
 *               transaction_type:
 *                 type: string
 *                 enum: [sale, purchase]
 *                 description: Tipo de transação para determinar a lógica contábil.
 *     responses:
 *       201:
 *         description: Linhas de lançamento criadas com sucesso.
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
 *                   journal_entry_id:
 *                     type: string
 *                     format: uuid
 *                   account_id:
 *                     type: string
 *                     format: uuid
 *                   debit:
 *                     type: number
 *                     format: float
 *                   credit:
 *                     type: number
 *                     format: float
 *       400:
 *         description: Requisição inválida.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Permissão negada para adicionar linhas a este lançamento.
 *       500:
 *         description: Erro interno do servidor, possivelmente por falta de contas contábeis.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  try {
    if (req.method === "GET") {
      const { journal_entry_id } = req.query;

      if (journal_entry_id) {
        const { data, error: dbError } = await serviceRoleSupabase
          .from("entry_lines")
          .select("id, journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, ipi_value, pis_value, cofins_value, icms_st_value, total_net")
          .eq("journal_entry_id", journal_entry_id as string);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      } else {
        const { data, error: dbError } = await serviceRoleSupabase
          .from("entry_lines")
          .select("id, journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, ipi_value, pis_value, cofins_value, icms_st_value, total_net, journal_entry_id(user_id)")
          .eq("journal_entry_id.user_id", user_id);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      }
    }

    if (req.method === "POST") {
      const parsedBody = createEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const {
        journal_entry_id,
        account_id, // This will be the main account (e.g., Clients or Suppliers)
        debit,
        credit,
        product_id,
        quantity,
        unit_cost,
        total_gross,
        icms_rate,
        ipi_rate,
        pis_rate,
        cofins_rate,
        mva_rate,
        transaction_type,
        total_net, // total_net from input
      } = parsedBody.data;

      const {
        calculated_icms_value,
        calculated_ipi_value,
        calculated_pis_value,
        calculated_cofins_value,
        calculated_icms_st_value,
        final_total_net,
      } = calculateTaxes({
        total_gross,
        icms_rate,
        ipi_rate,
        pis_rate,
        cofins_rate,
        mva_rate,
        transaction_type,
        total_net,
      });

      const { data: journalEntry } = await userSupabase
        .from("journal_entries")
        .select("id")
        .eq("id", journal_entry_id)
        .eq("user_id", user_id)
        .single();

      if (!journalEntry) {
        return handleErrorResponse(
          res,
          403,
          "Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.",
        );
      }

      const entryLinesToInsert = [];

      if (transaction_type === "sale") {
        // Fetch required account IDs for sales
        const { data: accounts, error: accountsError } = await userSupabase
          .from("accounts")
          .select("id, name")
          .in("name", [
            "Receita de Vendas",
            "IPI a Recolher",
            "ICMS a Recolher",
            "ICMS-ST a Recolher",
            "PIS a Recolher",
            "COFINS a Recolher",
            "Custo da Mercadoria Vendida",
            "Estoque de Produtos Acabados",
            "PIS sobre Faturamento", // Expense account for PIS
            "COFINS sobre Faturamento", // Expense account for COFINS
          ]);

        if (accountsError) throw accountsError;

        const accountMap = new Map(accounts.map((acc) => [acc.name, acc.id]));

        const revenueAccount = accountMap.get("Receita de Vendas");
        const ipiPayableAccount = accountMap.get("IPI a Recolher");
        const icmsPayableAccount = accountMap.get("ICMS a Recolher");
        const icmsStPayableAccount = accountMap.get("ICMS-ST a Recolher");
        const pisPayableAccount = accountMap.get("PIS a Recolher");
        const cofinsPayableAccount = accountMap.get("COFINS a Recolher");
        const cmvAccount = accountMap.get("Custo da Mercadoria Vendida");
        const finishedGoodsStockAccount = accountMap.get("Estoque de Produtos Acabados");
        const pisExpenseAccount = accountMap.get("PIS sobre Faturamento");
        const cofinsExpenseAccount = accountMap.get("COFINS sobre Faturamento");

        if (!revenueAccount || !ipiPayableAccount || !icmsPayableAccount || !icmsStPayableAccount || !pisPayableAccount || !cofinsPayableAccount || !cmvAccount || !finishedGoodsStockAccount || !pisExpenseAccount || !cofinsExpenseAccount) {
          return handleErrorResponse(
            res,
            500,
            "Contas contábeis essenciais para vendas não encontradas. Verifique se todas as contas necessárias existem.",
          );
        }
        // Main transaction line (Debit Clients/Cash, Credit Revenue + Taxes)
        entryLinesToInsert.push({
          journal_entry_id,
          account_id, // This is the account_id passed in the request (e.g., Clients or Cash)
          debit: final_total_net,
          credit: null,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value,
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          total_net: final_total_net,
        });

        // Credit Revenue
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: revenueAccount,
          debit: null,
          credit: total_gross,
        });

        // IPI Entry (Credit IPI a Recolher)
        if (calculated_ipi_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: ipiPayableAccount,
            debit: null,
            credit: calculated_ipi_value,
          });
        }

        // ICMS Próprio Entry (Debit Revenue, Credit ICMS a Recolher)
        if (calculated_icms_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: revenueAccount, // Debit Revenue
            debit: calculated_icms_value,
            credit: null,
          });
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: icmsPayableAccount, // Credit ICMS a Recolher
            debit: null,
            credit: calculated_icms_value,
          });
        }

        // ICMS-ST Entry (Credit ICMS-ST a Recolher)
        if (calculated_icms_st_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: icmsStPayableAccount,
            debit: null,
            credit: calculated_icms_st_value,
          });
        }

        // PIS Entry (Debit PIS sobre Faturamento, Credit PIS a Recolher)
        if (calculated_pis_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: pisExpenseAccount,
            debit: calculated_pis_value,
            credit: null,
          });
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: pisPayableAccount,
            debit: null,
            credit: calculated_pis_value,
          });
        }

        // COFINS Entry (Debit COFINS sobre Faturamento, Credit COFINS a Recolher)
        if (calculated_cofins_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cofinsExpenseAccount,
            debit: calculated_cofins_value,
            credit: null,
          });
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cofinsPayableAccount,
            debit: null,
            credit: calculated_cofins_value,
          });
        }

        // CMV Entry (Debit Custo da Mercadoria Vendida, Credit Estoque de Produtos Acabados)
        if (product_id && quantity && unit_cost) {
          const cmv_value = quantity * unit_cost;
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cmvAccount,
            debit: cmv_value,
            credit: null,
          });
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: finishedGoodsStockAccount,
            debit: null,
            credit: cmv_value,
          });
        }

        // Stock and cost update logic for sales
        if (product_id && quantity) {
          // For sales, unit_cost in entry_line should be the average cost at the time of sale.
          // The updateProductStockAndCost function will only decrease stock for sales.
          await updateProductStockAndCost(product_id, quantity, unit_cost || 0, 'sale', user_id, token);
        }
      } else if (transaction_type === "purchase") {
        // Fetch required account IDs for purchases
        const { data: accounts, error: accountsError } = await userSupabase
          .from("accounts")
          .select("id, name")
          .in("name", [
            "Estoque de Mercadorias", // For retailer purchases
            "Fornecedores", // For retailer purchases
          ]);

        if (accountsError) throw accountsError;

        const accountMap = new Map(accounts.map((acc) => [acc.name, acc.id]));

        const merchandiseStockAccount = accountMap.get("Estoque de Mercadorias");
        const suppliersAccount = accountMap.get("Fornecedores");

        if (!merchandiseStockAccount || !suppliersAccount) {
          return handleErrorResponse(
            res,
            500,
            "Contas contábeis essenciais para compras não encontradas. Verifique se todas as contas necessárias existem.",
          );
        }

        // Retailer Purchase Scenario
        // Debit Estoque de Mercadorias, Credit Fornecedores
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: merchandiseStockAccount,
          debit: final_total_net, // Total value of the invoice (already includes IPI and ICMS-ST if applicable)
          credit: null,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value, // Still store calculated values for reference
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          total_net: final_total_net,
        });
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: suppliersAccount,
          debit: null,
          credit: final_total_net,
        });

        // Stock and cost update logic for purchases
        if (product_id && quantity && unit_cost !== undefined) {
          await updateProductStockAndCost(product_id, quantity, unit_cost, 'purchase', user_id, token);
        }
      } else { // Default or other types, for now, just insert the main line
        entryLinesToInsert.push({
          journal_entry_id,
          account_id,
          debit,
          credit,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value,
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          total_net: final_total_net,
        });
      }

      const { data: newLines, error: insertError } = await userSupabase
        .from("entry_lines")
        .insert(entryLinesToInsert)
        .select();

      if (insertError) throw insertError;

      return res.status(201).json(newLines);
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de linhas de lançamento:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}
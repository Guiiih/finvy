import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";
import { createEntryLineSchema } from "../utils/schemas.js";

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
          .select("*, product_id, quantity, unit_cost")
          .eq("journal_entry_id", journal_entry_id as string);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      } else {
        const { data, error: dbError } = await serviceRoleSupabase
          .from("entry_lines")
          .select("*, journal_entry_id(user_id)")
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

      let calculated_icms_value = 0;
      let calculated_ipi_value = 0;
      let calculated_pis_value = 0;
      let calculated_cofins_value = 0;
      let calculated_icms_st_value = 0;
      let base_for_icms_and_pis_cofins = total_gross || 0; // Initial base for ICMS and PIS/COFINS

      let final_total_net = total_net || 0; // Use the provided total_net for purchase/default

      // Only calculate taxes for sales (manufacturer scenario)
      if (transaction_type === "sale") {
        // 1. Calculate IPI
        if (total_gross !== undefined && ipi_rate !== undefined) {
          calculated_ipi_value = total_gross * (ipi_rate / 100);
          base_for_icms_and_pis_cofins = (total_gross || 0) + calculated_ipi_value; // Price with IPI
        }

        // 2. Calculate ICMS Próprio (using price with IPI as base)
        if (base_for_icms_and_pis_cofins !== undefined && icms_rate !== undefined) {
          calculated_icms_value = base_for_icms_and_pis_cofins * (icms_rate / 100);
        }

        // 3. Calculate PIS and COFINS (using initial total_gross as base for monofasico)
        if (total_gross !== undefined && pis_rate !== undefined) {
          calculated_pis_value = total_gross * (pis_rate / 100);
        }
        if (total_gross !== undefined && cofins_rate !== undefined) {
          calculated_cofins_value = total_gross * (cofins_rate / 100);
        }

        // 4. Calculate ICMS-ST
        if (base_for_icms_and_pis_cofins !== undefined && mva_rate !== undefined && icms_rate !== undefined) {
          const base_icms_st = base_for_icms_and_pis_cofins * (1 + (mva_rate / 100));
          const icms_st_total = base_icms_st * (icms_rate / 100);
          calculated_icms_st_value = icms_st_total - calculated_icms_value;
        }

        // Recalculate final_total_net for sales based on gross + calculated taxes
        final_total_net = total_gross || 0;
        final_total_net += calculated_ipi_value;
        final_total_net += calculated_icms_st_value;
      }

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

      // Fetch required account IDs
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
          "Estoque de Mercadorias", // For retailer purchases
          "Fornecedores", // For retailer purchases
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
      const merchandiseStockAccount = accountMap.get("Estoque de Mercadorias");
      const suppliersAccount = accountMap.get("Fornecedores");
      const pisExpenseAccount = accountMap.get("PIS sobre Faturamento");
      const cofinsExpenseAccount = accountMap.get("COFINS sobre Faturamento");

      if (!revenueAccount || !ipiPayableAccount || !icmsPayableAccount || !icmsStPayableAccount || !pisPayableAccount || !cofinsPayableAccount || !cmvAccount || !finishedGoodsStockAccount || !merchandiseStockAccount || !suppliersAccount || !pisExpenseAccount || !cofinsExpenseAccount) {
        return handleErrorResponse(
          res,
          500,
          "Contas contábeis essenciais não encontradas. Verifique se todas as contas necessárias existem.",
        );
      }

      const entryLinesToInsert = [];

      if (transaction_type === "sale") {
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

        // Stock update logic for sales
        if (product_id && quantity) {
          const { data: product } = await userSupabase
            .from("products")
            .select("current_stock")
            .eq("id", product_id)
            .eq("user_id", user_id)
            .single();

          if (product) {
            let newStock = product.current_stock || 0;
            newStock = newStock - quantity;

            await userSupabase
              .from("products")
              .update({ current_stock: newStock })
              .eq("id", product_id);
          }
        }
      } else if (transaction_type === "purchase") {
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

        // Stock update logic for purchases
        if (product_id && quantity) {
          const { data: product } = await userSupabase
            .from("products")
            .select("current_stock")
            .eq("id", product_id)
            .eq("user_id", user_id)
            .single();

          if (product) {
            let newStock = product.current_stock || 0;
            newStock = newStock + quantity;

            await userSupabase
              .from("products")
              .update({ current_stock: newStock })
              .eq("id", product_id);
          }
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
    console.error("Erro inesperado na API de linhas de lançamento:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}
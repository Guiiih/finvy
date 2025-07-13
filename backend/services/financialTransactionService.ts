import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";
import { FinancialTransaction } from "../types/index.js";

export async function getFinancialTransactions(
  type: "payable" | "receivable",
  user_id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  const tableName = type === "payable" ? "accounts_payable" : "accounts_receivable";

  const { data, error: dbError } = await userSupabase
    .from(tableName)
    .select(
      "id, description, amount, due_date, paid_date, is_paid, received_date, is_received, organization_id, accounting_period_id",
    )
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id)
    .order("created_at", { ascending: false });

  if (dbError) {
    logger.error("Financial Transactions Service: Erro ao buscar transações financeiras:", dbError);
    throw dbError;
  }
  return data;
}

export async function createFinancialTransaction(
  type: "payable" | "receivable",
  newTransaction: FinancialTransaction,
  user_id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  const tableName = type === "payable" ? "accounts_payable" : "accounts_receivable";

  

  const transactionToInsert = {
    ...newTransaction,
    user_id,
    organization_id,
    accounting_period_id: active_accounting_period_id,
  };

  const { data: newFinancialTransaction, error: dbError } = await userSupabase
    .from(tableName)
    .insert([transactionToInsert])
    .select()
    .single();

  if (dbError) {
    logger.error("Financial Transactions Service: Erro ao criar transação financeira:", dbError);
    throw dbError;
  }
  return newFinancialTransaction;
}

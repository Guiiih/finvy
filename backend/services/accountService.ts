import { getSupabaseClient } from "../utils/supabaseClient.js";
import logger from "../utils/logger.js";
import { Account } from "../types/index.js";

export const accountsCache = new Map<string, { data: Account[]; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

function getCacheKey(organizationId: string, accountingPeriodId: string): string {
  return `${organizationId}-${accountingPeriodId}`;
}

export function getCachedAccounts(organizationId: string, accountingPeriodId: string): Account[] | null {
  const key = getCacheKey(organizationId, accountingPeriodId);
  const cached = accountsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

export function setCachedAccounts(organizationId: string, accountingPeriodId: string, data: Account[]) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  accountsCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateAccountsCache(organizationId: string, accountingPeriodId: string) {
  const key = getCacheKey(organizationId, accountingPeriodId);
  accountsCache.delete(key);
}

export async function getAccounts(
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account[] | null> {
  const userSupabase = getSupabaseClient(token);

  const cachedData = getCachedAccounts(organization_id, active_accounting_period_id);
  if (cachedData) {
    logger.info("Accounts Service: Retornando contas do cache.");
    return cachedData;
  }

  const { data, error: dbError } = await userSupabase
    .from("accounts")
    .select(
      "id, name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected",
    )
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id)
    .order("name", { ascending: true });

  if (dbError) {
    logger.error("Accounts Service: Erro ao buscar contas:", dbError);
    throw dbError;
  }

  setCachedAccounts(organization_id, active_accounting_period_id, data as Account[]);
  return data as Account[];
}

export async function createAccount(
  newAccount: Omit<Account, "id">,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase
    .from("accounts")
    .insert({
      ...newAccount,
      organization_id,
      accounting_period_id: active_accounting_period_id,
    })
    .select();

  if (dbError) {
    logger.error("Accounts Service: Erro ao criar conta:", dbError);
    throw dbError;
  }

  invalidateAccountsCache(organization_id, active_accounting_period_id);
  return data[0] as Account;
}

export async function updateAccount(
  id: string,
  updateData: Partial<Account>,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token);

  const { data, error: dbError } = await userSupabase
    .from("accounts")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id)
    .select();

  if (dbError) {
    logger.error("Accounts Service: Erro ao atualizar conta:", dbError);
    throw dbError;
  }

  if (!data || data.length === 0) {
    return null;
  }

  invalidateAccountsCache(organization_id, active_accounting_period_id);
  return data[0] as Account;
}

export async function deleteAccount(
  id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token);

  // Primeiro, verifique se a conta está protegida
  const { data: accountData, error: fetchError } = await userSupabase
    .from("accounts")
    .select("is_protected")
    .eq("id", id)
    .eq("organization_id", organization_id)
    .single();

  if (fetchError) {
    logger.error("Accounts Service: Erro ao buscar conta para verificar proteção:", fetchError);
    throw fetchError;
  }

  if (accountData?.is_protected) {
    logger.warn(`Accounts Service: Tentativa de deletar conta protegida com ID: ${id}`);
    throw new Error("Esta conta está protegida e não pode ser deletada.");
  }

  const { error: dbError, count } = await userSupabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .eq("accounting_period_id", active_accounting_period_id);

  if (dbError) {
    logger.error("Accounts Service: Erro ao deletar conta:", dbError);
    throw dbError;
  }

  if (count === 0) {
    return false;
  }

  invalidateAccountsCache(organization_id, active_accounting_period_id);
  return true;
}

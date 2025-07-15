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
  accountData: { name: string; parent_account_id?: string | null },
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token);

  let parentAccount: Account | null = null;
  let newAccountCode: string;
  let newAccountType: Account['type'];

  // ATENÇÃO: Para garantir atomicidade em ambientes de alta concorrência,
  // esta lógica de geração de código e tipo deve idealmente ser implementada
  // como uma função de banco de dados (stored procedure) no PostgreSQL/Supabase.
  // A implementação atual é sequencial e pode levar a condições de corrida.
  // Isso é crucial para evitar a duplicação de códigos de conta em cenários de múltiplos usuários criando contas simultaneamente.

  if (accountData.parent_account_id) {
    // 1. Buscar conta pai
    const { data: fetchedParent, error: parentError } = await userSupabase
      .from("accounts")
      .select("id, code, type")
      .eq("id", accountData.parent_account_id)
      .eq("organization_id", organization_id)
      .eq("accounting_period_id", active_accounting_period_id)
      .single();

    if (parentError || !fetchedParent) {
      logger.error("Accounts Service: Erro ao buscar conta pai:", parentError);
      throw new Error("Conta pai não encontrada ou inacessível.");
    }
    parentAccount = fetchedParent as Account;
    newAccountType = parentAccount.type; // Herda o tipo da conta pai

    // 2. Encontrar o maior código de conta filha existente para o pai
    const { data: children, error: childrenError } = await userSupabase
      .from("accounts")
      .select("code")
      .eq("parent_account_id", parentAccount.id)
      .eq("organization_id", organization_id)
      .eq("accounting_period_id", active_accounting_period_id)
      .order("code", { ascending: false }); // Ordena para pegar o maior código

    if (childrenError) {
      logger.error("Accounts Service: Erro ao buscar contas filhas:", childrenError);
      throw childrenError;
    }

    let lastChildNumber = 0;
    if (children && children.length > 0) {
      const lastChildCode = children[0].code;
      const parts = lastChildCode.split('.');
      lastChildNumber = parseInt(parts[parts.length - 1]) || 0;
    }
    newAccountCode = `${parentAccount.code}.${lastChildNumber + 1}`;
  } else {
    // Conta de nível superior (sem pai)
    // 1. Encontrar o maior código de conta de nível superior existente
    const { data: topLevelAccounts, error: topLevelError } = await userSupabase
      .from("accounts")
      .select("code, type")
      .is("parent_account_id", null)
      .eq("organization_id", organization_id)
      .eq("accounting_period_id", active_accounting_period_id)
      .order("code", { ascending: false });

    if (topLevelError) {
      logger.error("Accounts Service: Erro ao buscar contas de nível superior:", topLevelError);
      throw topLevelError;
    }

    let lastTopLevelNumber = 0;
    if (topLevelAccounts && topLevelAccounts.length > 0) {
      const lastTopLevelCode = topLevelAccounts[0].code;
      lastTopLevelNumber = parseInt(lastTopLevelCode) || 0;
      newAccountType = topLevelAccounts[0].type; // Assume o tipo da conta de nível superior existente
    } else {
      // Se for a primeira conta de nível superior, define um tipo padrão.
      // Isso pode precisar ser mais configurável ou inferido de outra forma.
      newAccountType = 'asset'; // Tipo padrão para a primeira conta de nível superior
    }
    newAccountCode = `${lastTopLevelNumber + 1}`;
  }

  const accountToInsert = {
    name: accountData.name,
    parent_account_id: accountData.parent_account_id,
    code: newAccountCode,
    type: newAccountType,
    organization_id,
    accounting_period_id: active_accounting_period_id,
  };

  const { data, error: dbError } = await userSupabase
    .from("accounts")
    .insert(accountToInsert)
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

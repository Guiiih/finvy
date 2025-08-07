import logger from './logger.js'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  logger.error(
    'Erro: Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) não definidas.',
  )
  throw new Error('Variáveis de ambiente do Supabase não configuradas.')
}

export const anonSupabase = createClient(supabaseUrl!, supabaseAnonKey!)

export const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

export function getSupabaseClient(token: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
}

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseServiceRoleKey!)
}

export const handleErrorResponse = (res: VercelResponse, statusCode: number, message: string) => {
  res.status(statusCode).json({ error: message })
}

export async function getUserOrganizationAndPeriod(
  user_id: string,
  token: string,
): Promise<{
  organization_id: string
  active_accounting_period_id: string
} | null> {
  logger.info(
    `[SupabaseClient] getUserOrganizationAndPeriod: Buscando perfil para user_id: ${user_id}`,
  )
  const userSupabase = getSupabaseClient(token)
  const { data, error } = await userSupabase
    .from('profiles')
    .select('organization_id, active_accounting_period_id')
    .eq('id', user_id)
    .single()

  if (error) {
    logger.error(
      `[SupabaseClient] Erro ao buscar organization_id e active_accounting_period_id para o usuário ${user_id}:`,
      { error },
    )
    return null
  }

  if (!data) {
    logger.warn(`[SupabaseClient] Perfil não encontrado para o usuário: ${user_id}`)
    return null
  }

  if (!data.organization_id) {
    logger.warn(
      `[SupabaseClient] organization_id ausente no perfil para o usuário: ${user_id}. Dados do perfil: ${JSON.stringify(data)}`,
    )
    return null
  }

  logger.info(
    `[SupabaseClient] Perfil encontrado para user_id ${user_id}. Organization ID: ${data.organization_id}, Active Accounting Period ID: ${data.active_accounting_period_id}`,
  )
  return {
    organization_id: data.organization_id,
    active_accounting_period_id: data.active_accounting_period_id,
  }
}

export async function getUserProfileInfo(
  user_id: string,
  token: string,
): Promise<{
  username: string | null
  email: string | null
  handle: string | null
} | null> {
  logger.info(`[SupabaseClient] getUserProfileInfo: Buscando perfil para user_id: ${user_id}`)
  const userSupabase = getSupabaseClient(token)
  const { data, error } = await userSupabase
    .from('profiles')
    .select('username, email, handle')
    .eq('id', user_id)
    .single()

  if (error) {
    logger.error(
      `[SupabaseClient] Erro ao buscar informações do perfil para o usuário ${user_id}:`,
      { error },
    )
    return null
  }

  if (!data) {
    logger.warn(`[SupabaseClient] Perfil não encontrado para o usuário: ${user_id}`)
    return null
  }

  logger.info(
    `[SupabaseClient] Perfil encontrado para user_id ${user_id}. Username: ${data.username}, Email: ${data.email}, Handle: ${data.handle}`,
  )
  return {
    username: data.username,
    email: data.email,
    handle: data.handle,
  }
}

import { getSupabaseClient } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { Account } from '../types/index.js'
import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY não está configurada para o Account Service.')
  throw new Error('GEMINI_API_KEY não está configurada.')
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function getAccounts(
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ data: Account[]; count: number }> {
  const userSupabase = getSupabaseClient(token)

  const offset = (page - 1) * limit

  // No cache for paginated results, as cache key would be too granular

  const {
    data,
    error: dbError,
    count,
  } = await userSupabase
    .from('accounts')
    .select(
      'id, name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected, is_active, fiscal_operation_type',
      { count: 'exact' },
    )
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (dbError) {
    logger.error({ dbError }, 'Accounts Service: Erro ao buscar contas:')
    throw dbError
  }

  return { data: data.map((acc) => ({ ...acc, balance: 0 })) as Account[], count: count || 0 }
}

export async function getAccountsByType(
  organization_id: string,
  active_accounting_period_id: string,
  type: string,
  token: string,
): Promise<{ data: Account[]; count: number }> {
  const userSupabase = getSupabaseClient(token)

  const {
    data,
    error: dbError,
    count,
  } = await userSupabase
    .from('accounts')
    .select(
      'id, name, type, code, parent_account_id, organization_id, accounting_period_id, is_protected, is_active, fiscal_operation_type',
      { count: 'exact' },
    )
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)
    .eq('type', type)
    .order('name', { ascending: true })

  if (dbError) {
    logger.error({ dbError }, 'Accounts Service: Erro ao buscar contas por tipo:')
    throw dbError
  }

  return { data: data.map((acc) => ({ ...acc, balance: 0 })) as Account[], count: count || 0 }
}

export async function createAccount(
  accountData: {
    name: string
    parent_account_id?: string | null
    type?: Account['type']
    fiscal_operation_type?: string | null
  },
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token)

  let newAccountCode: string
  let newAccountType: Account['type']
  let parentAccount: Account | null = null

  // 1. Determinar o tipo da nova conta
  if (accountData.type) {
    newAccountType = accountData.type // Prioriza o tipo fornecido explicitamente
  } else if (accountData.parent_account_id) {
    // Se houver conta pai, busca e herda o tipo dela
    const { data: fetchedParent, error: parentError } = await userSupabase
      .from('accounts')
      .select('id, code, type')
      .eq('id', accountData.parent_account_id)
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .single()

    if (parentError || !fetchedParent) {
      logger.error(
        { parentError },
        'Accounts Service: Erro ao buscar conta pai para determinar tipo:',
      )
      throw new Error('Conta pai não encontrada ou inacessível para determinar o tipo.')
    }
    parentAccount = fetchedParent as Account
    newAccountType = parentAccount.type
  } else {
    // Se não houver tipo explícito nem conta pai, usa um padrão ou infere de contas de nível superior
    const { data: topLevelAccounts, error: topLevelError } = await userSupabase
      .from('accounts')
      .select('code, type')
      .is('parent_account_id', null)
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .order('code', { ascending: false })

    if (topLevelError) {
      logger.error(
        { topLevelError },
        'Accounts Service: Erro ao buscar contas de nível superior para determinar tipo:',
      )
      throw topLevelError
    }

    if (topLevelAccounts && topLevelAccounts.length > 0) {
      newAccountType = topLevelAccounts[0].type
    } else {
      newAccountType = 'asset' // Padrão se for a primeira conta de nível superior
    }
  }

  // 2. Gerar o código da nova conta
  if (accountData.parent_account_id) {
    // Se tiver conta pai, busca novamente para garantir que 'parentAccount' está preenchido para a lógica de código
    if (!parentAccount) {
      // Se não foi preenchido na etapa de tipo
      const { data: fetchedParent, error: parentError } = await userSupabase
        .from('accounts')
        .select('id, code, type')
        .eq('id', accountData.parent_account_id)
        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)
        .single()

      if (parentError || !fetchedParent) {
        logger.error(
          { parentError },
          'Accounts Service: Erro ao buscar conta pai para gerar código:',
        )
        throw new Error('Conta pai não encontrada ou inacessível para gerar o código.')
      }
      parentAccount = fetchedParent as Account
    }

    const { data: children, error: childrenError } = await userSupabase
      .from('accounts')
      .select('code')
      .eq('parent_account_id', parentAccount.id)
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .order('code', { ascending: false })

    if (childrenError) {
      logger.error(
        { childrenError },
        'Accounts Service: Erro ao buscar contas filhas para gerar código:',
      )
      throw childrenError
    }

    let lastChildNumber = 0
    if (children && children.length > 0) {
      const lastChildCode = children[0].code
      const parts = lastChildCode.split('.')
      lastChildNumber = parseInt(parts[parts.length - 1]) || 0
    }
    newAccountCode = `${parentAccount.code}.${lastChildNumber + 1}`
  } else {
    // Conta de nível superior (sem pai)
    const { data: topLevelAccounts, error: topLevelError } = await userSupabase
      .from('accounts')
      .select('code')
      .is('parent_account_id', null)
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .order('code', { ascending: false })

    if (topLevelError) {
      logger.error(
        { topLevelError },
        'Accounts Service: Erro ao buscar contas de nível superior para gerar código:',
      )
      throw topLevelError
    }

    let lastTopLevelNumber = 0
    if (topLevelAccounts && topLevelAccounts.length > 0) {
      const lastTopLevelCode = topLevelAccounts[0].code
      lastTopLevelNumber = parseInt(lastTopLevelCode) || 0
    }
    newAccountCode = `${lastTopLevelNumber + 1}`
  }

  const accountToInsert = {
    name: accountData.name,
    parent_account_id: accountData.parent_account_id,
    code: newAccountCode,
    type: newAccountType,
    fiscal_operation_type: accountData.fiscal_operation_type,
    organization_id,
    accounting_period_id: active_accounting_period_id,
  }

  const { data, error: dbError } = await userSupabase
    .from('accounts')
    .insert(accountToInsert)
    .select()

  if (dbError) {
    logger.error({ dbError }, 'Accounts Service: Erro ao criar conta:')
    throw dbError
  }

  return data[0] as Account
}

export async function updateAccount(
  id: string,
  updateData: Partial<Account>,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error: dbError } = await userSupabase
    .from('accounts')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)
    .select()

  if (dbError) {
    logger.error({ dbError }, 'Accounts Service: Erro ao atualizar conta:')
    throw dbError
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0] as Account
}

export async function deleteAccount(
  id: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<boolean> {
  const userSupabase = getSupabaseClient(token)

  // Primeiro, verifique se a conta está protegida
  const { data: accountData, error: fetchError } = await userSupabase
    .from('accounts')
    .select('is_protected')
    .eq('id', id)
    .eq('organization_id', organization_id)
    .single()

  if (fetchError) {
    logger.error({ fetchError }, 'Accounts Service: Erro ao buscar conta para verificar proteção:')
    throw fetchError
  }

  if (accountData?.is_protected) {
    logger.warn(`Accounts Service: Tentativa de deletar conta protegida com ID: ${id}`)
    throw new Error('Esta conta está protegida e não pode ser deletada.')
  }

  const { error: dbError, count } = await userSupabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)

  if (dbError) {
    logger.error({ dbError }, 'Accounts Service: Erro ao deletar conta:')
    throw dbError
  }

  if (count === 0) {
    return false
  }

  return true
}

export async function findAccountByName(
  accountName: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
): Promise<Account | null> {
  const userSupabase = getSupabaseClient(token)

  const { data, error: dbError } = await userSupabase
    .from('accounts')
    .select('*')
    .eq('name', accountName)
    .eq('organization_id', organization_id)
    .eq('accounting_period_id', active_accounting_period_id)
    .single()

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      // No rows found
      return null
    }
    logger.error({ dbError }, 'Accounts Service: Erro ao buscar conta por nome:')
    throw dbError
  }

  return data as Account
}

export async function getOrCreateAccount(
  accountName: string,
  organization_id: string,
  active_accounting_period_id: string,
  token: string,
  contextText: string, // Texto do exercício para dar contexto ao Gemini
  processingStack: string[] = [], // Adicionar pilha de processamento para detectar ciclos
): Promise<Account> {
  // 1. Tentar encontrar a conta existente
  const existingAccount = await findAccountByName(
    accountName,
    organization_id,
    active_accounting_period_id,
    token,
  )

  if (existingAccount) {
    logger.info(`[AccountService] Conta "${accountName}" encontrada.`)
    return existingAccount
  }

  // Detectar ciclo na recursão
  if (processingStack.includes(accountName)) {
    logger.warn(
      `[AccountService] Ciclo detectado para a conta "${accountName}". Interrompendo recursão.`,
    )
    throw new Error(`Ciclo de criação de conta detectado para "${accountName}".`)
  }

  logger.warn(
    `[AccountService] Conta "${accountName}" não encontrada. Tentando criar automaticamente.`,
  )

  // Adicionar a conta atual à pilha de processamento
  processingStack.push(accountName)

  // 2. Se não existir, pedir ao Gemini para sugerir o tipo da conta
  const prompt = `
    Você é um assistente contábil. Dada a conta contábil "${accountName}" e o contexto do exercício:
    """
    ${contextText}
    """
    Por favor, sugira o tipo contábil mais apropriado para esta conta e, se aplicável, o nome de uma conta pai *direta* dentro de uma hierarquia contábil comum.
    Os tipos contábeis são:
    - 'asset': Bens e direitos (ex: Caixa, Bancos, Equipamentos, Imóveis, Contas a Receber)
    - 'liability': Obrigações (ex: Contas a Pagar, Empréstimos, Salários a Pagar)
    - 'equity': Patrimônio Líquido (ex: Capital Social, Lucros Acumulados)
    - 'revenue': Receitas (ex: Receita de Vendas, Juros Ativos)
    - 'expense': Despesas (ex: Despesas com Salários, Aluguel, Depreciação)

    Considere a seguinte hierarquia contábil comum:
    Ativo > Ativo Circulante > Caixa e Equivalentes de Caixa > Caixa
    Ativo > Ativo Não Circulante > Ativo Imobilizado > Equipamentos

    Responda com um JSON no seguinte formato:
    {
      "type": "[tipo_sugerido]", // Ex: "asset"
      "parentAccountName": "[nome_da_conta_pai_sugerida]" // Opcional. Ex: "Caixa e Equivalentes de Caixa" ou null se não houver.
    }
    Exemplo: {"type": "asset", "parentAccountName": "Caixa e Equivalentes de Caixa"}
    Exemplo: {"type": "asset", "parentAccountName": "Ativo Imobilizado"}
    Exemplo: {"type": "asset", "parentAccountName": null}
  `

  let suggestedType: Account['type'] = 'asset' // Default para evitar erros
  let parentAccountId: string | null = null // Declarar aqui

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            },
            parentAccountName: { type: Type.STRING, nullable: true },
          },
          required: ['type'],
        },
      },
    })
    const geminiResponse = JSON.parse(result.text || '{}')

    // Validar o tipo sugerido
    const validTypes: Account['type'][] = ['asset', 'liability', 'equity', 'revenue', 'expense']
    if (geminiResponse.type && validTypes.includes(geminiResponse.type as Account['type'])) {
      suggestedType = geminiResponse.type as Account['type']
      logger.info(
        `[AccountService] Gemini sugeriu o tipo "${suggestedType}" para a conta "${accountName}".`,
      )
    } else {
      logger.warn(
        `[AccountService] Gemini sugeriu um tipo inválido ou vazio para "${accountName}": "${geminiResponse.type}". Usando tipo padrão: asset.`,
      )
    }

    if (geminiResponse.parentAccountName && geminiResponse.parentAccountName !== accountName) {
      // Evitar que a conta seja seu próprio pai
      logger.info(
        `[AccountService] Gemini sugeriu conta pai: "${geminiResponse.parentAccountName}" para "${accountName}".`,
      )
      try {
        // Tenta encontrar ou criar a conta pai recursivamente
        const parentAccount = await getOrCreateAccount(
          geminiResponse.parentAccountName,
          organization_id,
          active_accounting_period_id,
          token,
          contextText, // Passa o contexto para a chamada recursiva
          processingStack, // Passa a pilha de processamento
        )
        if (parentAccount) {
          parentAccountId = parentAccount.id
          logger.info(
            `[AccountService] Conta pai "${geminiResponse.parentAccountName}" encontrada/criada com ID: ${parentAccountId}.`,
          )
        } else {
          logger.warn(
            `[AccountService] Falha ao encontrar/criar conta pai "${geminiResponse.parentAccountName}". Criando conta "${accountName}" sem pai.`,
          )
        }
      } catch (parentProcessError) {
        logger.error(
          { parentProcessError },
          `[AccountService] Erro ao processar conta pai "${geminiResponse.parentAccountName}":`,
        )
        logger.warn(
          `[AccountService] Criando conta "${accountName}" sem pai devido a erro no processamento da conta pai.`,
        )
      }
    } else if (geminiResponse.parentAccountName === accountName) {
      logger.warn(
        `[AccountService] Gemini sugeriu a própria conta "${accountName}" como conta pai. Ignorando sugestão de pai.`,
      )
    }
  } catch (error) {
    logger.error(
      { error },
      `[AccountService] Erro ao pedir sugestão de tipo ou conta pai para "${accountName}" ao Gemini:`,
    )
    logger.error({ error }, 'Erro detalhado do Gemini:')
    logger.warn(
      `[AccountService] Usando tipo padrão 'asset' e sem conta pai para a conta "${accountName}" devido a erro na sugestão do Gemini.`,
    )
  } finally {
    // Remover a conta atual da pilha de processamento ao sair
    const index = processingStack.indexOf(accountName)
    if (index > -1) {
      processingStack.splice(index, 1)
    }
  }

  // 3. Criar a nova conta
  const newAccount = await createAccount(
    { name: accountName, type: suggestedType, parent_account_id: parentAccountId },
    organization_id,
    active_accounting_period_id,
    token,
  )

  if (!newAccount) {
    throw new Error(`Falha crítica ao criar a conta "${accountName}" automaticamente.`)
  }

  logger.info(
    `[AccountService] Conta "${accountName}" criada automaticamente com tipo "${newAccount.type}" e conta pai ${newAccount.parent_account_id || 'nenhuma'}.`,
  )
  return newAccount
}

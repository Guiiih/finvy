import { ChatbotMessage, ChatbotResponse } from '../types/chatbot.js'
import logger from '../utils/logger.js'
import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { solveExercise } from './exerciseSolverService.js'
import { validateJournalEntry } from './journalEntryValidatorService.js'
import { searchJournalEntriesByDescription } from './journalEntrySearchService.js'

// --- Início: Interfaces para Tipagem ---
// Nota: O ideal é mover estas interfaces para um arquivo compartilhado (ex: 'src/types/journal.ts')

// Interface para um lançamento contábil vindo do banco de dados
interface JournalEntry {
  id: string
  description: string
  // Adicione outros campos relevantes do seu banco de dados se necessário
}

// Interface para uma única linha de débito ou crédito
interface TransactionLine {
  account: string
  value: number
}

// Interface para um lançamento contábil proposto pela IA
interface ProposedEntry {
  date: string
  description: string
  debits: TransactionLine[]
  credits: TransactionLine[]
}
// --- Fim: Interfaces para Tipagem ---

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY não está configurada nas variáveis de ambiente.')
  throw new Error('GEMINI_API_KEY não está configurada.')
}

logger.info(
  `[ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): ${GEMINI_API_KEY.substring(0, 5)}`,
)

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function sendMessageToChatbot(
  message: string,
  conversationHistory: ChatbotMessage[] = [],
  user_id: string,
  token: string,
  organization_id: string,
  active_accounting_period_id: string,
): Promise<ChatbotResponse> {
  logger.info(`[ChatbotService] Recebida mensagem: "${message}"`)

  try {
    const contents = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    contents.push({ role: 'user', parts: [{ text: message }] })

    const prompt = `
      Você é um assistente contábil amigável e prestativo. Sua principal função é responder a dúvidas contábeis.
      No entanto, você também pode identificar a intenção do usuário para resolver ou validar exercícios/lançamentos.
      Analise a mensagem do usuário e determine a intenção principal:
      - 'general_question': Se for uma pergunta comum sobre contabilidade.
      - 'resolve_exercise_request': Se o usuário pedir para resolver um exercício (ex: "resolva este exercício", "calcule isso").
      - 'validate_journal_entry_request': Se o usuário pedir para validar um lançamento (ex: "minha solução está correta?", "verifique meu lançamento").
      - 'validate_existing_journal_entry_request': Se o usuário pedir para validar um lançamento existente no sistema (ex: "validar lançamento existente", "verificar lançamento no sistema").
      - 'exercise_text_received': Se o usuário colou o texto de um exercício para ser resolvido.
      - 'journal_entry_text_received': Se o usuário colou o texto de um lançamento para ser validado.
      - 'awaiting_existing_journal_entry_description': Se o chatbot está aguardando a descrição de um lançamento existente para buscar.
      - 'awaiting_clarification': Se o chatbot fez perguntas de esclarecimento e está aguardando a resposta do usuário.

      Sua resposta deve ser um JSON com a seguinte estrutura:
      {
        "reply": "sua resposta textual aqui",
        "intent": "general_question" | "resolve_exercise_request" | "validate_journal_entry_request" | "validate_existing_journal_entry_request" | "awaiting_exercise_text" | "journal_entry_text_received" | "awaiting_existing_journal_entry_description" | "awaiting_clarification"
      }

      Considere o histórico da conversa para refinar a intenção, se necessário.
    `

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [...contents, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            intent: { type: Type.STRING },
          },
          required: ['reply', 'intent'],
        },
      },
    })
    logger.info(`[ChatbotService] Resposta bruta do Gemini: ${result.text}`)

    const responseJson = JSON.parse(
      result.text ||
        '{ "reply": "Não foi possível obter uma resposta.", "intent": "general_question" }',
    )
    let replyText = responseJson.reply || 'Não foi possível obter uma resposta.'
    let intent = responseJson.intent || 'general_question'
    let clarifyingQuestions: string[] | undefined
    let proposedEntries: ProposedEntry[] | undefined // CORRIGIDO: de any[] para ProposedEntry[]

    const lastMessageRoleModel = [...conversationHistory]
      .reverse()
      .find((msg: ChatbotMessage) => msg.role === 'model')
    if (
      lastMessageRoleModel &&
      lastMessageRoleModel.content.includes(
        'me diga a descrição do lançamento que você quer validar',
      )
    ) {
      intent = 'awaiting_existing_journal_entry_description'
    }

    if (intent === 'exercise_text_received') {
      logger.info(
        `[ChatbotService] Intenção detectada: exercise_text_received. Chamando exerciseSolverService.`,
      )
      try {
        const solverResponse = await solveExercise(message)

        if ('clarifyingQuestions' in solverResponse && solverResponse.clarifyingQuestions) {
          replyText = solverResponse.message
          clarifyingQuestions = solverResponse.clarifyingQuestions
          intent = 'awaiting_clarification'
        } else if ('proposedEntries' in solverResponse && solverResponse.proposedEntries) {
          replyText = solverResponse.message
          proposedEntries = solverResponse.proposedEntries
        } else {
          replyText = 'Não foi possível processar o exercício. Tente novamente.'
          intent = 'general_question'
        }
      } catch (solverError: unknown) {
        // CORRIGIDO: de any para unknown
        logger.error({ solverError }, 'Erro ao resolver exercício no ChatbotService:')
        const message = solverError instanceof Error ? solverError.message : 'Erro desconhecido'
        replyText = `Erro ao resolver o exercício: ${message}`
        intent = 'general_question'
      }
    } else if (intent === 'awaiting_existing_journal_entry_description') {
      logger.info(
        `[ChatbotService] Intenção detectada: awaiting_existing_journal_entry_description. Buscando lançamentos existentes.`,
      )
      logger.info(`[ChatbotService] Mensagem recebida para busca: "${message}"`)
      try {
        const foundEntries: JournalEntry[] = await searchJournalEntriesByDescription(
          message,
          organization_id,
          active_accounting_period_id,
        )

        if (foundEntries.length === 1) {
          replyText = `Encontrei 1 lançamento com a descrição "${message}":\n\n${foundEntries[0].description}.\n\nÉ este o lançamento que você quer validar?`
          // A variável 'foundJournalEntry' foi removida pois não era utilizada.
          intent = 'awaiting_confirmation_for_existing_journal_entry'
        } else if (foundEntries.length > 1) {
          const entryList = foundEntries.map((entry) => `- ${entry.description}`).join('\n')
          replyText = `Encontrei ${foundEntries.length} lançamentos com a descrição "${message}":\n\n${entryList}\n\nPor favor, seja mais específico ou escolha um dos lançamentos acima.`
          intent = 'awaiting_existing_journal_entry_description'
        } else {
          replyText = `Não encontrei nenhum lançamento com a descrição "${message}". Por favor, tente outra descrição.`
          intent = 'awaiting_existing_journal_entry_description'
        }
      } catch (searchError: unknown) {
        // CORRIGIDO: de any para unknown
        logger.error({ searchError }, 'Erro ao buscar lançamentos existentes no ChatbotService:')
        const message = searchError instanceof Error ? searchError.message : 'Erro desconhecido'
        replyText = `Erro ao buscar lançamentos existentes: ${message}`
        intent = 'general_question'
      }
    } else if (intent === 'journal_entry_text_received') {
      logger.info(
        `[ChatbotService] Intenção detectada: journal_entry_text_received. Chamando journalEntryValidatorService.`,
      )
      try {
        const validationResult = await validateJournalEntry(message)
        replyText = validationResult
        intent = 'general_question'
      } catch (validationError: unknown) {
        // CORRIGIDO: de any para unknown
        logger.error({ validationError }, 'Erro ao validar lançamento no ChatbotService:')
        const message =
          validationError instanceof Error ? validationError.message : 'Erro desconhecido'
        replyText = `Erro ao validar o lançamento: ${message}`
        intent = 'general_question'
      }
    } else if (intent === 'validate_existing_journal_entry_request') {
      logger.info(
        `[ChatbotService] Intenção detectada: validate_existing_journal_entry_request. Solicitando descrição do lançamento existente.`,
      )
      replyText = 'Ok, por favor, me diga a descrição do lançamento que você quer validar.'
      intent = 'awaiting_existing_journal_entry_description'
    }

    const newConversationHistory: ChatbotMessage[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'model',
        content: msg.content,
      })),
      { role: 'user', content: message },
      { role: 'model', content: replyText },
    ]

    logger.info(`[ChatbotService] Respondendo com: "${replyText}" e intenção: ${intent}`)

    return {
      reply: replyText,
      conversationHistory: newConversationHistory,
      intent: intent,
      clarifyingQuestions: clarifyingQuestions,
      proposedEntries: proposedEntries,
    }
  } catch (error: unknown) {
    // CORRIGIDO: de any para unknown
    logger.error({ error }, 'Erro ao se comunicar com o Gemini API:')
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível obter uma resposta do assistente contábil.'
    throw new Error(message)
  }
}

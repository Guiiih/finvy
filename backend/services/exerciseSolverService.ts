import logger from '../utils/logger.js'
import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// --- Início: Interfaces para Tipagem ---

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

// Interface para a resposta JSON bruta da API Gemini
interface GeminiResponse {
  entries?: ProposedEntry[]
  clarifyingQuestions?: string[]
}

// Tipos para a resposta da função solveExercise
type SuccessResponse = {
  message: string
  proposedEntries: ProposedEntry[]
}

type ClarificationResponse = {
  message: string
  clarifyingQuestions: string[]
}

type SolveExerciseResponse = SuccessResponse | ClarificationResponse

// --- Fim: Interfaces para Tipagem ---

// Configuração do path para carregar .env da raiz
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY não está configurada para o Exercise Solver.')
  throw new Error('GEMINI_API_KEY não está configurada.')
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function solveExercise(exerciseText: string): Promise<SolveExerciseResponse> {
  // CORRIGIDO: Promise<any> -> Promise<SolveExerciseResponse>
  logger.info(`[ExerciseSolverService] Iniciando resolução de exercício.`)

  const jsonResponse = await getJsonFromGemini(exerciseText)

  if (
    jsonResponse.clarifyingQuestions &&
    Array.isArray(jsonResponse.clarifyingQuestions) &&
    jsonResponse.clarifyingQuestions.length > 0
  ) {
    logger.info(`[ExerciseSolverService] Perguntas de esclarecimento geradas.`)
    return {
      message: 'Preciso de mais informações para resolver o exercício.',
      clarifyingQuestions: jsonResponse.clarifyingQuestions,
    }
  }

  if (!jsonResponse.entries || !Array.isArray(jsonResponse.entries)) {
    throw new Error(
      'A resposta da IA não contém uma lista de lançamentos válida ou perguntas de esclarecimento.',
    )
  }

  for (const entry of jsonResponse.entries) {
    if (entry.date) {
      const dateObj = new Date(entry.date)
      entry.date = dateObj.toISOString().split('T')[0]
    }

    // CORRIGIDO: d: any -> d: TransactionLine
    const totalDebits = entry.debits.reduce((sum: number, d: TransactionLine) => sum + d.value, 0)
    // CORRIGIDO: c: any -> c: TransactionLine
    const totalCredits = entry.credits.reduce((sum: number, c: TransactionLine) => sum + c.value, 0)

    if (totalDebits.toFixed(2) !== totalCredits.toFixed(2)) {
      throw new Error(
        `Lançamento desbalanceado para a descrição "${entry.description}". Débitos: ${totalDebits}, Créditos: ${totalCredits}`,
      )
    }
  }

  logger.info(`[ExerciseSolverService] Exercício resolvido e proposta de lançamentos gerada.`)
  return {
    message: 'Proposta de lançamentos gerada com sucesso!',
    proposedEntries: jsonResponse.entries,
  }
}

async function getJsonFromGemini(exerciseText: string): Promise<GeminiResponse> {
  // CORRIGIDO: Promise<any> -> Promise<GeminiResponse>
  const prompt = `
    Você é um assistente contábil especializado no sistema contábil brasileiro.
    Sua tarefa é analisar o exercício contábil fornecido e determinar se todas as informações necessárias para criar um lançamento contábil completo estão presentes.
    As informações necessárias para um lançamento contábil completo são:
    - Data do lançamento (YYYY-MM-DD)
    - Descrição ou histórico do lançamento
    - Contas e valores para todos os débitos
    - Contas e valores para todos os créditos
    - O total dos débitos deve ser igual ao total dos créditos.
    Se todas as informações estiverem presentes e o lançamento for balanceado, retorne um objeto JSON com a chave "entries", contendo uma lista de lançamentos contábeis. Cada lançamento deve ter "date", "description", "debits" (lista de objetos {account, value}) e "credits" (lista de objetos {account, value}). A data deve ser inferida do texto ou usar a data atual se não especificada.
    Se alguma informação estiver faltando ou for ambígua para criar um lançamento completo e balanceado, retorne um objeto JSON com a chave "clarifyingQuestions", contendo uma lista de strings. Cada string deve ser uma pergunta clara e concisa para obter a informação que falta. Não inclua "entries" neste caso.
    Sempre retorne APENAS UMA das chaves: "entries" OU "clarifyingQuestions".
    Exercício: "${exerciseText}"
  `

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entries: {
              type: Type.ARRAY,
              description:
                'Lista de lançamentos contábeis extraídos do exercício, se todas as informações estiverem presentes.',
              items: {
                type: Type.OBJECT,
                properties: {
                  date: {
                    type: Type.STRING,
                    description: 'A data do lançamento no formato YYYY-MM-DD.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'A descrição ou histórico do lançamento.',
                  },
                  debits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { account: { type: Type.STRING }, value: { type: Type.NUMBER } },
                      required: ['account', 'value'],
                    },
                  },
                  credits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { account: { type: Type.STRING }, value: { type: Type.NUMBER } },
                      required: ['account', 'value'],
                    },
                  },
                },
                required: ['date', 'description', 'debits', 'credits'],
              },
            },
            clarifyingQuestions: {
              type: Type.ARRAY,
              description: 'Lista de perguntas para obter informações adicionais, se necessário.',
              items: { type: Type.STRING },
            },
          },
        },
      },
    })

    const jsonResponse = JSON.parse(result.text || '{}')
    logger.info(`[ExerciseSolverService] Resposta JSON recebida e parseada do Gemini.`)
    return jsonResponse
  } catch (error) {
    logger.error({ error }, 'Erro ao resolver exercício com Gemini API:')
    throw new Error('Não foi possível resolver o exercício contábil.')
  }
}

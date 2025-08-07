import logger from '../utils/logger.js'
import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuração do path para carregar .env da raiz
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY não está configurada para o Journal Entry Validator.')
  throw new Error('GEMINI_API_KEY não está configurada.')
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function validateJournalEntry(journalEntryDescription: string): Promise<string> {
  logger.info(`[JournalEntryValidatorService] Validando lançamento contábil.`)

  const prompt = `
    Você é um professor de contabilidade experiente e detalhista. Sua tarefa é analisar a descrição de um lançamento contábil e fornecer um feedback construtivo e detalhado.
    Seu objetivo é ajudar o usuário a entender se o lançamento está correto, completo e de acordo com os princípios contábeis.

    **Análise do Lançamento:**
    [Indique se o lançamento está CORRETO, INCOMPLETO ou INCORRETO. Explique o motivo.]

    **Feedback Detalhado:**
    [Se o lançamento estiver correto, parabenize o usuário. Se estiver incompleto, explique quais informações faltam (ex: contas de débito/crédito, valores, histórico). Se estiver incorreto, explique claramente onde o usuário errou, por que está errado e, se possível, sugira a forma correta de registrar o lançamento, com os lançamentos contábeis completos (débito e crédito).]

    Descrição do Lançamento:
    """
    ${journalEntryDescription}
    """

    Sua análise deve ser clara, didática e focada em ajudar o usuário a entender os conceitos contábeis. Use formatação Markdown para facilitar a leitura.
  `

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 2000, // Aumentar para respostas mais detalhadas
      },
    })

    const text = result.text || 'Não foi possível obter uma análise para o lançamento.'
    logger.info(`[JournalEntryValidatorService] Análise do Gemini recebida.`)
    return text
  } catch (error) {
    logger.error({ error }, 'Erro ao validar lançamento com Gemini API:')
    throw new Error('Não foi possível validar o lançamento contábil.')
  }
}

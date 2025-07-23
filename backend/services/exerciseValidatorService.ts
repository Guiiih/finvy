import logger from "../utils/logger.js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do path para carregar .env da raiz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY não está configurada para o Exercise Validator.");
  throw new Error("GEMINI_API_KEY não está configurada.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function validateExerciseSolution(
  exercise: string,
  userSolution: string,
): Promise<string> {
  logger.info(`[ExerciseValidatorService] Validando exercício.`);

  const prompt = `
    Você é um professor de contabilidade experiente e detalhista. Sua tarefa é analisar um exercício contábil e a solução proposta por um aluno.
    Forneça um feedback construtivo e detalhado, seguindo o formato abaixo:

    **Análise da Solução:**
    [Indique se a solução está CORRETA ou INCORRETA. Se incorreta, explique o motivo.]

    **Feedback Detalhado:**
    [Se a solução estiver correta, parabenize o aluno. Se houver erros, explique claramente onde o aluno errou, por que está errado e apresente a solução correta passo a passo, com os lançamentos contábeis completos (débito e crédito).] 

    Exercício:
    """
    ${exercise}
    """

    Solução do Aluno:
    """
    ${userSolution}
    """

    Sua análise deve ser clara, didática e focada em ajudar o aluno a entender os conceitos contábeis. Use formatação Markdown para facilitar a leitura.`
  ;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 2000, // Aumentar para respostas mais detalhadas
      },
    });

    const text = result.text || 'Não foi possível obter uma análise para a solução.';
    logger.info(`[ExerciseValidatorService] Análise do Gemini recebida.`);
    return text;
  } catch (error) {
    logger.error("Erro ao validar exercício com Gemini API:", error);
    throw new Error("Não foi possível validar a solução do exercício.");
  }
}

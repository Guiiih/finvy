import logger from "../utils/logger.js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Removidas as importações de services de criação, pois não serão mais feitas aqui
// import { findAccountByName } from "./accountService.js";
// import { createJournalEntry } from "./journalEntryService.js";
// import { createSimpleEntryLines } from "./entryLineService.js";

// Configuração do path para carregar .env da raiz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY não está configurada para o Exercise Solver.");
  throw new Error("GEMINI_API_KEY não está configurada.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function solveExercise(
  exerciseText: string,
  organization_id: string, // Estes parâmetros ainda são necessários para o getJsonFromGemini se o prompt precisar de contexto
  active_accounting_period_id: string, // mas não para a criação de lançamentos aqui.
  token: string,
): Promise<any> {
  logger.info(`[ExerciseSolverService] Iniciando resolução de exercício.`);

  // 1. Chamar a API do Gemini para obter a estrutura JSON
  const jsonResponse = await getJsonFromGemini(exerciseText);

  if (!jsonResponse.entries || !Array.isArray(jsonResponse.entries)) {
    throw new Error("A resposta da IA não contém uma lista de lançamentos válida.");
  }

  // 2. Validar balanço para cada lançamento proposto
  for (const entry of jsonResponse.entries) {
    const totalDebits = entry.debits.reduce((sum: number, d: any) => sum + d.value, 0);
    const totalCredits = entry.credits.reduce((sum: number, c: any) => sum + c.value, 0);

    if (totalDebits.toFixed(2) !== totalCredits.toFixed(2)) {
      throw new Error(`Lançamento desbalanceado para a descrição "${entry.description}". Débitos: ${totalDebits}, Créditos: ${totalCredits}`);
    }
  }

  logger.info(`[ExerciseSolverService] Exercício resolvido e proposta de lançamentos gerada.`);
  // Retorna a proposta de lançamentos para o frontend
  return { 
    message: "Proposta de lançamentos gerada com sucesso!",
    proposedEntries: jsonResponse.entries 
  };
}

async function getJsonFromGemini(exerciseText: string): Promise<any> {
  const prompt = `
    Você é um assistente contábil especializado no sistema contábil brasileiro.
    Sua tarefa é analisar o exercício contábil a seguir e extrair os lançamentos em formato JSON.
    O JSON deve conter uma lista de lançamentos, onde cada lançamento tem data, descrição, uma lista de débitos e uma lista de créditos.
    Cada débito e crédito deve especificar a conta e o valor.
    A data deve ser inferida do texto ou usar a data atual se não especificada.

    Exercício: "${exerciseText}"
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entries: {
              type: Type.ARRAY,
              description: "Lista de lançamentos contábeis extraídos do exercício.",
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "A data do lançamento no formato YYYY-MM-DD." },
                  description: { type: Type.STRING, description: "A descrição ou histórico do lançamento." },
                  debits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { account: { type: Type.STRING }, value: { type: Type.NUMBER } }, required: ["account", "value"] } },
                  credits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { account: { type: Type.STRING }, value: { type: Type.NUMBER } }, required: ["account", "value"] } },
                },
                required: ["date", "description", "debits", "credits"],
              },
            },
          },
          required: ["entries"],
        },
      },
    });

    const jsonResponse = JSON.parse(result.text || '{}');
    logger.info(`[ExerciseSolverService] Resposta JSON recebida e parseada do Gemini.`);
    return jsonResponse;

  } catch (error) {
    logger.error("Erro ao resolver exercício com Gemini API:", error);
    throw new Error("Não foi possível resolver o exercício contábil.");
  }
}



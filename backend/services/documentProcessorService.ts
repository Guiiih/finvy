import logger from "../utils/logger.js";
import pdf from 'pdf-parse';
import { createWorker, Worker } from 'tesseract.js';

export async function processDocument(fileBuffer: Buffer, mimetype: string): Promise<string> {
  logger.info(`[DocumentProcessorService] Processando documento com mimetype: ${mimetype}`);

  let extractedText = '';

  if (mimetype === 'application/pdf') {
    try {
      const data = await pdf(fileBuffer);
      extractedText = data.text;
      logger.info("[DocumentProcessorService] Texto extraído de PDF.");
    } catch (error) {
      logger.error("Erro ao extrair texto de PDF:", error);
      throw new Error("Não foi possível extrair texto do PDF.");
    }
  } else if (mimetype.startsWith('image/')) {
    let worker: Worker | undefined;
    try {
      worker = await createWorker();
      await worker.load();
      // A linha worker.loadLanguage('por') foi removida, pois o método não existe.
      await worker.reinitialize('por'); // Usando o método que o compilador reconhece.
      const { data: { text } } = await worker.recognize(fileBuffer);
      extractedText = text;
      logger.info("[DocumentProcessorService] Texto extraído de imagem via OCR.");
    } catch (error) {
      logger.error("Erro ao extrair texto de imagem com Tesseract.js:", error);
      throw new Error("Não foi possível extrair texto da imagem.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  } else {
    throw new Error(`Tipo de arquivo não suportado: ${mimetype}`);
  }

  return extractedText;
}
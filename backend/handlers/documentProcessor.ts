import logger from '../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../utils/supabaseClient.js'
import formidable from 'formidable'
import { processDocument } from '../services/documentProcessorService.js'
import { readFile } from 'fs/promises' // <-- Adicionado o import aqui

export const config = {
  api: {
    bodyParser: false, // Desabilita o body-parser padrão para lidar com multipart/form-data
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  logger.info(`[DocumentProcessorHandler] Recebida requisição para processar documento.`)

  if (req.method !== 'POST') {
    logger.warn(`[DocumentProcessorHandler] Método ${req.method} não permitido.`)
    res.setHeader('Allow', ['POST'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  }

  const form = formidable({
    multiples: false, // Apenas um arquivo por vez
    keepExtensions: true, // Mantém a extensão original do arquivo
    maxFileSize: 5 * 1024 * 1024, // 5MB limite de tamanho
  })

  try {
    const [, files] = await form.parse(req)
    const uploadedFile = files.file?.[0]

    if (!uploadedFile) {
      logger.warn('[DocumentProcessorHandler] Nenhum arquivo enviado.')
      return handleErrorResponse(res, 400, 'Nenhum arquivo enviado.')
    }

    logger.info(
      `[DocumentProcessorHandler] Arquivo recebido: ${uploadedFile.originalFilename} (${uploadedFile.mimetype})`,
    )

    // O formidable salva o arquivo temporariamente. Precisamos ler o conteúdo.
    // Para Vercel, o uploadedFile.filepath já é o caminho para o arquivo temporário.
    const fileBuffer = await readFile(uploadedFile.filepath) // <-- Alterado para usar a função importada

    const extractedText = await processDocument(fileBuffer, uploadedFile.mimetype || '')

    logger.info(`[DocumentProcessorHandler] Texto extraído com sucesso.`)
    return res.status(200).json({ extractedText })
  } catch (error: unknown) {
    logger.error('Erro ao processar documento:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return handleErrorResponse(
      res,
      500,
      `Erro interno do servidor ao processar documento: ${errorMessage}`,
    )
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../backend/utils/middleware.js'
import { handleErrorResponse } from '../backend/utils/supabaseClient.js'

import logger from '../backend/utils/logger.js'

import accountsHandler from '../backend/handlers/accounts.js'
import productsHandler from '../backend/handlers/products.js'
import journalEntriesHandler from '../backend/handlers/journal-entries.js'
import entryLinesHandler from '../backend/handlers/entry-lines.js'
import financialTransactionsHandler from '../backend/handlers/financial-transactions.js'
import generateReportsHandler from '../backend/handlers/reports/generate.js'
import exportReportsHandler from '../backend/handlers/reports/export.js'
import consolidatedReportsHandler from '../backend/handlers/reports/consolidated-reports.js'
import yearEndClosingHandler from '../backend/handlers/year-end-closing.js'
import profileHandler from '../backend/handlers/profile.js'
import accountingPeriodsHandler from '../backend/handlers/accounting-periods.js'
import userOrganizationRolesHandler from '../backend/handlers/user-organization-roles.js'
import sharingHandler from '../backend/handlers/sharing.js'
import usersHandler from '../backend/handlers/users.js'
import organizationsHandler from '../backend/handlers/organizations.js'
import swaggerDocsHandler from '../backend/handlers/swagger-docs.js'
import nfeImportHandler from '../backend/handlers/nfe-import.js'
import taxRegimeHistoryHandler from '../backend/handlers/tax-regime-history.js'
import chatbotHandler from '../backend/handlers/chatbot.js'
import exerciseSolverHandler from '../backend/handlers/exerciseSolver.js'
import journalEntryValidatorHandler from '../backend/handlers/journalEntryValidator.js'
import confirmJournalEntryHandler from '../backend/handlers/confirmJournalEntryHandler.js'
import documentProcessorHandler from '../backend/handlers/documentProcessor.js'
import { getNotifications, markNotificationAsRead } from '../backend/handlers/notifications.js'
import { updateUserPresence, getOnlineUsers } from '../backend/handlers/user-presence.js'

// This handler contains the logic for protected routes
async function protectedRoutesHandler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  // Extract path from URL, remove /api prefix
  const fullUrl = String(req.url || '') // Explicitly convert to string
  if (!fullUrl) {
    logger.error('[API Router] req.url é indefinido ou vazio.')
    return handleErrorResponse(res, 400, 'URL da requisição ausente.')
  }
  const urlPath = fullUrl.split('?')[0]
  const finalUrlPath = urlPath.startsWith('/api') ? urlPath.substring(4) : urlPath

  logger.info(`[API Router] Roteando o pedido protegido para: ${req.method} ${finalUrlPath}`)

  if (finalUrlPath.startsWith('/accounts')) {
    return accountsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/products')) {
    return productsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/journal-entries')) {
    return journalEntriesHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/entry-lines')) {
    return entryLinesHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/financial-transactions')) {
    return financialTransactionsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/reports/generate')) {
    return generateReportsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/reports/export')) {
    return exportReportsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/reports/consolidated')) {
    return consolidatedReportsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/year-end-closing')) {
    return yearEndClosingHandler(req, res)
  }
  if (finalUrlPath.startsWith('/profile')) {
    return profileHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/accounting-periods')) {
    return accountingPeriodsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/user-organization-roles')) {
    return userOrganizationRolesHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/sharing')) {
    return sharingHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/users')) {
    return usersHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/organizations')) {
    return organizationsHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/nfe-import')) {
    return nfeImportHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/tax-regime-history')) {
    return taxRegimeHistoryHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/chatbot')) {
    return chatbotHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/exercise-solver')) {
    return exerciseSolverHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/journal-entry-validator')) {
    return journalEntryValidatorHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/confirm-journal-entries')) {
    return confirmJournalEntryHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/document-processor')) {
    return documentProcessorHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/user-presence')) {
    if (req.method === 'POST') {
      return updateUserPresence(req, res, user_id, token)
    }
    if (req.method === 'GET') {
      return getOnlineUsers(req, res, user_id, token)
    }
  }
  if (finalUrlPath.startsWith('/notifications')) {
    if (req.method === 'GET') {
      return getNotifications(req, res, user_id)
    }
    if (req.method === 'PUT' && finalUrlPath.endsWith('/read')) {
      const notificationId = finalUrlPath.split('/')[2]; // Extract ID from /notifications/:id/read
      return markNotificationAsRead(req, res, user_id, notificationId)
    }
  }

  return handleErrorResponse(res, 404, 'Endpoint protegido não encontrado.')
}

// Main entry point for the serverless function
export default async function (req: VercelRequest, res: VercelResponse) {
  const fullUrl = String(req.url || '')
  if (!fullUrl) {
    logger.error('[API Router] req.url é indefinido ou vazio.')
    return handleErrorResponse(res, 400, 'URL da requisição ausente.')
  }

  const urlPath = fullUrl.split('?')[0]
  if (!urlPath) {
    logger.error('[API Router] urlPath é indefinido ou vazio após split.')
    return handleErrorResponse(res, 400, 'Caminho da URL inválido.')
  }

  logger.info(`[API Router] Roteando o pedido para: ${req.method} ${urlPath}`)

  // Rota para a documentação da API (não protegida por autenticação)
  if (urlPath === '/api/docs') {
    return await swaggerDocsHandler(req, res)
  }

  // Para todas as outras rotas /api, aplicar o middleware de autenticação
  if (urlPath.startsWith('/api/')) {
    return await withAuth(protectedRoutesHandler)(req, res)
  }

  // Fallback para quaisquer outras requisições que possam passar
  return handleErrorResponse(res, 404, 'Endpoint não encontrado.')
}

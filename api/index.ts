console.log('Forcing backend rebuild')
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../backend/utils/middleware.js'
import { handleErrorResponse } from '../backend/utils/supabaseClient.js'

import logger from '../backend/utils/logger.js'

import accountsHandler from '../backend/handlers/financial/accounts.js'
import productsHandler from '../backend/handlers/financial/products.js'
import journalEntriesHandler from '../backend/handlers/accounting/journal-entries.js'
import entryLinesHandler from '../backend/handlers/accounting/entry-lines.js'
import financialTransactionsHandler from '../backend/handlers/financial/financial-transactions.js'
import generateReportsHandler from '../backend/handlers/reports/generate.js'
import exportReportsHandler from '../backend/handlers/reports/export.js'
import consolidatedReportsHandler from '../backend/handlers/reports/consolidated-reports.js'
import yearEndClosingHandler from '../backend/handlers/accounting/year-end-closing.js'
import profileHandler from '../backend/handlers/users/profile.js'
import accountingPeriodsHandler from '../backend/handlers/accounting/accounting-periods.js'
import userOrganizationRolesHandler from '../backend/handlers/users/user-organization-roles.js'
import sharingHandler from '../backend/handlers/users/sharing.js'
import usersHandler from '../backend/handlers/users/users.js'
import organizationsHandler from '../backend/handlers/users/organizations.js'
import nfeImportHandler from '../backend/handlers/tax/nfe-import.js'
import taxRegimeHistoryHandler from '../backend/handlers/tax/tax-regime-history.js'
import chatbotHandler from '../backend/handlers/ai/chatbot.js'
import exerciseSolverHandler from '../backend/handlers/ai/exerciseSolver.js'
import journalEntryValidatorHandler from '../backend/handlers/ai/journalEntryValidator.js'
import confirmJournalEntryHandler from '../backend/handlers/accounting/confirmJournalEntryHandler.js'
import documentProcessorHandler from '../backend/handlers/ai/documentProcessor.js'
import {
  getNotifications,
  markNotificationAsRead,
} from '../backend/handlers/system/notifications.js'
import { updateUserPresence, getOnlineUsers } from '../backend/handlers/users/user-presence.js'
import referenceGeneratorHandler from '../backend/handlers/system/referenceGenerator.js'
import { getJournalEntryHistory } from '../backend/handlers/system/journal-entry-history.js'
import { calculateFiscalTaxesHandler } from '../backend/handlers/tax/tax-calculation.js'

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
    if (req.method === 'GET' && finalUrlPath.includes('/history')) {
      const entryId = finalUrlPath.split('/')[2]
      return getJournalEntryHistory(req, res, entryId)
    }
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
    return journalEntryValidatorHandler(req, res)
  }
  if (finalUrlPath.startsWith('/confirm-journal-entries')) {
    return confirmJournalEntryHandler(req, res, user_id, token)
  }
  if (finalUrlPath.startsWith('/document-processor')) {
    return documentProcessorHandler(req, res)
  }
  if (finalUrlPath.startsWith('/user-presence')) {
    if (req.method === 'POST') {
      return updateUserPresence(req, res, user_id, token)
    }
    if (req.method === 'GET') {
      return getOnlineUsers(req, res)
    }
  }
  if (finalUrlPath.startsWith('/notifications')) {
    if (req.method === 'GET') {
      return getNotifications(req, res, user_id)
    }
    if (req.method === 'PUT' && finalUrlPath.endsWith('/read')) {
      const notificationId = finalUrlPath.split('/')[2] // Extract ID from /notifications/:id/read
      return markNotificationAsRead(req, res, user_id, notificationId)
    }
  }
  if (finalUrlPath.startsWith('/generate-reference')) {
    return referenceGeneratorHandler(req, res)
  }
  if (finalUrlPath.startsWith('/calculate-fiscal-taxes')) {
    return calculateFiscalTaxesHandler(req, res)
  }

  return handleErrorResponse(res, 404, 'Endpoint protegido não encontrado.')
}

// Main entry point for the serverless function
export default withAuth(protectedRoutesHandler)

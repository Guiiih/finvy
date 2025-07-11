import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../backend/utils/middleware.js";
import { handleErrorResponse } from "../backend/utils/supabaseClient.js";

import logger from "../backend/utils/logger.js";

import accountsHandler from "../backend/handlers/accounts.js";
import productsHandler from "../backend/handlers/products.js";
import journalEntriesHandler from "../backend/handlers/journal-entries.js";
import entryLinesHandler from "../backend/handlers/entry-lines.js";
import financialTransactionsHandler from "../backend/handlers/financial-transactions.js";
import generateReportsHandler from "../backend/handlers/reports/generate.js";
import exportReportsHandler from "../backend/handlers/reports/export.js";
import consolidatedReportsHandler from "../backend/handlers/reports/consolidated-reports.js";
import yearEndClosingHandler from "../backend/handlers/year-end-closing.js";
import profileHandler from "../backend/handlers/profile.js";
import accountingPeriodsHandler from "../backend/handlers/accounting-periods.js";
import userOrganizationRolesHandler from "../backend/handlers/user-organization-roles.js";
import sharingHandler from "../backend/handlers/sharing.js";
import usersHandler from "../backend/handlers/users.js";
import organizationsHandler from "../backend/handlers/organizations.js";

// This handler contains the logic for protected routes
async function protectedRoutesHandler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  // Extract path from URL, remove /api prefix
  const fullUrl = String(req.url || ""); // Explicitly convert to string
  if (!fullUrl) {
    logger.error("[API Router] req.url é indefinido ou vazio.");
    return handleErrorResponse(res, 400, "URL da requisição ausente.");
  }
  const urlPath = fullUrl.split("?")[0];
  const finalUrlPath = urlPath.startsWith("/api")
    ? urlPath.substring(4)
    : urlPath;

  logger.info(
    `[API Router] Roteando o pedido protegido para: ${req.method} ${finalUrlPath}`,
  );

  if (finalUrlPath.startsWith("/accounts")) {
    return accountsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/products")) {
    return productsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/journal-entries")) {
    return journalEntriesHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/entry-lines")) {
    return entryLinesHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/financial-transactions")) {
    return financialTransactionsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/reports/generate")) {
    return generateReportsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/reports/export")) {
    return exportReportsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/reports/consolidated")) {
    return consolidatedReportsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/year-end-closing")) {
    return yearEndClosingHandler(req, res);
  }
  if (finalUrlPath.startsWith("/profile")) {
    return profileHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/accounting-periods")) {
    return accountingPeriodsHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/user-organization-roles")) {
    return userOrganizationRolesHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/sharing")) {
    return sharingHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/users")) {
    return usersHandler(req, res, user_id, token);
  }
  if (finalUrlPath.startsWith("/organizations")) {
    return organizationsHandler(req, res, user_id, token);
  }

  return handleErrorResponse(res, 404, "Endpoint protegido não encontrado.");
}

// Main entry point for the serverless function
export default async function (req: VercelRequest, res: VercelResponse) {
  const fullUrl = String(req.url || "");
  if (!fullUrl) {
    logger.error("[API Router] req.url é indefinido ou vazio.");
    return handleErrorResponse(res, 400, "URL da requisição ausente.");
  }

  const urlPath = fullUrl.split("?")[0];
  if (!urlPath) {
    logger.error("[API Router] urlPath é indefinido ou vazio após split.");
    return handleErrorResponse(res, 400, "Caminho da URL inválido.");
  }

  const finalUrlPath = urlPath.startsWith("/api")
    ? urlPath.substring(4)
    : urlPath;
  logger.info(`[API Router] Roteando o pedido para: ${req.method} ${urlPath}`);

  // For all other /api routes, apply the authentication middleware
  if (urlPath.startsWith("/api/")) {
    return await withAuth(protectedRoutesHandler)(req, res);
  }

  // Fallback for any other requests that might slip through
  return handleErrorResponse(res, 404, "Endpoint não encontrado.");
}

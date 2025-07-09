
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express"; // Import express
import { withAuth } from "../backend/utils/middleware.js";
import { handleErrorResponse } from "../backend/utils/supabaseClient.js";
import { swaggerUi, specs } from "../backend/swagger.js";

import logger from "../backend/utils/logger.js";

import accountsHandler from "../backend/handlers/accounts.js";
import productsHandler from "../backend/handlers/products.js";
import journalEntriesHandler from "../backend/handlers/journal-entries.js";
import entryLinesHandler from "../backend/handlers/entry-lines.js";
import financialTransactionsHandler from "../backend/handlers/financial-transactions.js";
import generateReportsHandler from "../backend/handlers/reports/generate.js";
import exportReportsHandler from "../backend/handlers/reports/export.js";
import yearEndClosingHandler from "../backend/handlers/year-end-closing.js";
import profileHandler from "../backend/handlers/profile.js";

// This handler contains the logic for protected routes
async function protectedRoutesHandler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string,
) {
  // Extract path from URL, remove /api prefix
  const url = (req.url || "").split("?")[0];
  const urlPath = url.startsWith("/api") ? url.substring(4) : url;

  logger.info(`[API Router] Roteando o pedido protegido para: ${req.method} ${urlPath}`);

  if (urlPath.startsWith("/accounts")) {
    return accountsHandler(req, res, user_id, token, user_role);
  }
  if (urlPath.startsWith("/products")) {
    return productsHandler(req, res, user_id, token, user_role);
  }
  if (urlPath.startsWith("/journal-entries")) {
    return journalEntriesHandler(req, res, user_id, token, user_role);
  }
  if (urlPath.startsWith("/entry-lines")) {
    return entryLinesHandler(req, res, user_id, token);
  }
  if (urlPath.startsWith("/financial-transactions")) {
    return financialTransactionsHandler(req, res, user_id, token);
  }
  if (urlPath.startsWith("/reports/generate")) {
    return generateReportsHandler(req, res, user_id, token);
  }
  if (urlPath.startsWith("/reports/export")) {
    return exportReportsHandler(req, res, user_id, token);
  }
  if (urlPath.startsWith("/year-end-closing")) {
    return yearEndClosingHandler(req, res, user_id);
  }
  if (urlPath.startsWith("/profile")) {
    return profileHandler(req, res, user_id, token);
  }

  return handleErrorResponse(res, 404, "Endpoint protegido não encontrado.");
}

// Main entry point for the serverless function
export default async function (req: VercelRequest, res: VercelResponse) {
  const urlPath = (req.url || "").split("?")[0];
  logger.info(`[API Router] Roteando o pedido para: ${req.method} ${urlPath}`);

  // Handle /api/docs.json directly
  if (urlPath === "/api/docs.json") {
    return res.setHeader("Content-Type", "application/json").send(specs);
  }

  // Handle /api/docs (Swagger UI)
  if (urlPath.startsWith("/api/docs")) {
    const swaggerOptions = {
      swaggerUrl: '/api/docs.json', // Explicitly tell Swagger UI where to find the specs
      explorer: true, // Enable the search bar
      customSiteTitle: "Finvy API Documentation",
    };

    const tempApp = express();
    tempApp.use('/', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

    const subPath = urlPath.substring("/api/docs".length);
    req.url = subPath || '/'; // Set req.url for the tempApp

    return tempApp(req, res);
  }

  // For all other /api routes, apply the authentication middleware
  if (urlPath.startsWith("/api/")) {
    return await withAuth(protectedRoutesHandler)(req, res);
  }

  // Fallback for any other requests that might slip through
  return handleErrorResponse(res, 404, "Endpoint não encontrado.");
}

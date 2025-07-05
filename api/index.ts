import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../backend/utils/middleware.js";
import { handleErrorResponse } from "../backend/utils/supabaseClient.js";

import accountsHandler from "../backend/handlers/accounts.js";
import productsHandler from "../backend/handlers/products.js";
import journalEntriesHandler from "../backend/handlers/journal-entries.js";
import entryLinesHandler from "../backend/handlers/entry-lines.js";
import financialTransactionsHandler from "../backend/handlers/financial-transactions.js";
import generateReportsHandler from "../backend/handlers/reports/generate.js";
import exportReportsHandler from "../backend/handlers/reports/export.js";
import yearEndClosingHandler from "../backend/handlers/year-end-closing.js";
import profileHandler from "../backend/handlers/profile.js";

async function mainHandler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string,
) {
  const path = req.query.path as string | string[] | undefined;
  const urlPath = `/${Array.isArray(path) ? path.join("/") : path || ""}`;

  console.log(`[API Router] Roteando o pedido para: ${req.method} ${urlPath}`);

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

  return handleErrorResponse(res, 404, "Endpoint não encontrado.");
}

export default withAuth(mainHandler);
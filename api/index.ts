import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../backend/utils/middleware.js";
import { handleErrorResponse } from "../backend/utils/supabaseClient.js";

// Importe todos os seus handlers da pasta /handlers
import accountsHandler from "../backend/handlers/accounts.js";
import productsHandler from "../backend/handlers/products.js";
import journalEntriesHandler from "../backend/handlers/journal-entries.js";
import entryLinesHandler from "../backend/handlers/entry-lines.js";
import financialTransactionsHandler from "../backend/handlers/financial-transactions.js";
import generateReportsHandler from "../backend/handlers/reports/generate.js";
import yearEndClosingHandler from "../backend/handlers/year-end-closing.js";

/**
 * O handler principal que atua como um router.
 * Ele recebe todos os pedidos para /api/* e os direciona para o handler correto.
 * O middleware withAuth já garantiu que há um utilizador autenticado.
 */
async function mainHandler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
) {
  // A Vercel coloca o caminho do URL (ex: "products" ou "accounts/123") no parâmetro de consulta "path"
  // devido à regra de reescrita { "source": "/api/:path*", "destination": "/api/index" }
  const path = req.query.path as string | string[] | undefined;
  const urlPath = `/${Array.isArray(path) ? path.join("/") : path || ""}`;

  console.log(`[API Router] Roteando o pedido para: ${req.method} ${urlPath}`);

  // Roteamento baseado no início do caminho do URL
  if (urlPath.startsWith("/accounts")) {
    return accountsHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/products")) {
    return productsHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/journal-entries")) {
    return journalEntriesHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/entry-lines")) {
    return entryLinesHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/financial-transactions")) {
    return financialTransactionsHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/reports/generate")) {
    return generateReportsHandler(req, res, user_id);
  }

  if (urlPath.startsWith("/year-end-closing")) {
    return yearEndClosingHandler(req, res, user_id);
  }

  // Se nenhuma rota corresponder, retorna um erro 404
  return handleErrorResponse(res, 404, "Endpoint não encontrado.");
}

// Envolvemos o nosso router principal com o middleware de autenticação.
// A função withAuth tratará do CORS e da verificação do token antes de chamar o mainHandler.
export default withAuth(mainHandler);

import type { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { handleErrorResponse } from "../utils/supabaseClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const swaggerPath = path.join(__dirname, "../swagger-output.json");
    const swaggerDoc = fs.readFileSync(swaggerPath, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(swaggerDoc);
  } catch (error) {
    return handleErrorResponse(res, 500, "Erro ao carregar a documentação da API.");
  }
}

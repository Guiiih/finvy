import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finvy Backend API",
      version: "1.0.0",
      description: "Documentação da API do backend Finvy, gerada automaticamente com Swagger/OpenAPI.",
    },
    servers: [
      {
        url: "/api", // Base URL para as rotas da API
        description: "Servidor de Desenvolvimento/Produção",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [path.join(__dirname, "./handlers/**/*.ts")], // Caminho para os arquivos de handler
};

const specs = swaggerJsdoc(options);

// Salvar a especificação em um arquivo JSON
import fs from "fs";
fs.writeFileSync(path.join(__dirname, "swagger-output.json"), JSON.stringify(specs, null, 2));

console.log("Documentação Swagger gerada em backend/swagger-output.json");

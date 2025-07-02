import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // Configuração para ignorar ficheiros e diretórios
  {
    ignores: [
      "node_modules/",
      "dist/",
      "frontend/", // Ignorar o diretório frontend, pois ele tem sua própria configuração
      "supabase/",
      "*.js",
      "*.cjs",
      "*.mjs",
    ],
  },
  // Configurações recomendadas do ESLint e TypeScript
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // Configuração para integração com Prettier
  prettierConfig,
  // Configuração específica para ficheiros TypeScript do backend
  {
    files: ["api/**/*.ts", "handlers/**/*.ts", "utils/**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        project: ["./tsconfig.json"], // Certifique-se de que tsconfig.json existe e está configurado
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
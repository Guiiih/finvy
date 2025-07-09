import { z } from "zod";

export const uuidSchema = z
  .string()
  .uuid({ message: "ID inválido. Deve ser um UUID válido." });

export const idSchema = z.object({
  id: z.string().uuid({ message: "ID inválido. Deve ser um UUID válido." }),
});

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Nome da conta é obrigatório.")
    .max(100, "Nome da conta muito longo."),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"], {
    message: "Tipo de conta inválido.",
  }),
  parent_account_id: z
    .string()
    .uuid({ message: "ID da conta pai inválido. Deve ser um UUID válido." })
    .optional()
    .nullable(),
});

export const updateAccountSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome da conta é obrigatório.")
      .max(100, "Nome da conta muito longo.")
      .optional(),
    type: z
      .enum(["asset", "liability", "equity", "revenue", "expense"], {
        message: "Tipo de conta inválido.",
      })
      .optional(),
    parent_account_id: z
      .string()
      .uuid({ message: "ID da conta pai inválido. Deve ser um UUID válido." })
      .optional()
      .nullable(),
  })
  .partial();

export const createJournalEntrySchema = z.object({
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD."),
  description: z
    .string()
    .min(1, "Descrição é obrigatória.")
    .max(255, "Descrição muito longa."),
});

export const updateJournalEntrySchema = z
  .object({
    entry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD.")
      .optional(),
    description: z
      .string()
      .min(1, "Descrição é obrigatória.")
      .max(255, "Descrição muito longa.")
      .optional(),
  })
  .partial();

export const createEntryLineSchema = z
  .object({
    journal_entry_id: z
      .string()
      .uuid({ message: "Journal Entry ID inválido. Deve ser um UUID válido." }),
    account_id: z
      .string()
      .uuid({ message: "Account ID inválido. Deve ser um UUID válido." }),
    debit: z
      .number()
      .nonnegative("Débito deve ser um valor não negativo.")
      .nullable()
      .optional(),
    credit: z
      .number()
      .nonnegative("Crédito deve ser um valor não negativo.")
      .nullable()
      .optional(),
    product_id: z
      .string()
      .uuid({ message: "Product ID inválido. Deve ser um UUID válido." })
      .optional(),
    quantity: z
      .number()
      .int()
      .nonnegative("Quantidade deve ser um número inteiro não negativo.")
      .optional(),
    unit_cost: z
      .number()
      .nonnegative("Custo unitário deve ser um valor não negativo.")
      .optional(),
    total_gross: z
      .number()
      .nonnegative("Valor total bruto deve ser um valor não negativo.")
      .optional(),
    icms_rate: z
      .number()
      .nonnegative("Alíquota de ICMS deve ser um valor não negativo.")
      .optional(),
    ipi_rate: z
      .number()
      .nonnegative("Alíquota de IPI deve ser um valor não negativo.")
      .optional(),
    pis_rate: z
      .number()
      .nonnegative("Alíquota de PIS deve ser um valor não negativo.")
      .optional(),
    cofins_rate: z
      .number()
      .nonnegative("Alíquota de COFINS deve ser um valor não negativo.")
      .optional(),
    mva_rate: z
      .number()
      .nonnegative("Alíquota de MVA deve ser um valor não negativo.")
      .optional(),
    icms_st_value: z
      .number()
      .nonnegative("Valor do ICMS-ST deve ser um valor não negativo.")
      .optional(),
    ipi_value: z
      .number()
      .nonnegative("Valor do IPI deve ser um valor não negativo.")
      .optional(),
    pis_value: z
      .number()
      .nonnegative("Valor do PIS deve ser um valor não negativo.")
      .optional(),
    cofins_value: z
      .number()
      .nonnegative("Valor do COFINS deve ser um valor não negativo.")
      .optional(),
    total_net: z
      .number()
      .nonnegative("Valor total líquido deve ser um valor não negativo.")
      .nullable()
      .optional(),
    transaction_type: z
      .enum(["sale", "purchase"], {
        message: "Tipo de transação inválido. Deve ser 'sale' ou 'purchase'.",
      })
      .optional(),
  })
  .refine((data) => data.debit !== undefined || data.credit !== undefined, {
    message: "Pelo menos um dos campos (debit ou credit) é obrigatório.",
    path: ["debit", "credit"],
  });

export const updateEntryLineSchema = z
  .object({
    account_id: z
      .string()
      .uuid({ message: "Account ID inválido. Deve ser um UUID válido." })
      .optional(),
    debit: z
      .number()
      .nonnegative("Débito deve ser um valor não negativo.")
      .nullable()
      .optional(),
    credit: z
      .number()
      .nonnegative("Crédito deve ser um valor não negativo.")
      .nullable()
      .optional(),
    product_id: z
      .string()
      .uuid({ message: "Product ID inválido. Deve ser um UUID válido." })
      .optional(),
    quantity: z
      .number()
      .int()
      .nonnegative("Quantidade deve ser um número inteiro não negativo.")
      .optional(),
    unit_cost: z
      .number()
      .nonnegative("Custo unitário deve ser um valor não negativo.")
      .optional(),
    total_gross: z
      .number()
      .nonnegative("Valor total bruto deve ser um valor não negativo.")
      .optional(),
    icms_value: z
      .number()
      .nonnegative("Valor do ICMS deve ser um valor não negativo.")
      .optional(),
    total_net: z
      .number()
      .nonnegative("Valor total líquido deve ser um valor não negativo.")
      .optional(),
  })
  .partial();

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do produto é obrigatório.")
    .max(100, "Nome do produto muito longo."),
  description: z.string().max(255, "Descrição muito longa.").optional(),
  unit_cost: z
    .number()
    .nonnegative("Custo unitário deve ser um valor não negativo."),
  current_stock: z
    .number()
    .int()
    .nonnegative("Estoque atual deve ser um número inteiro não negativo."),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome do produto é obrigatório.")
      .max(100, "Nome do produto muito longo.")
      .optional(),
    description: z.string().max(255, "Descrição muito longa.").optional(),
    icms_rate: z
      .number()
      .nonnegative("Alíquota de ICMS deve ser um valor não negativo.")
      .optional(),
  })
  .partial();

export const createAccountsPayableSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória.")
    .max(255, "Descrição muito longa."),
  amount: z.number().nonnegative("Valor deve ser não negativo."),
  due_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de vencimento inválido. Use YYYY-MM-DD.",
    ),
  paid_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de pagamento inválido. Use YYYY-MM-DD.",
    )
    .optional()
    .nullable(),
  is_paid: z.boolean().optional(),
});

export const updateAccountsPayableSchema =
  createAccountsPayableSchema.partial();

export const createAccountsReceivableSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória.")
    .max(255, "Descrição muito longa."),
  amount: z.number().nonnegative("Valor deve ser não negativo."),
  due_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de vencimento inválido. Use YYYY-MM-DD.",
    ),
  received_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de recebimento inválido. Use YYYY-MM-DD.",
    )
    .optional()
    .nullable(),
  is_received: z.boolean().optional(),
});

export const updateAccountsReceivableSchema =
  createAccountsReceivableSchema.partial();

export const createFinancialTransactionSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória.")
    .max(255, "Descrição muito longa."),
  amount: z.number().nonnegative("Valor deve ser não negativo."),
  due_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de vencimento inválido. Use YYYY-MM-DD.",
    ),
  paid_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de pagamento inválido. Use YYYY-MM-DD.",
    )
    .optional()
    .nullable(),
  received_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de recebimento inválido. Use YYYY-MM-DD.",
    )
    .optional()
    .nullable(),
  is_paid: z.boolean().optional(),
  is_received: z.boolean().optional(),
});

export const updateFinancialTransactionSchema =
  createFinancialTransactionSchema.partial();

export const yearEndClosingSchema = z.object({
  closingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD."),
});

export const reportQuerySchema = z.object({
  startDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de início inválido. Use YYYY-MM-DD.",
    )
    .optional(),
  endDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de fim inválido. Use YYYY-MM-DD.",
    )
    .optional(),
});

export const exportReportSchema = z.object({
  reportType: z.enum(["trialBalance", "dre", "balanceSheet", "ledgerDetails"], {
    message: "Tipo de relatório inválido.",
  }),
  startDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de início inválido. Use YYYY-MM-DD.",
    )
    .optional(),
  endDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de fim inválido. Use YYYY-MM-DD.",
    )
    .optional(),
  format: z.enum(["xlsx", "csv", "pdf"], {
    message: "Formato de exportação inválido.",
  }),
});

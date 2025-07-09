import { describe, it, expect } from "vitest";
import { calculateTrialBalance } from "./reportService";
import type { Account, JournalEntry } from "../../frontend/src/types";

describe("reportService", () => {
  describe("calculateTrialBalance", () => {
    it("deve calcular o balancete de verificação corretamente", () => {
      const accounts: Account[] = [
        { id: "1", name: "Caixa", type: "Ativo Circulante", code: 101 },
        {
          id: "2",
          name: "Fornecedores",
          type: "Passivo Circulante",
          code: 201,
        },
        { id: "3", name: "Receita de Vendas", type: "Receita", code: 301 },
        { id: "4", name: "Despesas com Salários", type: "Despesa", code: 401 },
      ];

      const journalEntries: JournalEntry[] = [
        {
          id: "e1",
          entry_date: "2025-07-15",
          description: "Venda a vista",
          lines: [
            { account_id: "1", debit: 1000, credit: 0 },
            { account_id: "3", debit: 0, credit: 1000 },
          ],
        },
        {
          id: "e2",
          entry_date: "2025-07-16",
          description: "Pagamento de salário",
          lines: [
            { account_id: "4", debit: 300, credit: 0 },
            { account_id: "1", debit: 0, credit: 300 },
          ],
        },
      ];

      const result = calculateTrialBalance(accounts, journalEntries);

      const caixaAccount = result.find((a) => a.accountName === "Caixa");
      const fornecedoresAccount = result.find(
        (a) => a.accountName === "Fornecedores",
      );
      const receitaAccount = result.find(
        (a) => a.accountName === "Receita de Vendas",
      );
      const despesaAccount = result.find(
        (a) => a.accountName === "Despesas com Salários",
      );

      expect(caixaAccount?.finalBalance).toBe(700);

      expect(fornecedoresAccount?.finalBalance).toBe(0);

      expect(receitaAccount?.finalBalance).toBe(1000);

      expect(despesaAccount?.finalBalance).toBe(300);
    });

    it("deve calcular o DRE corretamente", () => {
      const accounts: Account[] = [
        { id: "3", name: "Receita de Vendas", type: "Receita", code: 301 },
        { id: "4", name: "Despesas com Salários", type: "Despesa", code: 401 },
        {
          id: "5",
          name: "Custo da Mercadoria Vendida",
          type: "Despesa",
          code: 402,
        },
      ];

      const journalEntries: JournalEntry[] = [
        {
          id: "e1",
          entry_date: "2025-07-15",
          description: "Venda",
          lines: [{ account_id: "3", debit: 0, credit: 1000 }],
        },
        {
          id: "e2",
          entry_date: "2025-07-16",
          description: "Salários",
          lines: [{ account_id: "4", debit: 300, credit: 0 }],
        },
        {
          id: "e3",
          entry_date: "2025-07-17",
          description: "CMV",
          lines: [{ account_id: "5", debit: 200, credit: 0 }],
        },
      ];

      const { calculateDreData } = await import("./reportService");
      const result = calculateDreData(accounts, journalEntries);

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalExpenses).toBe(500);
      expect(result.netIncome).toBe(500);
    });

    it("deve calcular o Balanço Patrimonial corretamente", () => {
      const accounts: Account[] = [
        { id: "1", name: "Caixa", type: "Ativo Circulante", code: 101 },
        { id: "2", name: "Fornecedores", type: "Passivo", code: 201 },
        {
          id: "6",
          name: "Capital Social",
          type: "Patrimônio Líquido",
          code: 302,
        },
      ];

      const journalEntries: JournalEntry[] = [
        {
          id: "e1",
          entry_date: "2025-07-15",
          description: "Capital Inicial",
          lines: [
            { account_id: "1", debit: 5000, credit: 0 },
            { account_id: "6", debit: 0, credit: 5000 },
          ],
        },
        {
          id: "e2",
          entry_date: "2025-07-16",
          description: "Compra a prazo",
          lines: [
            { account_id: "1", debit: 0, credit: 1000 },
            { account_id: "2", debit: 0, credit: 1000 },
          ],
        },
      ];

      const { calculateBalanceSheetData } = await import("./reportService");
      const result = calculateBalanceSheetData(accounts, journalEntries);

      expect(result.totalAssets).toBe(4000);
      expect(result.totalLiabilities).toBe(1000);
      expect(result.totalEquity).toBe(5000);
      expect(result.isBalanced).toBe(true);
    });

    it("deve calcular os detalhes do Razão corretamente", () => {
      const accounts: Account[] = [
        { id: "1", name: "Caixa", type: "Ativo Circulante", code: 101 },
        { id: "3", name: "Receita de Vendas", type: "Receita", code: 301 },
      ];

      const journalEntries: JournalEntry[] = [
        {
          id: "e1",
          entry_date: "2025-07-15",
          description: "Venda a vista",
          lines: [
            { account_id: "1", debit: 1000, credit: 0 },
            { account_id: "3", debit: 0, credit: 1000 },
          ],
        },
        {
          id: "e2",
          entry_date: "2025-07-16",
          description: "Recebimento",
          lines: [
            { account_id: "1", debit: 500, credit: 0 },
            { account_id: "3", debit: 0, credit: 500 },
          ],
        },
      ];

      const { calculateLedgerDetails } = await import("./reportService");
      const result = calculateLedgerDetails(accounts, journalEntries);

      expect(result["1"]).toHaveLength(2);
      expect(result["1"][0]).toEqual({
        journalEntryId: "e1",
        entryDate: "2025-07-15",
        description: "Venda a vista",
        debit: 1000,
        credit: 0,
      });
      expect(result["3"]).toHaveLength(2);
      expect(result["3"][1]).toEqual({
        journalEntryId: "e2",
        entryDate: "2025-07-16",
        description: "Recebimento",
        debit: 0,
        credit: 500,
      });
    });
  });
});

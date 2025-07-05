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
  });
});
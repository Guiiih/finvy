<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import type { JournalEntry, EntryLine } from '@/types/index';

// Stores necessários
const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();

// Computed para calcular os saldos do razão (reutilizando lógica similar ao LedgerView)
const ledgerAccounts = computed(() => {
  const accountsMap = new Map<string, {
    accountId: string;
    accountName: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    debits: number;
    credits: number;
    nature: 'debit' | 'credit';
    finalBalance: number;
  }>();

  // Inicializar todas as contas
  accountStore.getAllAccounts.forEach(account => {
    accountsMap.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      type: account.type,
      debits: 0,
      credits: 0,
      nature: account.nature,
      finalBalance: 0,
    });
  });

  // Processar cada lançamento para somar débitos e créditos
  journalEntryStore.getAllJournalEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const accountData = accountsMap.get(line.accountId);
      if (accountData) {
        if (line.type === 'debit') {
          accountData.debits += line.amount;
        } else {
          accountData.credits += line.amount;
        }
      }
    });
  });

  // Calcular o saldo final para cada conta
  accountsMap.forEach(accountData => {
    if (accountData.nature === 'debit') {
      accountData.finalBalance = accountData.debits - accountData.credits;
    } else { // nature === 'credit'
      accountData.finalBalance = accountData.credits - accountData.debits;
    }
  });

  return accountsMap;
});

// Computed para calcular os valores da DRE
const dreData = computed(() => {
  const accounts = ledgerAccounts.value;

  const getAccountBalance = (name: string) => {
    const account = Array.from(accounts.values()).find(acc => acc.accountName === name);
    return account ? account.finalBalance : 0;
  };

  // 1. Receita Bruta de Vendas
  const receitaBrutaVendas = getAccountBalance('Receita de Vendas');

  // 2. (-) Deduções da Receita Bruta
  // ICMS sobre Vendas é uma dedução da receita (Natureza Débito no accountStore)
  const icmsSobreVendas = Math.abs(getAccountBalance('ICMS sobre Vendas')); // Usar Math.abs pois o saldo será negativo se for débito
  const deducoesReceitaBruta = icmsSobreVendas; // Pode incluir outras como vendas canceladas, descontos

  // 3. (=) Receita Líquida de Vendas
  const receitaLiquidaVendas = receitaBrutaVendas - deducoesReceitaBruta;

  // 4. (-) Custo da Mercadoria Vendida (CMV)
  const cmv = Math.abs(getAccountBalance('Custo da Mercadoria Vendida')); // Usar Math.abs pois é uma despesa (débito)

  // 5. (=) Lucro Bruto
  const lucroBruto = receitaLiquidaVendas - cmv;

  // TO-DO: Adicionar Despesas Operacionais, Receitas Financeiras, Despesas Financeiras
  // Por enquanto, vamos para o Lucro Líquido com o que temos

  // 6. Lucro Líquido do Exercício (Simplificado para agora)
  const lucroLiquido = lucroBruto; // Por enquanto, o Lucro Bruto é o Lucro Líquido

  return {
    receitaBrutaVendas,
    deducoesReceitaBruta,
    receitaLiquidaVendas,
    cmv,
    lucroBruto,
    lucroLiquido,
  };
});
</script>

<template>
  <div class="dre-container">
    <h1>Demonstração de Resultado do Exercício (DRE)</h1>

    <p v-if="journalEntryStore.getAllJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar a DRE.
    </p>

    <div v-else class="dre-report">
      <div class="dre-section header">
        <span>Descrição</span>
        <span>Valor (R$)</span>
      </div>

      <div class="dre-line">
        <span class="description">Receita Bruta de Vendas</span>
        <span class="value">{{ dreData.receitaBrutaVendas.toFixed(2) }}</span>
      </div>

      <div class="dre-line deduction">
        <span class="description">(-) Deduções da Receita Bruta (ICMS sobre Vendas)</span>
        <span class="value">({{ dreData.deducoesReceitaBruta.toFixed(2) }})</span>
      </div>

      <div class="dre-line subtotal">
        <span class="description">(=) Receita Líquida de Vendas</span>
        <span class="value">{{ dreData.receitaLiquidaVendas.toFixed(2) }}</span>
      </div>

      <div class="dre-line cost">
        <span class="description">(-) Custo da Mercadoria Vendida (CMV)</span>
        <span class="value">({{ dreData.cmv.toFixed(2) }})</span>
      </div>

      <div class="dre-line total">
        <span class="description">(=) Lucro Bruto</span>
        <span class="value">{{ dreData.lucroBruto.toFixed(2) }}</span>
      </div>

      <div class="dre-line final-result">
        <span class="description">(=) Lucro Líquido do Exercício</span>
        <span class="value">{{ dreData.lucroLiquido.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dre-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.no-entries-message {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 50px;
}

.dre-report {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.dre-section.header {
  display: grid;
  grid-template-columns: 3fr 1fr;
  font-weight: bold;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.dre-line {
  display: grid;
  grid-template-columns: 3fr 1fr;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  align-items: center;
}

.dre-line:last-of-type {
  border-bottom: none;
}

.description {
  padding-left: 10px;
}

.value {
  text-align: right;
  padding-right: 10px;
  font-weight: 500;
}

.deduction .value, .cost .value {
  color: #dc3545; /* Red for deductions/costs */
}

.subtotal, .total, .final-result {
  font-weight: bold;
  border-top: 1px solid #ccc;
  margin-top: 10px;
  padding-top: 10px;
}

.final-result {
  border-top: 2px solid #333;
  margin-top: 15px;
  padding-top: 15px;
  font-size: 1.2rem;
  color: #28a745; /* Green for profit */
}
</style>
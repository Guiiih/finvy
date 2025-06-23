<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types/index';

const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();

const allJournalEntries = computed(() => journalEntryStore.getAllJournalEntries);
const allAccounts = computed(() => accountStore.getAllAccounts);

// Funções auxiliares para obter total de débitos/créditos de uma conta,
// EXCLUINDO lançamentos de apuração para a DRE.
const getAccountTotalDebits = (accountId: string) => {
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração')) // Exclui lançamentos de apuração
    .flatMap(entry => entry.lines)
    .filter(line => line.accountId === accountId && line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0);
};

const getAccountTotalCredits = (accountId: string) => {
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração')) // Exclui lançamentos de apuração
    .flatMap(entry => entry.lines)
    .filter(line => line.accountId === accountId && line.type === 'credit')
    .reduce((sum, line) => sum + line.amount, 0);
};


const dreData = computed(() => {
  let grossRevenueFromSales = 0;
  let deductionsFromGrossRevenue = 0;
  let netSalesRevenue = 0;
  let costOfGoodsSold = 0;
  let grossProfit = 0;
  let netIncome = 0; // Para a DRE simplificada, netIncome é igual ao grossProfit por enquanto

  // 1. Receita Bruta de Vendas (contas de receita, natureza crédito)
  const revenueAccounts = allAccounts.value.filter(acc => acc.type === 'revenue' && acc.nature === 'credit');
  revenueAccounts.forEach(account => {
    // Para contas de receita (natureza crédito), os créditos aumentam e os débitos diminuem.
    // Excluímos aqui o ICMS sobre Vendas e Descontos, pois são deduções e serão tratados abaixo.
    if (account.name !== 'ICMS sobre Vendas' && account.name !== 'Descontos Concedidos') {
      const totalCredits = getAccountTotalCredits(account.id);
      const totalDebits = getAccountTotalDebits(account.id);
      grossRevenueFromSales += (totalCredits - totalDebits);
    }
  });

  // 2. Deduções da Receita Bruta (ex: ICMS sobre Vendas, Descontos Concedidos)
  // Contas que são deduções de receita geralmente têm natureza devedora e diminuem a receita bruta
  const deductionsAccounts = allAccounts.value.filter(acc => 
    (acc.name === 'ICMS sobre Vendas' || acc.name === 'Descontos Concedidos')
  );
  deductionsAccounts.forEach(account => {
    // Para contas de dedução (como ICMS sobre Vendas, que acumula débitos), o débito aumenta a dedução.
    const totalDebits = getAccountTotalDebits(account.id);
    const totalCredits = getAccountTotalCredits(account.id); // Créditos diminuem a dedução
    deductionsFromGrossRevenue += (totalDebits - totalCredits);
  });
  
  netSalesRevenue = grossRevenueFromSales - deductionsFromGrossRevenue;

  // 3. Custo da Mercadoria Vendida (CMV)
  // CMV é uma conta de despesa, natureza devedora
  const cmvAccount1 = accountStore.getAccountByName('CMV'); // CMV duplicada (se o usuário a mantém)

  if (cmvAccount1) {
    costOfGoodsSold += (getAccountTotalDebits(cmvAccount1.id) - getAccountTotalCredits(cmvAccount1.id));
  }

  // Resultado Bruto
  grossProfit = netSalesRevenue - costOfGoodsSold;

  // Por enquanto, o Lucro Líquido é o mesmo que o Lucro Bruto para esta DRE simplificada.
  // Em uma DRE completa, teríamos despesas operacionais, financeiras, etc.
  netIncome = grossProfit; 

  return {
    grossRevenueFromSales,
    deductionsFromGrossRevenue,
    netSalesRevenue,
    costOfGoodsSold,
    grossProfit,
    netIncome,
  };
});
</script>

<template>
  <div class="dre-container">
    <h1>Demonstração de Resultado do Exercício (DRE)</h1>

    <p v-if="allJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado ainda. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar a DRE.
    </p>

    <div v-else class="dre-table">
      <div class="dre-row header-row">
        <div class="description">Receita Bruta de Vendas</div>
        <div class="amount">R$ {{ dreData.grossRevenueFromSales.toFixed(2) }}</div>
      </div>

      <div class="dre-row sub-header-row">
        <div class="description">(-) Deduções da Receita Bruta</div>
        <div class="amount">R$ {{ dreData.deductionsFromGrossRevenue.toFixed(2) }}</div>
      </div>

      <div class="dre-row total-row">
        <div class="description">Receita Líquida de Vendas</div>
        <div class="amount">R$ {{ dreData.netSalesRevenue.toFixed(2) }}</div>
      </div>

      <div class="dre-row sub-header-row">
        <div class="description">(-) Custo da Mercadoria Vendida (CMV)</div>
        <div class="amount">R$ {{ dreData.costOfGoodsSold.toFixed(2) }}</div>
      </div>

      <div class="dre-row total-row gross-profit-row">
        <div class="description">Lucro Bruto</div>
        <div class="amount">R$ {{ dreData.grossProfit.toFixed(2) }}</div>
      </div>

      <div class="dre-row total-row net-income-row">
        <div class="description">Lucro Líquido do Exercício</div>
        <div class="amount">R$ {{ dreData.netIncome.toFixed(2) }}</div>
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
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.dre-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.dre-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  font-size: 1rem;
}

.dre-row:last-child {
  border-bottom: none;
}

.dre-row .description {
  flex: 1;
  color: #333;
}

.dre-row .amount {
  width: 150px;
  text-align: right;
  font-weight: bold;
  color: #007bff; /* Cor padrão para valores */
}

.header-row {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #222;
  border-bottom: 2px solid #ccc;
}

.sub-header-row {
  background-color: #f8f8f8;
  font-style: italic;
  color: #555;
}

.total-row {
  background-color: #e9ecef;
  font-weight: bold;
  border-top: 1px solid #ccc;
  border-bottom: 2px solid #ccc;
}

.gross-profit-row .amount {
  color: #28a745; /* Verde para lucro bruto */
}

.net-income-row {
  background-color: #d4edda; /* Fundo verde claro para lucro líquido */
  font-size: 1.1rem;
}

.net-income-row .amount {
  color: #28a745; /* Verde escuro para lucro líquido */
}
</style>
<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import type { JournalEntry, EntryLine, Account, LedgerAccount } from '@/types/index';

// Stores necessários
const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();

// Getter para todos os lançamentos
const allJournalEntries = computed(() => journalEntryStore.getAllJournalEntries);
const allAccounts = computed(() => accountStore.getAllAccounts);

// Definir uma ordem personalizada para as contas
const customAccountOrder = new Map<string, number>();
// Ordem baseada nas imagens fornecidas e nos nomes das contas do accountStore.ts
customAccountOrder.set('Capital Social Subscrito', 1);
customAccountOrder.set('Capital Social a Integralizar', 2);
customAccountOrder.set('Caixa Econômica Federal', 3);
customAccountOrder.set('Móveis e Utensílios', 4);
customAccountOrder.set('Compras de Mercadoria', 5);
customAccountOrder.set('Fornecedores', 6);
customAccountOrder.set('Caixa', 7);
customAccountOrder.set('Banco Itaú', 8);
customAccountOrder.set('Banco Bradesco', 9);
customAccountOrder.set('Receita de Vendas', 10);
customAccountOrder.set('Clientes', 11);
customAccountOrder.set('ICMS sobre Compras', 12);
customAccountOrder.set('ICMS sobre Vendas', 13);
customAccountOrder.set('C/C ICMS (Zerada)', 14);
customAccountOrder.set('ICMS a Recuperar', 14);
customAccountOrder.set('ICMS a Recolher', 14);
customAccountOrder.set('CMV', 15);
customAccountOrder.set('Custo da Mercadoria Vendida', 16);
customAccountOrder.set('Resultado Bruto', 17); // Adicionado na ordem
customAccountOrder.set('Reserva de Lucro', 18);
customAccountOrder.set('Salários a Pagar', 19);
customAccountOrder.set('Despesas com Salários', 20);
customAccountOrder.set('Impostos a Pagar', 21);
customAccountOrder.set('ICMS Antecipado', 22);


// Funções auxiliares locais para calcular totais, filtrando 'Apuração'
const getLocalAccountTotalDebits = (accountId: string) => {
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração')) // Exclui lançamentos de apuração
    .flatMap(entry => entry.lines)
    .filter(line => line.accountId === accountId && line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0);
};

const getLocalAccountTotalCredits = (accountId: string) => {
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração')) // Exclui lançamentos de apuração
    .flatMap(entry => entry.lines)
    .filter(line => line.accountId === accountId && line.type === 'credit')
    .reduce((sum, line) => sum + line.amount, 0);
};


// Computed para calcular os saldos detalhados do razão
const ledgerAccounts = computed(() => {
  const accountsMap = new Map<string, {
    accountId: string;
    accountName: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    nature: 'debit' | 'credit';
    debitEntries: number[];
    creditEntries: number[];
    totalDebits: number;
    totalCredits: number;
    finalBalance: number;
  }>();

  allAccounts.value.forEach(account => {
    accountsMap.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      type: account.type,
      nature: account.nature,
      debitEntries: [],
      creditEntries: [],
      totalDebits: 0,
      totalCredits: 0,
      finalBalance: 0,
    });
  });

  allJournalEntries.value.forEach(entry => {
    entry.lines.forEach(line => {
      const accountData = accountsMap.get(line.accountId);
      if (accountData) {
        // Excluir lançamentos que vão para 'Resultado Bruto' para não duplicar,
        // já que 'Resultado Bruto' é calculado virtualmente.
        if (line.accountId !== accountStore.getAccountByName('Resultado Bruto')?.id) {
            if (line.type === 'debit') {
              accountData.debitEntries.push(line.amount);
              accountData.totalDebits += line.amount;
            } else {
              accountData.creditEntries.push(line.amount);
              accountData.totalCredits += line.amount;
            }
        }
      }
    });
  });

  accountsMap.forEach(accountData => {
    if (accountData.nature === 'debit') {
      accountData.finalBalance = accountData.totalDebits - accountData.totalCredits;
    } else { // nature === 'credit'
      accountData.finalBalance = accountData.totalCredits - accountData.totalDebits; 
    }

    if (accountData.accountId === '23') { // ID da conta C/C ICMS
      if (accountData.finalBalance > 0) {
        accountData.accountName = 'ICMS a Recuperar';
      } else if (accountData.finalBalance < 0) {
        accountData.accountName = 'ICMS a Recolher';
      } else {
        accountData.accountName = 'C/C ICMS (Zerada)';
      }
    }
  });

  // --- Calcular e Popular a Conta "Resultado Bruto" Virtualmente ---
  const resultadoBrutoAccount = accountsMap.get(accountStore.getAccountByName('Resultado Bruto')?.id || '');
  if (resultadoBrutoAccount) {
    let grossRevenueFromSales = 0;
    const revenueAccounts = allAccounts.value.filter(acc => acc.type === 'revenue' && acc.nature === 'credit' && acc.name !== 'ICMS sobre Vendas' && acc.name !== 'Descontos Concedidos');
    revenueAccounts.forEach(account => {
      grossRevenueFromSales += (getLocalAccountTotalCredits(account.id) - getLocalAccountTotalDebits(account.id));
    });

    let deductionsFromGrossRevenue = 0;
    const deductionsAccounts = allAccounts.value.filter(acc => (acc.name === 'ICMS sobre Vendas' || acc.name === 'Descontos Concedidos'));
    deductionsAccounts.forEach(account => {
      deductionsFromGrossRevenue += (getLocalAccountTotalDebits(account.id) - getLocalAccountTotalCredits(account.id));
    });

    const netSalesRevenue = grossRevenueFromSales - deductionsFromGrossRevenue;

    let costOfGoodsSold = 0;
    const cmvAccount1 = accountStore.getAccountByName('Custo da Mercadoria Vendida');
    const cmvAccount2 = accountStore.getAccountByName('CMV');
    if (cmvAccount1) {
      costOfGoodsSold += (getLocalAccountTotalDebits(cmvAccount1.id) - getLocalAccountTotalCredits(cmvAccount1.id));
    }
    if (cmvAccount2) {
      costOfGoodsSold += (getLocalAccountTotalDebits(cmvAccount2.id) - getLocalAccountTotalCredits(cmvAccount2.id));
    }

    const calculatedGrossProfit = netSalesRevenue - costOfGoodsSold; // Este é o Resultado Bruto

    // Populando as entradas virtuais para o T-account com os componentes
    resultadoBrutoAccount.debitEntries = [costOfGoodsSold]; // CMV (Débito)
    resultadoBrutoAccount.creditEntries = [netSalesRevenue]; // Receita Líquida (Crédito)
    
    // Total de débitos e créditos para "Resultado Bruto" (reflete a Receita Líquida e o CMV)
    resultadoBrutoAccount.totalDebits = costOfGoodsSold; 
    resultadoBrutoAccount.totalCredits = netSalesRevenue; 
    resultadoBrutoAccount.finalBalance = calculatedGrossProfit; // Saldo final é o Lucro Bruto
  }
  // --- Fim da Lógica "Resultado Bruto" Virtual ---


  // Filtrar apenas as contas que possuem movimentos E ordenar pela ordem personalizada
  return Array.from(accountsMap.values())
    .filter(account => account.totalDebits > 0 || account.totalCredits > 0)
    .sort((a, b) => {
      const orderA = customAccountOrder.get(a.accountName) || Infinity;
      const orderB = customAccountOrder.get(b.accountName) || Infinity;
      return orderA - orderB;
    });
});

const getBalanceClass = (account: any) => {
  if (account.finalBalance === 0) {
    return '';
  }

  if (account.finalBalance > 0) {
    return account.nature === 'debit' ? 'positive' : 'positive';
  } else { // finalBalance < 0
    return account.nature === 'debit' ? 'negative' : 'negative';
  }
};
</script>

<template>
  <div class="ledger-container">
    <h1>Razão (Ledger)</h1>

    <p v-if="allJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado ainda. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para ver o Razão.
    </p>

    <div v-else class="ledger-accounts-grid">
      <div v-for="account in ledgerAccounts" :key="account.accountId" class="ledger-card">
        <h3>{{ account.accountName }}</h3>
        <div class="ledger-content">
            <div class="t-account-wrapper">
                <div class="t-side debit-side"> 
                    <ul>
                        <li v-for="(amount, index) in account.debitEntries" :key="index">R$ {{ amount.toFixed(2) }}</li>
                    </ul>
                </div>
                <div class="t-side credit-side">
                    <ul>
                        <li v-for="(amount, index) in account.creditEntries" :key="index">R$ {{ amount.toFixed(2) }}</li>
                    </ul>
                </div>
            </div>
            
            <div class="totals-row">
                <div class="total-debits-sum">R$ {{ account.totalDebits.toFixed(2) }}</div>
                <div class="total-credits-sum">R$ {{ account.totalCredits.toFixed(2) }}</div>
            </div>

            <div class="final-balance-row">
                <div class="final-balance-left" 
                     :class="getBalanceClass(account)"
                     v-if="(account.finalBalance !== 0) && 
                           ((account.nature === 'debit' && account.finalBalance >= 0) || 
                            (account.nature === 'credit' && account.finalBalance < 0))">
                    R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div class="final-balance-left" v-else></div> 

                <div class="final-balance-right" 
                     :class="getBalanceClass(account)"
                     v-if="(account.finalBalance !== 0) && 
                           ((account.nature === 'credit' && account.finalBalance >= 0) || 
                            (account.nature === 'debit' && account.finalBalance < 0))">
                    R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div class="final-balance-right" v-else></div> 
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ledger-container {
  padding: 20px;
  max-width: 1200px;
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

.ledger-accounts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); 
  gap: 25px;
}

.ledger-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ledger-card h3 {
  background-color: #f8f8f8;
  padding: 10px 15px;
  text-align: center;
  color: #444;
  margin: 0;
  font-size: 1.1rem;
  border-bottom: 1px solid #e0e0e0;
}

.ledger-content {
    position: relative;
    flex-grow: 1;
    padding-bottom: 10px;
}

.ledger-content::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: #e0e0e0;
    transform: translateX(-50%);
}

.t-account-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
    margin-bottom: 5px;
}

.t-side {
  padding: 5px 15px;
  text-align: center;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.t-side ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.t-side li {
  padding: 2px 0;
  font-size: 0.95rem;
  color: #333;
}

.t-side h4 {
  display: none;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  border-bottom: none;
  padding: 8px 15px;
  background-color: #f0f0f0;
}

.total-debits-sum, .total-credits-sum {
  flex: 1;
  text-align: left;
}

.total-credits-sum {
  text-align: right;
}

.total-debits-sum { color: #28a745; }
.total-credits-sum { color: #007bff; }

.final-balance-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 15px;
  font-size: 1.1rem;
  font-weight: bold;
}

.final-balance-left {
    flex: 1;
    text-align: left;
}

.final-balance-right {
    flex: 1;
    text-align: right;
}

.final-balance-row .positive {
  color: #28a745;
}

.final-balance-row .negative {
  color: #dc3545;
}
</style>
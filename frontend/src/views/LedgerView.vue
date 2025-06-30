<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useReportStore } from '@/stores/reportStore';
import { useJournalEntryStore } from '@/stores/journalEntryStore';

const reportStore = useReportStore();
const journalEntryStore = useJournalEntryStore();

const ledgerAccounts = computed(() => reportStore.ledgerAccounts.filter(account => account.finalBalance !== 0));

function getBalanceClass(account: any) {
  if (account.finalBalance === 0) {
    return '';
  }

  // Special cases for specific accounts that might not follow standard nature rules
  if (account.accountName === 'Resultado Bruto') {
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  }

  if (account.accountName === 'Estoque Final') {
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  }
  
  if (account.accountName === 'CMV') {
      return account.finalBalance > 0 ? 'positive' : '';
  }

  if (account.accountName === 'Reserva de Lucro') {
      return account.finalBalance >= 0 ? 'positive' : 'negative';
  }

  // Determine normal balance nature based on account type
  const isDebitNature = ['asset', 'expense'].includes(account.type);

  if (isDebitNature) {
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  } else { // Credit nature (liability, equity, revenue)
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  }
}

onMounted(async () => {
  await reportStore.fetchReports();
  await journalEntryStore.fetchJournalEntries();
});
</script>

<template>
  <div class="ledger-container">
    <h1>Razão (Ledger)</h1>

    <p v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado ainda. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para ver o Razão.
    </p>

    <div v-else class="ledger-accounts-grid">
      <div v-for="account in ledgerAccounts" :key="account.accountId" class="ledger-card">
        <h3>{{ account.accountName }}</h3>
        <div class="ledger-content">
            <div class="t-account-wrapper">
                <div class="t-side debit-side">
                    <ul>
                        <li v-for="(amount, index) in account.debitEntries" :key="index">
                            <span v-if="account.accountName === 'CMV' && index === 0"></span>
                            <span v-else></span>
                            R$ {{ amount.toFixed(2) }}
                        </li>
                    </ul>
                </div>
                <div class="t-side credit-side">
                    <ul>
                        <li v-for="(amount, index) in account.creditEntries" :key="index">
                            <span v-if="account.accountName === 'CMV' && index === 0"></span>
                            <span v-else></span>
                            R$ {{ amount.toFixed(2) }}
                        </li>
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
                           ((['asset', 'expense'].includes(account.type) && account.finalBalance >= 0) ||
                            (!['asset', 'expense'].includes(account.type) && account.finalBalance < 0)) ||
                           (account.accountName === 'Resultado Bruto' && account.finalBalance < 0) ||
                           (account.accountName === 'Estoque Final' && account.finalBalance >= 0) ||
                           (account.accountName === 'CMV' && account.finalBalance >= 0) ||
                           (account.accountName === 'Reserva de Lucro' && account.finalBalance < 0)"> R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div class="final-balance-left" v-else></div>

                <div class="final-balance-right"
                     :class="getBalanceClass(account)"
                     v-if="(account.finalBalance !== 0) &&
                           ((!['asset', 'expense'].includes(account.type) && account.finalBalance >= 0) ||
                            (account.accountName === 'Resultado Bruto' && account.finalBalance >= 0) ||
                            (account.accountName === 'Estoque Final' && account.finalBalance < 0) ||
                            (account.accountName === 'CMV' && account.finalBalance < 0) ||
                            (account.accountName === 'Reserva de Lucro' && account.finalBalance >= 0) ||
                            (['asset', 'expense'].includes(account.type) && account.finalBalance < 0))"> R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.t-side li span:first-child {
    font-size: 0.85em;
    color: #666;
    margin-right: 5px;
    text-align: left;
    flex-grow: 1;
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
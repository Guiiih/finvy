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

// Computed para calcular os saldos detalhados do razão
const ledgerAccounts = computed(() => {
  const accountsMap = new Map<string, {
    accountId: string;
    accountName: string;
    nature: 'debit' | 'credit';
    debitEntries: number[]; // Lista de valores de débito
    creditEntries: number[]; // Lista de valores de crédito
    totalDebits: number; // Soma total dos débitos
    totalCredits: number; // Soma total dos créditos
    finalBalance: number; // Saldo final
  }>();

  // Inicializar todas as contas com listas vazias para os movimentos
  allAccounts.value.forEach(account => {
    accountsMap.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      nature: account.nature,
      debitEntries: [],
      creditEntries: [],
      totalDebits: 0,
      totalCredits: 0,
      finalBalance: 0,
    });
  });

  // Processar cada lançamento para registrar e somar débitos e créditos
  allJournalEntries.value.forEach(entry => {
    entry.lines.forEach(line => {
      const accountData = accountsMap.get(line.accountId);
      if (accountData) {
        if (line.type === 'debit') { // Se a linha do lançamento é um DÉBITO
          accountData.debitEntries.push(line.amount); // Adiciona ao lado dos débitos
          accountData.totalDebits += line.amount;
        } else { // Se a linha do lançamento é um CRÉDITO
          accountData.creditEntries.push(line.amount); // Adiciona ao lado dos créditos
          accountData.totalCredits += line.amount;
        }
      }
    });
  });

  // Calcular o saldo final para cada conta
  accountsMap.forEach(accountData => {
    if (accountData.nature === 'debit') {
      accountData.finalBalance = accountData.totalDebits - accountData.totalCredits;
    } else { // nature === 'credit'
      accountData.finalBalance = accountData.totalCredits - accountData.totalDebits;
    }
  });

  // Converter o mapa de volta para um array para renderização
  return Array.from(accountsMap.values()).sort((a, b) => a.accountName.localeCompare(b.accountName));
});

// Computed para obter o nome da conta dinamicamente para C/C ICMS
const getDynamicAccountName = (account: any) => { // Use 'any' aqui ou LedgerAccount se tiver certeza do tipo
  if (account.accountName === 'C/C ICMS') {
    if (account.finalBalance > 0) { // Saldo credor (positivo para natureza 'credit')
      return 'ICMS a Recolher';
    } else if (account.finalBalance < 0) { // Saldo devedor (negativo para natureza 'credit', ou positivo para natureza 'debit')
      return 'ICMS a Recuperar';
    }
  }
  return account.accountName; // Retorna o nome normal para outras contas ou saldo zero
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
        <h3>{{ getDynamicAccountName(account) }}</h3>
        <div class="t-account-wrapper">
            <div class="t-account-header"></div> <div class="t-side debit-side">
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
            <div class="final-balance-left" :class="{ 'positive': account.finalBalance > 0 && account.nature === 'debit', 'negative': account.finalBalance < 0 && account.nature === 'credit' }">
                <span v-if="(account.finalBalance > 0 && account.nature === 'debit') || (account.finalBalance < 0 && account.nature === 'credit')">
                    R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </span>
            </div>
            <div class="final-balance-right" :class="{ 'positive': account.finalBalance > 0 && account.nature === 'credit', 'negative': account.finalBalance < 0 && account.nature === 'debit' }">
                <span v-if="(account.finalBalance > 0 && account.nature === 'credit') || (account.finalBalance < 0 && account.nature === 'debit')">
                    R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </span>
            </div>
        </div>
        <div class="final-balance-nature">
             ({{ account.finalBalance >= 0 ? account.nature === 'debit' ? 'D' : 'C' : account.nature === 'debit' ? 'C' : 'D' }})
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  justify-content: center;
}

.ledger-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 0;
  display: flex;
  flex-direction: column;
  width: 300px;
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

.t-account-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    border-bottom: 1px solid #e0e0e0;
    position: relative;
}

.t-account-wrapper::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: #e0e0e0;
    transform: translateX(-50%);
}

.t-side {
  padding: 5px 15px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.t-side ul {
  list-style: none;
  padding: 0;
  margin: 0;
  min-height: 50px;
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
  border-bottom: 1px solid #e0e0e0;
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
    color: #007bff;
}

.final-balance-nature {
    text-align: center;
    font-size: 0.9em;
    padding-bottom: 10px;
    color: #666;
}

.final-balance-row .positive {
  color: #28a745;
}

.final-balance-row .negative {
  color: #dc3545;
}
</style>
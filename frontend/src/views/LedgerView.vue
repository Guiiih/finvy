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
        if (line.type === 'debit') {
          accountData.debitEntries.push(line.amount);
          accountData.totalDebits += line.amount;
        } else {
          accountData.creditEntries.push(line.amount);
          accountData.totalCredits += line.amount;
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

  return Array.from(accountsMap.values()).sort((a, b) => a.accountName.localeCompare(b.accountName));
});

const getBalanceClass = (account: any) => {
  if (account.finalBalance === 0) {
    return '';
  }

  // A cor 'positive' é para o saldo na sua natureza. A 'negative' é para o saldo na natureza oposta.
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
  border-bottom: none; /* CORRIGIDO: Explicita a remoção da borda inferior */ 
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
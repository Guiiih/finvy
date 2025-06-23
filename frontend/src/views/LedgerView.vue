<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import { useStockControlStore } from '@/stores/stockControlStore';
import { useProductStore } from '@/stores/productStore';
import type { JournalEntry, EntryLine, Account, LedgerAccount } from '@/types/index';

// Stores necessários
const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const stockControlStore = useStockControlStore();
const productStore = useProductStore();

// Getter para todos os lançamentos
const allJournalEntries = computed(() => journalEntryStore.getAllJournalEntries);
const allAccounts = computed(() => accountStore.getAllAccounts);

// Definir uma ordem personalizada para as contas
const customAccountOrder = new Map<string, number>();
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
customAccountOrder.set('Resultado Bruto', 16); // Ajustado para ser antes de Reserva de Lucro
customAccountOrder.set('Reserva de Lucro', 17); // Ordem para Reserva de Lucro
customAccountOrder.set('Salários a Pagar', 18);
customAccountOrder.set('Despesas com Salários', 19);
customAccountOrder.set('Impostos a Pagar', 20);
customAccountOrder.set('ICMS Antecipado', 21);
customAccountOrder.set('Estoque Final', 22);


// Funções auxiliares locais para calcular totais, filtrando 'Apuração'
const getLocalAccountTotalDebits = (accountId: string) => {
  if (!allJournalEntries.value) return 0;
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração'))
    .flatMap(entry => entry.lines)
    .filter(line => line.accountId === accountId && line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0);
};

const getLocalAccountTotalCredits = (accountId: string) => {
  if (!allJournalEntries.value) return 0;
  return allJournalEntries.value
    .filter(entry => !entry.description.includes('Apuração'))
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

  if (!allAccounts.value) return [];

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

  if (allJournalEntries.value) {
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
  }

  accountsMap.forEach(accountData => {
    const accountDetails = allAccounts.value.find(acc => acc.id === accountData.accountId);
    if (accountDetails) {
        if (accountDetails.nature === 'debit') {
            accountData.finalBalance = accountData.totalDebits - accountData.totalCredits;
        } else {
            accountData.finalBalance = accountData.totalCredits - accountData.totalDebits;
        }

        if (accountData.accountId === accountStore.getAccountByName('C/C ICMS')?.id) {
            if (accountData.finalBalance > 0) {
                accountData.accountName = 'ICMS a Recuperar';
            } else if (accountData.finalBalance < 0) {
                accountData.accountName = 'ICMS a Recolher';
            } else {
                accountData.accountName = 'C/C ICMS (Zerada)';
            }
        }
    }
  });


  // Populate 'Estoque Final' from Stock Control (needs to happen before CMV calculation)
  const estoqueFinalAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');
  const produtoXId = productStore.products ? productStore.getProductByName('Produto X')?.id : undefined;

  if (estoqueFinalAccount && produtoXId) {
    const productXBalance = stockControlStore.getBalanceByProductId(produtoXId);

    if (productXBalance) {
      estoqueFinalAccount.debitEntries = [];
      estoqueFinalAccount.creditEntries = [];
      estoqueFinalAccount.totalDebits = 0;
      estoqueFinalAccount.totalCredits = 0;

      estoqueFinalAccount.debitEntries.push(productXBalance.totalValue);
      estoqueFinalAccount.totalDebits = productXBalance.totalValue;
      estoqueFinalAccount.finalBalance = productXBalance.totalValue;
    } else {
      estoqueFinalAccount.debitEntries = [];
      estoqueFinalAccount.creditEntries = [];
      estoqueFinalAccount.totalDebits = 0;
      estoqueFinalAccount.totalCredits = 0;
      estoqueFinalAccount.finalBalance = 0;
    }
  } else if (estoqueFinalAccount) {
    estoqueFinalAccount.debitEntries = [];
    estoqueFinalAccount.creditEntries = [];
    estoqueFinalAccount.totalDebits = 0;
    estoqueFinalAccount.totalCredits = 0;
    estoqueFinalAccount.finalBalance = 0;
  }

  // --- Calculate CMV based on FinalBalance of Compras de Mercadoria and Estoque Final ---
  const cmvAccount = accountsMap.get(accountStore.getAccountByName('CMV')?.id || '');
  const comprasDeMercadoriaAccount = accountsMap.get(accountStore.getAccountByName('Compras de Mercadoria')?.id || '');
  const currentEstoqueFinalAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');


  if (cmvAccount && comprasDeMercadoriaAccount && currentEstoqueFinalAccount) {
    const estoqueDisponivelParaVenda = comprasDeMercadoriaAccount.finalBalance;
    const estoqueFinal = currentEstoqueFinalAccount.finalBalance;

    let cmvCalculado = estoqueDisponivelParaVenda - estoqueFinal;

    if (cmvCalculado < 0) {
      cmvCalculado = 0;
    }

    cmvAccount.debitEntries = [];
    cmvAccount.creditEntries = [];
    cmvAccount.totalDebits = 0;
    cmvAccount.totalCredits = 0;


    // INJETAR OS VALORES E LABELS VIRTUAIS
    if (estoqueDisponivelParaVenda > 0) {
        cmvAccount.debitEntries.push(estoqueDisponivelParaVenda);
        cmvAccount.totalDebits += estoqueDisponivelParaVenda;
    }

    if (estoqueFinal > 0) {
        cmvAccount.creditEntries.push(estoqueFinal);
        cmvAccount.totalCredits += estoqueFinal;
    }
    
    cmvAccount.finalBalance = cmvCalculado;
  }

  // --- Calcular e Popular a Conta "Resultado Bruto" Virtualmente ---
  const resultadoBrutoAccount = accountsMap.get(accountStore.getAccountByName('Resultado Bruto')?.id || '');
  if (resultadoBrutoAccount) {
    resultadoBrutoAccount.debitEntries = [];
    resultadoBrutoAccount.creditEntries = [];
    resultadoBrutoAccount.totalDebits = 0;
    resultadoBrutoAccount.totalCredits = 0;

    const receitaVendasContaObj = accountsMap.get(accountStore.getAccountByName('Receita de Vendas')?.id || '');
    const netSalesRevenue = receitaVendasContaObj ? receitaVendasContaObj.finalBalance : 0;

    let costOfGoodsSold = cmvAccount ? cmvAccount.finalBalance : 0;

    const calculatedGrossProfit = netSalesRevenue - costOfGoodsSold;

    if (netSalesRevenue > 0) {
        resultadoBrutoAccount.creditEntries.push(netSalesRevenue);
        resultadoBrutoAccount.totalCredits = netSalesRevenue;
    }
    if (costOfGoodsSold > 0) {
        resultadoBrutoAccount.debitEntries.push(costOfGoodsSold);
        resultadoBrutoAccount.totalDebits = costOfGoodsSold;
    }

    resultadoBrutoAccount.finalBalance = calculatedGrossProfit;
  }
  
  // --- NEW: Lógica para "Reserva de Lucro" - injetando o valor do Resultado Bruto ---
  const reservaDeLucroAccount = accountsMap.get(accountStore.getAccountByName('Reserva de Lucro')?.id || '');
  if (reservaDeLucroAccount) {
      // Limpa entradas existentes
      reservaDeLucroAccount.debitEntries = [];
      reservaDeLucroAccount.creditEntries = [];
      reservaDeLucroAccount.totalDebits = 0;
      reservaDeLucroAccount.totalCredits = 0;

      // Pega o lucro/prejuízo bruto do Resultado Bruto
      const lucroBruto = resultadoBrutoAccount ? resultadoBrutoAccount.finalBalance : 0;

      if (lucroBruto > 0) {
          // Se o Resultado Bruto é lucro, ele vai para a Reserva de Lucro como CRÉDITO
          reservaDeLucroAccount.creditEntries.push(lucroBruto);
          reservaDeLucroAccount.totalCredits = lucroBruto;
          reservaDeLucroAccount.finalBalance = lucroBruto; // Saldo credor para PL
      } else if (lucroBruto < 0) {
          // Se o Resultado Bruto é prejuízo, ele iria para uma conta de Prejuízos Acumulados
          // ou seria um DÉBITO na Reserva de Lucro (reduzindo-a).
          // Para este exemplo, se for prejuízo, assumimos que não vai para Reserva de Lucro (ou zera ela)
          reservaDeLucroAccount.finalBalance = 0; // Ou Math.abs(lucroBruto) se for para mostrar o prejuízo
      } else {
          reservaDeLucroAccount.finalBalance = 0;
      }
  }


  // Filtrar e ordenar contas
  const finalLedgerAccounts: any[] = [];

  Array.from(accountsMap.values())
    .filter(account =>
        account.totalDebits > 0 ||
        account.totalCredits > 0 ||
        account.accountName === 'Resultado Bruto' ||
        account.accountName === 'Estoque Final' ||
        account.accountName === 'CMV' ||
        account.accountName.includes('ICMS a') ||
        account.accountName === 'C/C ICMS (Zerada)' ||
        account.accountName === 'Reserva de Lucro' // Incluir Reserva de Lucro no filtro
    )
    .sort((a, b) => {
      const orderA = customAccountOrder.get(a.accountName) || Infinity;
      const orderB = customAccountOrder.get(b.accountName) || Infinity;
      return orderA - orderB;
    })
    .forEach(account => finalLedgerAccounts.push(account));

  return finalLedgerAccounts;
});

function getBalanceClass(account: any) {
  if (account.finalBalance === 0) {
    return '';
  }

  if (account.accountName === 'Resultado Bruto') {
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  }

  if (account.accountName === 'Estoque Final') {
    return account.finalBalance >= 0 ? 'positive' : 'negative';
  }
  
  if (account.accountName === 'CMV') {
      return account.finalBalance > 0 ? 'positive' : '';
  }

  // Lógica para Reserva de Lucro (é uma conta de PL, saldo credor é positivo)
  if (account.accountName === 'Reserva de Lucro') {
      return account.finalBalance >= 0 ? 'positive' : 'negative'; // Lucro positivo, prejuízo negativo
  }

  if (account.finalBalance > 0) {
    return account.nature === 'debit' ? 'positive' : 'negative';
  } else {
    return account.nature === 'debit' ? 'negative' : 'positive';
  }
}

onMounted(() => {
  console.log('LedgerView mounted. Journal entries:', journalEntryStore.getAllJournalEntries.length);
});
</script>

<template>
  <div class="ledger-container">
    <h1>Razão (Ledger)</h1>

    <p v-if="!allJournalEntries || allJournalEntries.length === 0" class="no-entries-message">
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
                           ((account.nature === 'debit' && account.finalBalance >= 0) ||
                            (account.nature === 'credit' && account.finalBalance < 0)) ||
                           (account.accountName === 'Resultado Bruto' && account.finalBalance < 0) ||
                           (account.accountName === 'Estoque Final' && account.finalBalance >= 0) ||
                           (account.accountName === 'CMV' && account.finalBalance >= 0) ||
                           (account.accountName === 'Reserva de Lucro' && account.finalBalance < 0)"> R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div class="final-balance-left" v-else></div>

                <div class="final-balance-right"
                     :class="getBalanceClass(account)"
                     v-if="(account.finalBalance !== 0) &&
                           ((account.nature === 'credit' && account.finalBalance >= 0) ||
                            (account.nature === 'debit' && account.finalBalance < 0)) ||
                           (account.accountName === 'Resultado Bruto' && account.finalBalance >= 0) ||
                           (account.accountName === 'Estoque Final' && account.finalBalance < 0) ||
                           (account.accountName === 'CMV' && account.finalBalance < 0) ||
                           (account.accountName === 'Reserva de Lucro' && account.finalBalance >= 0)"> R$ {{ Math.abs(account.finalBalance).toFixed(2) }}
                </div>
                <div class="final-balance-right" v-else></div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Seu CSS existente permanece o mesmo */
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
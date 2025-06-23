<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import { useStockControlStore } from '@/stores/stockControlStore'; // Import the stock control store
import type { JournalEntry, EntryLine, Account, LedgerAccount } from '@/types/index';

// Stores necessários
const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const stockControlStore = useStockControlStore(); // Initialize stock control store

// Reutilizar a lógica de cálculo dos saldos do razão
const ledgerAccounts = computed(() => {
  const accountsMap = new Map<string, LedgerAccount>();

  accountStore.getAllAccounts.forEach((account: Account) => {
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

  journalEntryStore.getAllJournalEntries.forEach((entry: JournalEntry) => {
    entry.lines.forEach((line: EntryLine) => {
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

  accountsMap.forEach(accountData => {
    if (accountData.nature === 'debit') {
      accountData.finalBalance = accountData.debits - accountData.credits;
    } else { // nature === 'credit'
      accountData.finalBalance = accountData.credits - accountData.debits;
    }
  });

  // CRUCIAL: Update 'Estoque Final' balance from stockControlStore
  const finalStockAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');
  if (finalStockAccount) {
    const productX = stockControlStore.getBalanceByProductId('prod-x-1'); // Assuming 'prod-x-1' is the ID for Produto X
    if (productX) {
      // Set the finalBalance of 'Estoque Final' account to the totalValue from stock control
      finalStockAccount.finalBalance = productX.totalValue;
      // For a balance sheet, only the final balance matters.
      // If you want to show it as a single debit, you can ensure it's represented as such:
      finalStockAccount.debits = productX.totalValue; // Represent the FCE value as a debit entry
      finalStockAccount.credits = 0;
    } else {
      finalStockAccount.finalBalance = 0;
      finalStockAccount.debits = 0;
      finalStockAccount.credits = 0;
    }
  }

  return accountsMap;
});

// Função getAccountBalance movida para o escopo principal do script setup
const getAccountBalance = (name: string): number => {
    const accounts = ledgerAccounts.value;
    const account = Array.from(accounts.values()).find(acc => acc.accountName === name);
    return account ? account.finalBalance : 0;
};


// Computed para calcular o Lucro Líquido do Exercício (replicado da DRE para fins de Balanço)
const lucroLiquidoExercicio = computed(() => {
  const receitaBrutaVendas = getAccountBalance('Receita de Vendas');
  const icmsSobreVendas = Math.abs(getAccountBalance('ICMS sobre Vendas'));
  const deducoesReceitaBruta = icmsSobreVendas;

  const receitaLiquidaVendas = receitaBrutaVendas - deducoesReceitaBruta;

  // Cálculo do CMV idêntico ao DRE para consistência;
  const estoqueInicial = 0; // Assumindo 0 se não há histórico
  const comprasDeMercadoria = getAccountBalance('Compras de Mercadoria');
  const estoqueFinal = getAccountBalance('Estoque Final'); // Valor do FCE
  const cmv = estoqueInicial + comprasDeMercadoria - estoqueFinal;

  const lucroBruto = receitaLiquidaVendas - cmv;

  return lucroBruto; // Atualmente, Lucro Bruto = Lucro Líquido, ajuste conforme DRE
});


// Computed para estruturar os dados do Balanço Patrimonial
const balanceSheetData = computed(() => {
  const accounts = ledgerAccounts.value;

  const assets: { current: LedgerAccount[]; nonCurrent: LedgerAccount[]; } = { current: [], nonCurrent: [] };
  const liabilities: { current: LedgerAccount[]; nonCurrent: LedgerAccount[]; } = { current: [], nonCurrent: [] };
  const equityAccountsForDisplay: LedgerAccount[] = [];

  // Categorizar contas
  accounts.forEach((account: LedgerAccount) => {
    if (account.type === 'asset') {
      if (['Caixa', 'Caixa Econômica Federal', 'Banco Itaú', 'Banco Bradesco', 'Clientes', 'ICMS sobre Compras', 'ICMS Antecipado', 'Estoque Final'].includes(account.accountName)) { // 'Estoque Final' é um ativo circulante
        if (account.finalBalance !== 0) {
          assets.current.push(account);
        }
      } else if (['Móveis e Utensílios'].includes(account.accountName)) {
        if (account.finalBalance !== 0) {
          assets.nonCurrent.push(account);
        }
      }
    } else if (account.type === 'liability') {
       if (['Fornecedores', 'ICMS a Recolher', 'Salários a Pagar', 'Impostos a Pagar'].includes(account.accountName)) {
        if (account.finalBalance !== 0) {
          liabilities.current.push(account);
        }
       } else {
         if (account.finalBalance !== 0) {
           liabilities.nonCurrent.push(account);
         }
       }
    } else if (account.type === 'equity') {
      if (account.accountName === 'Capital Social Subscrito') {
        equityAccountsForDisplay.push(account);
      } else if (account.accountName === 'Reserva de Lucro') {
        const reservaLucroAccount = { ...account };
        reservaLucroAccount.finalBalance += lucroLiquidoExercicio.value;
        equityAccountsForDisplay.push(reservaLucroAccount);
      }
    }
  });

  // Calculate totals
  const totalCurrentAssets = assets.current.reduce((sum, acc) => sum + acc.finalBalance, 0);
  const totalNonCurrentAssets = assets.nonCurrent.reduce((sum, acc) => sum + acc.finalBalance, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = liabilities.current.reduce((sum, acc) => sum + acc.finalBalance, 0);
  const totalNonCurrentLiabilities = liabilities.nonCurrent.reduce((sum, acc) => sum + acc.finalBalance, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // CÁLCULO REVISADO DO PATRIMÔNIO LÍQUIDO
  const capitalSocialSubscrito = getAccountBalance('Capital Social Subscrito');
  const capitalAIntegralizar = getAccountBalance('Capital Social a Integralizar');
  const reservaDeLucro = getAccountBalance('Reserva de Lucro');

  // Ajuste CRUCIAL: Subtraia Capital Social a Integralizar
  const totalPatrimonioLiquido =
    capitalSocialSubscrito +
    reservaDeLucro + // Já inclui o lucro líquido
    (capitalAIntegralizar * -1); // Multiplica por -1 para SUBTRAIR o valor positivo de Capital a Integralizar

  const balanceDifference = totalAssets - (totalLiabilities + totalPatrimonioLiquido);
  const isBalanced = Math.abs(balanceDifference) < 0.01;

  return {
    assets,
    liabilities,
    equity: equityAccountsForDisplay,
    totalCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    totalCurrentLiabilities,
    totalNonCurrentLiabilities,
    totalLiabilities,
    totalPatrimonioLiquido,
    balanceDifference,
    isBalanced,
  };
});
</script>

<template>
  <div class="balance-sheet-container">
    <h1>Balanço Patrimonial</h1>

    <p v-if="journalEntryStore.getAllJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar o Balanço Patrimonial.
    </p>

    <div v-else class="balance-sheet-report">
      <div class="column assets-column">
        <h2>ATIVO</h2>
        <h3>ATIVO CIRCULANTE</h3>
        <ul>
          <li v-for="account in balanceSheetData.assets.current" :key="account.accountId">
            <span>{{ account.accountName }}</span>
            <span>R$ {{ account.finalBalance.toFixed(2) }}</span>
          </li>
        </ul>
        <div class="total-line">
          <span>Total do Ativo Circulante</span>
          <span>R$ {{ balanceSheetData.totalCurrentAssets.toFixed(2) }}</span>
        </div>

        <h3>ATIVO NÃO CIRCULANTE</h3>
        <ul>
          <li v-for="account in balanceSheetData.assets.nonCurrent" :key="account.accountId">
            <span>{{ account.accountName }}</span>
            <span>R$ {{ account.finalBalance.toFixed(2) }}</span>
          </li>
        </ul>
        <div class="total-line">
          <span>Total do Ativo Não Circulante</span>
          <span>R$ {{ balanceSheetData.totalNonCurrentAssets.toFixed(2) }}</span>
        </div>

        <div class="total-assets-line">
          <h3>TOTAL DO ATIVO</h3>
          <span>R$ {{ balanceSheetData.totalAssets.toFixed(2) }}</span>
        </div>
      </div>

      <div class="column liabilities-equity-column">
        <h2>PASSIVO E PATRIMÔNIO LÍQUIDO</h2>
        <h3>PASSIVO CIRCULANTE</h3>
        <ul>
          <li v-for="account in balanceSheetData.liabilities.current" :key="account.accountId">
            <span>{{ account.accountName }}</span>
            <span>R$ {{ account.finalBalance.toFixed(2) }}</span>
          </li>
        </ul>
        <div class="total-line">
          <span>Total do Passivo Circulante</span>
          <span>R$ {{ balanceSheetData.totalCurrentLiabilities.toFixed(2) }}</span>
        </div>

        <h3>PASSIVO NÃO CIRCULANTE</h3>
        <ul>
          <li v-for="account in balanceSheetData.liabilities.nonCurrent" :key="account.accountId">
            <span>{{ account.accountName }}</span>
            <span>R$ {{ account.finalBalance.toFixed(2) }}</span>
          </li>
        </ul>
        <div class="total-line">
          <span>Total do Passivo Não Circulante</span>
          <span>R$ {{ balanceSheetData.totalNonCurrentLiabilities.toFixed(2) }}</span>
        </div>
        <div class="total-assets-line">
            <h3>TOTAL DO PASSIVO</h3>
            <span>R$ {{ balanceSheetData.totalLiabilities.toFixed(2) }}</span>
        </div>


        <h2>PATRIMÔNIO LÍQUIDO</h2>
        <ul>
          <li v-for="account in balanceSheetData.equity" :key="account.accountId">
            <span>{{ account.accountName }}</span>
            <span>R$ {{ account.finalBalance.toFixed(2) }}</span>
          </li>
        </ul>
        <li v-if="getAccountBalance('Capital Social a Integralizar') !== 0">
            <span>(-) Capital Social a Integralizar</span>
            <span>-R$ {{ Math.abs(getAccountBalance('Capital Social a Integralizar')).toFixed(2) }}</span>
        </li>
        <div class="total-line">
          <span>Total do Patrimônio Líquido</span>
          <span>R$ {{ balanceSheetData.totalPatrimonioLiquido.toFixed(2) }}</span>
        </div>

        <div class="total-assets-line">
          <h3>TOTAL DO PASSIVO E PATRIMÔNIO LÍQUIDO</h3>
          <span>R$ {{ (balanceSheetData.totalLiabilities + balanceSheetData.totalPatrimonioLiquido).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="balance-status" :class="{ 'balanced': balanceSheetData.isBalanced, 'unbalanced': !balanceSheetData.isBalanced }">
      <p v-if="balanceSheetData.isBalanced">Balanço Patrimonial Balanceado!</p>
      <p v-else>Balanço Patrimonial NÃO Balanceado! Diferença: R$ {{ balanceSheetData.balanceDifference.toFixed(2) }}</p>
    </div>
  </div>
</template>

<style scoped>
.balance-sheet-container {
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

.balance-sheet-report {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.column {
  flex: 1;
  padding: 15px;
}

.column h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #555;
  padding-bottom: 10px;
}

.column h3 {
  color: #555;
  margin-top: 25px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 5px;
}

.column ul {
  list-style: none;
  padding: 0;
}

.column li {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dotted #eee;
}

.column li:last-of-type {
  border-bottom: none;
}

.total-line {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-top: 10px;
  padding: 8px 0;
  border-top: 1px solid #ccc;
}

.total-assets-line {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.1rem;
  margin-top: 20px;
  padding: 10px 0;
  border-top: 2px solid #333;
}

.balance-status {
  text-align: center;
  margin-top: 30px;
  padding: 15px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.2rem;
}

.balance-status.balanced {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.balance-status.unbalanced {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
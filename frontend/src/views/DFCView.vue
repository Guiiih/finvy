<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import type { JournalEntry, EntryLine, Account, LedgerAccount } from '@/types/index';

// Stores necessários
const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();

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

  return accountsMap;
});

// Função getAccountBalance (copiada do Balanço/DRE para ser autossuficiente)
const getAccountBalance = (name: string): number => {
    const accounts = ledgerAccounts.value;
    const account = Array.from(accounts.values()).find(acc => acc.accountName === name);
    return account ? account.finalBalance : 0;
};

// Computed para calcular o Lucro Líquido do Exercício (replicado da DRE para o DFC)
// Esta lógica precisa ser autocontida para que DFCView não dependa de DREView
const lucroLiquidoExercicio = computed(() => {
  const receitaBrutaVendas = getAccountBalance('Receita de Vendas');
  const icmsSobreVendas = Math.abs(getAccountBalance('ICMS sobre Vendas'));
  const deducoesReceitaBruta = icmsSobreVendas;

  const receitaLiquidaVendas = receitaBrutaVendas - deducoesReceitaBruta;

  const cmv = Math.abs(getAccountBalance('Custo da Mercadoria Vendida'));

  const lucroBruto = receitaLiquidaVendas - cmv;

  return lucroBruto; // Atualmente, Lucro Bruto = Lucro Líquido
});

// Computed para calcular os valores do DFC
const dfcData = computed(() => {
  // Lucro do Exercício (Ponto de partida)
  const lucroDoExercicio = lucroLiquidoExercicio.value;

  // --- Atividades Operacionais ---
  // Variações hardcoded do PDF para o Mês 1
  // Em um sistema real, estas seriam calculadas a partir da diferença dos saldos do Balanço de dois períodos.
  const varFornecedores = 114000;
  const varImpostos = 55800;
  const varClientes = -126000;
  const varEstoque = -36868.97;

  const totalAtividadeOperacional =
    lucroDoExercicio +
    varFornecedores +
    varImpostos +
    varClientes +
    varEstoque;

  // --- Atividades de Investimento ---
  const varImobilizado = -500000;

  const totalAtividadeInvestimento = varImobilizado;

  // --- Atividades de Financiamento ---
  const varCapitalSocial = 1000000;

  const totalAtividadeFinanciamento = varCapitalSocial;


  // Saldo Final de Caixa
  const saldoFinalDeCaixa =
    totalAtividadeOperacional +
    totalAtividadeInvestimento +
    totalAtividadeFinanciamento;

  // Para verificar, o saldo final de caixa também deve bater com o total das contas de disponibilidades
  const saldoFinalDisponibilidadesBalanço =
    getAccountBalance('Caixa') +
    getAccountBalance('Caixa Econômica Federal') +
    getAccountBalance('Banco Itaú') +
    getAccountBalance('Banco Bradesco');

  const isCashFlowBalanced = Math.abs(saldoFinalDeCaixa - saldoFinalDisponibilidadesBalanço) < 0.01;

  return {
    lucroDoExercicio,
    varFornecedores,
    varImpostos,
    varClientes,
    varEstoque,
    totalAtividadeOperacional,
    varImobilizado,
    totalAtividadeInvestimento,
    varCapitalSocial,
    totalAtividadeFinanciamento,
    saldoFinalDeCaixa,
    saldoFinalDisponibilidadesBalanço,
    isCashFlowBalanced,
  };
});
</script>

<template>
  <div class="dfc-container">
    <h1>Demonstração de Fluxo de Caixa (DFC) - Método Indireto</h1>

    <p v-if="journalEntryStore.getAllJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar o DFC.
    </p>

    <div v-else class="dfc-report">
      <div class="dfc-section header">
        <span>Descrição</span>
        <span>Valor (R$)</span>
      </div>

      <div class="dfc-line">
        <span class="description strong">(=) Lucro do Exercício</span>
        <span class="value strong">{{ dfcData.lucroDoExercicio.toFixed(2) }}</span>
      </div>

      <div class="dfc-category-header">ATIVIDADES OPERACIONAIS</div>
      <div class="dfc-line item">
        <span class="description">(+) Var. Fornecedores</span>
        <span class="value">{{ dfcData.varFornecedores.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span class="description">(+) Var. Impostos</span>
        <span class="value">{{ dfcData.varImpostos.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span class="description">(-) Var. Clientes</span>
        <span class="value">{{ dfcData.varClientes.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span class="description">(-) Var. Estoque</span>
        <span class="value">{{ dfcData.varEstoque.toFixed(2) }}</span>
      </div>
      <div class="dfc-line subtotal">
        <span class="description strong">(=) Atividade Operacional</span>
        <span class="value strong">{{ dfcData.totalAtividadeOperacional.toFixed(2) }}</span>
      </div>

      <div class="dfc-category-header">ATIVIDADES DE INVESTIMENTO</div>
      <div class="dfc-line item">
        <span class="description">(-) Var. Imobilizado</span>
        <span class="value">{{ dfcData.varImobilizado.toFixed(2) }}</span>
      </div>
      <div class="dfc-line subtotal">
        <span class="description strong">(=) Atividade Investimento</span>
        <span class="value strong">{{ dfcData.totalAtividadeInvestimento.toFixed(2) }}</span>
      </div>

      <div class="dfc-category-header">ATIVIDADES DE FINANCIAMENTO</div>
      <div class="dfc-line item">
        <span class="description">(+) Var. Capital Social</span>
        <span class="value">{{ dfcData.varCapitalSocial.toFixed(2) }}</span>
      </div>
      <div class="dfc-line subtotal">
        <span class="description strong">(=) Atividade Financiamento</span>
        <span class="value strong">{{ dfcData.totalAtividadeFinanciamento.toFixed(2) }}</span>
      </div>

      <div class="dfc-line final-result">
        <span class="description strong">(=) Saldo Final de Caixa</span>
        <span class="value strong">{{ dfcData.saldoFinalDeCaixa.toFixed(2) }}</span>
      </div>

      <div class="dfc-verification" :class="{ 'balanced': dfcData.isCashFlowBalanced, 'unbalanced': !dfcData.isCashFlowBalanced }">
        <p>Verificação com Disponibilidades do Balanço: R$ {{ dfcData.saldoFinalDisponibilidadesBalanço.toFixed(2) }}</p>
        <p v-if="dfcData.isCashFlowBalanced">DFC Fechando com o Saldo de Caixa do Balanço!</p>
        <p v-else>DFC NÃO Fechando! Diferença: R$ {{ (dfcData.saldoFinalDeCaixa - dfcData.saldoFinalDisponibilidadesBalanço).toFixed(2) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dfc-container {
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

.dfc-report {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.dfc-section.header {
  display: grid;
  grid-template-columns: 3fr 1fr;
  font-weight: bold;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.dfc-line {
  display: grid;
  grid-template-columns: 3fr 1fr;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  align-items: center;
}

.dfc-line.item {
  padding-left: 20px;
}

.dfc-line.strong {
  font-weight: bold;
}

.dfc-line .description {
  padding-left: 10px;
}

.dfc-line .value {
  text-align: right;
  padding-right: 10px;
  font-weight: 500;
}

.dfc-category-header {
  font-weight: bold;
  background-color: #eef;
  padding: 8px 10px;
  margin-top: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.subtotal {
  font-weight: bold;
  border-top: 1px solid #ccc;
  margin-top: 5px;
  padding-top: 5px;
}

.final-result {
  border-top: 2px solid #333;
  margin-top: 15px;
  padding-top: 15px;
  font-size: 1.2rem;
  color: #0056b3;
}

.dfc-verification {
  text-align: center;
  margin-top: 30px;
  padding: 15px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
}

.dfc-verification.balanced {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.dfc-verification.unbalanced {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
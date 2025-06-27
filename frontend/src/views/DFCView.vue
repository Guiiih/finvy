<script setup lang="ts">
import { computed } from 'vue';
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
      debitEntries: [],
      creditEntries: [],
      totalDebits: 0,
      totalCredits: 0,
      finalBalance: 0,
    });
  });

  journalEntryStore.getAllJournalEntries.forEach((entry: JournalEntry) => {
    entry.lines.forEach((line: EntryLine) => {
      const accountData = accountsMap.get(line.accountId);
      if (accountData) {
        if (line.debit) {
          accountData.debits += line.debit;
        }
        if (line.credit) {
          accountData.credits += line.credit;
        }
      }
    });
  });

  accountsMap.forEach((accountData) => {
    if (accountData.nature === 'debit') {
      accountData.finalBalance = accountData.debits - accountData.credits;
    } else { // nature === 'credit'
      accountData.finalBalance = accountData.credits - accountData.debits;
    }

    if (accountData.accountId === accountStore.getAccountByName('C/C ICMS')?.id) {
      if (accountData.finalBalance > 0) {
        accountData.accountName = 'ICMS a Recuperar';
        accountData.type = 'asset';
      } else if (accountData.finalBalance < 0) {
        accountData.accountName = 'ICMS a Recolher';
        accountData.type = 'liability';
        accountData.finalBalance = Math.abs(accountData.finalBalance);
      } else {
        accountData.accountName = 'C/C ICMS (Zerada)';
      }
    }
  });

  const finalStockAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');
  const productXId = productStore.getProductByName('Produto X')?.id;

  if (finalStockAccount && productXId) {
    const productXBalance = stockControlStore.getBalanceByProductId(productXId);
    if (productXBalance) {
      finalStockAccount.finalBalance = productXBalance.totalValue;
      finalStockAccount.debits = productXBalance.totalValue;
      finalStockAccount.credits = 0;
    } else {
      finalStockAccount.finalBalance = 0;
      finalStockAccount.debits = 0;
      finalStockAccount.credits = 0;
    }
  }

  return accountsMap;
});

// Função getAccountBalance para obter o saldo final de uma conta específica
const getAccountBalance = (name: string): number => {
    const accounts = ledgerAccounts.value;
    const account = Array.from(accounts.values()).find(acc => acc.accountName === name);
    return account ? account.finalBalance : 0;
};

// Computed para calcular o Lucro Líquido do Exercício (base da DFC)
const lucroLiquidoExercicio = computed(() => {
  const accounts = ledgerAccounts.value;

  const getFinalBalanceForDRE = (name: string) => {
    const account = Array.from(accounts.values()).find(acc => acc.accountName === name);
    return account ? account.finalBalance : 0;
  };

  const receitaBrutaVendas = getFinalBalanceForDRE('Receita de Vendas');
  const icmsSobreVendas = getFinalBalanceForDRE('ICMS sobre Vendas');
  const deducoesReceitaBruta = icmsSobreVendas;

  const receitaLiquidaVendas = receitaBrutaVendas - deducoesReceitaBruta;

  const comprasDeMercadoria = getFinalBalanceForDRE('Compras de Mercadoria');
  const estoqueFinal = getFinalBalanceForDRE('Estoque Final');

  let cmv = comprasDeMercadoria - estoqueFinal;
  if (cmv < 0) {
    cmv = 0;
  }

  const lucroBruto = receitaLiquidaVendas - cmv;

  return lucroBruto;
});

// Computed para estruturar os dados do Balanço Patrimonial (reutilizado para obter totais)
const balanceSheetData = computed(() => {
  const caixaCef = getAccountBalance('Caixa Econômica Federal');
  const caixa = getAccountBalance('Caixa');
  const bancoItau = getAccountBalance('Banco Itaú');
  const bancoBradesco = getAccountBalance('Banco Bradesco');
  const clientes = getAccountBalance('Clientes');
  const estoqueFinal = getAccountBalance('Estoque Final');
  const moveisEUtensilios = getAccountBalance('Móveis e Utensílios');

  const disponibilidades = caixaCef + caixa + bancoItau + bancoBradesco;
  const estoqueDeMercadorias = estoqueFinal;

  const ativoCirculante =
    disponibilidades +
    clientes +
    estoqueDeMercadorias;

  const ativoNaoCirculante = moveisEUtensilios;

  const totalDoAtivo = ativoCirculante + ativoNaoCirculante;

  const fornecedores = getAccountBalance('Fornecedores');
  const salariosAPagar = getAccountBalance('Despesas com Salários');
  const impostosAPagarGeral = getAccountBalance('Impostos a Pagar');
  const icmsARecolher = getAccountBalance('ICMS a Recolher');

  const impostoAPagarExibicao = impostosAPagarGeral + icmsARecolher;

  const passivoCirculante = fornecedores + salariosAPagar + impostoAPagarExibicao;
  const passivoNaoCirculante = 0;

  const totalDoPassivo = passivoCirculante + passivoNaoCirculante;

  const capitalSocialSubscrito = getAccountBalance('Capital Social Subscrito');
  const capitalAIntegralizar = getAccountBalance('Capital Social a Integralizar');

  const capitalSocialIntegralizado = capitalSocialSubscrito - capitalAIntegralizar;

  const saldoReservaDeLucroExistente = getAccountBalance('Reserva de Lucro');
  const reservaDeLucroTotal = saldoReservaDeLucroExistente + lucroLiquidoExercicio.value;

  const totalPatrimonioLiquido =
    capitalSocialIntegralizado +
    (reservaDeLucroTotal > 0 ? reservaDeLucroTotal : 0);

  const totalPassivoEPatrimonioLiquido = totalDoPassivo + totalPatrimonioLiquido;

  return {
    ativoCirculante,
    disponibilidades,
    caixa,
    caixaCef,
    bancoItau,
    bancoBradesco,
    clientes,
    estoqueDeMercadorias,
    ativoNaoCirculante,
    moveisEUtensilios,
    totalDoAtivo,
    passivoCirculante,
    fornecedores,
    despesasComPessoal: salariosAPagar,
    salariosAPagar,
    impostoAPagar: impostoAPagarExibicao,
    icmsARecolher,
    passivoNaoCirculante,
    totalDoPassivo,
    capitalSocial: capitalSocialIntegralizado,
    capitalSocialSubscrito,
    capitalAIntegralizar,
    reservas: reservaDeLucroTotal,
    reservaDeLucro: reservaDeLucroTotal,
    totalPatrimonioLiquido,
    totalPassivoEPatrimonioLiquido,
  };
});

// Computed para a Demonstração do Fluxo de Caixa (DFC)
const dfcData = computed(() => {
  const lle = lucroLiquidoExercicio.value; // Lucro Líquido do Exercício 

  // Variações das contas do Balanço (Calculadas como Saldo Final - Saldo Inicial)
  // Ajuste de sinal para DFC:
  // Ativos (exceto caixa): Aumento (-) ou Diminuição (+) no caixa
  // Passivos/PL: Aumento (+) ou Diminuição (-) no caixa

  const varFornecedores = getAccountBalance('Fornecedores'); // Passivo: Aumento (+) no caixa 
  const varImpostosAPagar = getAccountBalance('Impostos a Pagar') + getAccountBalance('ICMS a Recolher'); // Passivo: Aumento (+) no caixa 
  const varClientes = getAccountBalance('Clientes'); // Ativo: Aumento (-) no caixa 
  const varEstoque = getAccountBalance('Estoque Final'); // Ativo: Aumento (-) no caixa 
  const varImobilizado = getAccountBalance('Móveis e Utensílios'); // Ativo Não Circulante: Aumento (-) no caixa 
  const varCapitalSocial = getAccountBalance('Capital Social Subscrito') - getAccountBalance('Capital Social a Integralizar'); // PL: Aumento (+) no caixa 

  // Fluxo de Caixa das Atividades Operacionais
  let fluxoOperacional = lle; // Começa com o Lucro Líquido
  fluxoOperacional += varFornecedores; // + Var. Fornecedores
  fluxoOperacional += varImpostosAPagar; // + Var. Impostos
  fluxoOperacional -= varClientes; // - Var. Clientes
  fluxoOperacional -= varEstoque; // - Var. Estoque
  // Note: No seu PDF (pág. 9, Atv. Operacional), o cálculo é LLE + Fornecedores + Impostos - Clientes - Estoque
  // R$ 246.068,97 + R$ 114.000,00 + R$ 55.800,00 - R$ 126.000,00 - R$ 36.868,97 = R$ 253.000,00 

  // Fluxo de Caixa das Atividades de Investimento
  let fluxoInvestimento = 0;
  // Conforme o PDF (pág. 9), a Atv. Investimento é Var. Imobilizado E Var. Capital Social (NÃO CONVENCIONAL, mas segue o PDF) 
  fluxoInvestimento -= varImobilizado; // - Var. Imobilizado
  // Capital Social é listado como Investimento no seu PDF para este relatório, o que é atípico, mas vamos seguir.
  fluxoInvestimento += varCapitalSocial; // + Var. Capital Social 
  // Note: No seu PDF, o cálculo é -R$ 500.000,00 (Imobilizado) + R$ 1.000.000,00 (Capital Social) = R$ 500.000,00 


  // Fluxo de Caixa das Atividades de Financiamento
  // Se Capital Social foi para Investimento, esta seção pode ficar vazia, ou conter outras variações de PL/Passivo Não Circulante.
  // No PDF, não há um "Atv. Financiamento" separado, apenas as linhas individuais somam para o Saldo Final.
  const fluxoFinanciamento = 0;
  // O PDF não tem essa linha explícita em um grupo "Financiamento". Se tivesse, seria como varReservaDeLucro.
  // Para replicar o PDF, não vamos calcular fluxoFinanciamento separado a menos que haja mais itens.

  // Saldo Final de Caixa
  // O saldo final de caixa é o somatório dos fluxos de todas as atividades
  // Sld Final de Caixa = Fluxo Operacional + Fluxo Investimento (já com Capital Social)
  const sldFinalCaixa = fluxoOperacional + fluxoInvestimento; // Baseado no PDF 

  return {
    lucroLiquidoExercicio: lle,
    varFornecedores,
    varImpostosAPagar,
    varClientes,
    varEstoque,
    fluxoOperacional,
    varImobilizado,
    varCapitalSocial, // Incluído aqui para exibição separada
    fluxoInvestimento,
    sldFinalCaixa,
  };
});
</script>

<template>
  <div class="dfc-container">
    <h1>Demonstração do Fluxo de Caixa</h1>

    <p v-if="journalEntryStore.getAllJournalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar a DFC.
    </p>

    <div v-else class="dfc-report">
      <div class="header-row">
        <span>Descrição</span>
        <span>Valor</span>
      </div>

      <div class="dfc-line subheader">
        <span>(=) Lucro do Exercício</span>
        <span>R$ {{ dfcData.lucroLiquidoExercicio.toFixed(2) }}</span>
      </div>

      <div class="dfc-line item">
        <span>(+) Var. Fornecedores</span>
        <span>R$ {{ dfcData.varFornecedores.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(+) Var. Impostos</span>
        <span>R$ {{ dfcData.varImpostosAPagar.toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(-) Var. Clientes</span>
        <span>-R$ {{ Math.abs(dfcData.varClientes).toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(-) Var. Estoque</span>
        <span>-R$ {{ Math.abs(dfcData.varEstoque).toFixed(2) }}</span>
      </div>

      <div class="dfc-total">
        <span>(=) Atv. Operacional</span>
        <span>R$ {{ dfcData.fluxoOperacional.toFixed(2) }}</span>
      </div>

      <div class="dfc-line item">
        <span>(-) Var. Imobilizado</span>
        <span>-R$ {{ Math.abs(dfcData.varImobilizado).toFixed(2) }}</span>
      </div>
      <div class="dfc-line item">
        <span>(+) Var. Capital Social</span>
        <span>R$ {{ dfcData.varCapitalSocial.toFixed(2) }}</span>
      </div>

      <div class="dfc-total">
        <span>(=) Atv. Investimento</span>
        <span>R$ {{ dfcData.fluxoInvestimento.toFixed(2) }}</span>
      </div>

      <div class="dfc-total final-total">
        <span>(=) Sld Final de Caixa</span>
        <span>R$ {{ dfcData.sldFinalCaixa.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dfc-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background-color: #fff; /* Fundo branco como na imagem */
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

.dfc-report {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0; /* Borda cinza clara */
  border-radius: 6px;
  overflow: hidden;
}

.header-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  background-color: #f0f0f0; /* Fundo cinza claro */
  font-weight: bold;
  padding: 10px 15px;
  border-bottom: 2px solid #ccc; /* Borda um pouco mais forte */
  color: #222;
}

.dfc-line {
  display: grid;
  grid-template-columns: 2fr 1fr;
  padding: 8px 15px;
  border-bottom: 1px dashed #eee; /* Linha tracejada suave */
  align-items: center;
  font-size: 0.95em;
  color: #333; /* Texto padrão mais escuro */
}

.dfc-line:last-of-type {
  border-bottom: none; /* Remove borda do último item do grupo */
}

.dfc-line.subheader {
  font-weight: bold;
  background-color: #e9ecef; /* Fundo sutil para o Lucro do Exercício */
}

.dfc-line.item {
  /* Estilo padrão para os itens, sem fundo especial */
}

.dfc-total {
  display: grid;
  grid-template-columns: 2fr 1fr;
  font-weight: bold;
  border-top: 1px solid #999; /* Linha divisória antes do total */
  padding: 10px 15px;
  margin-top: 5px;
  background-color: #e9ecef; /* Fundo sutil para totais de atividade */
  font-size: 1em;
}

.dfc-total span:last-child {
  text-align: right;
}

.dfc-total.final-total {
  border-top: 2px solid #333; /* Borda mais forte no total final */
  background-color: #d4edda; /* Fundo verde claro para o total final */
  font-size: 1.1em;
  color: #155724;
}

span:last-child {
  text-align: right;
  font-weight: normal; /* Valores não são negrito por padrão */
}

.dfc-line.subheader span:last-child,
.dfc-total span:last-child {
  font-weight: bold; /* Valores dos subtotais e totais são negrito */
}
</style>
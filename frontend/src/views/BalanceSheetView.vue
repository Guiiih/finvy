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

    // Lógica para C/C ICMS mudar para ICMS a Recuperar ou ICMS a Recolher
    if (accountData.accountId === accountStore.getAccountByName('C/C ICMS')?.id) {
      if (accountData.finalBalance > 0) { // Saldo devedor (ativo)
        accountData.accountName = 'ICMS a Recuperar';
        accountData.type = 'asset';
      } else if (accountData.finalBalance < 0) { // Saldo credor (passivo)
        accountData.accountName = 'ICMS a Recolher';
        accountData.type = 'liability';
        accountData.finalBalance = Math.abs(accountData.finalBalance); // Valor positivo para passivo a pagar
      } else {
        accountData.accountName = 'C/C ICMS (Zerada)';
      }
    }
  });

  // Atualizar 'Estoque Final' balance from stockControlStore
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


// Computed para calcular o Lucro Líquido do Exercício (para Reserva de Lucro)
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


// Computed para estruturar os dados do Balanço Patrimonial
const balanceSheetData = computed(() => {
  const accounts = ledgerAccounts.value;

  // ATIVO
  const caixaCef = getAccountBalance('Caixa Econômica Federal');
  const caixa = getAccountBalance('Caixa');
  const bancoItau = getAccountBalance('Banco Itaú');
  const bancoBradesco = getAccountBalance('Banco Bradesco');
  const clientes = getAccountBalance('Clientes');
  const estoqueFinal = getAccountBalance('Estoque Final');
  const moveisEUtensilios = getAccountBalance('Móveis e Utensílios');

  // Grupos do ATIVO
  const disponibilidades = caixaCef + caixa + bancoItau + bancoBradesco;
  const estoqueDeMercadorias = estoqueFinal;

  const ativoCirculante =
    disponibilidades +
    clientes +
    estoqueDeMercadorias;

  const ativoNaoCirculante = moveisEUtensilios;

  const totalDoAtivo = ativoCirculante + ativoNaoCirculante;

  // PASSIVO E PL
  const fornecedores = getAccountBalance('Fornecedores');
  const salariosAPagar = getAccountBalance('Despesas com Salários');
  const impostosAPagarGeral = getAccountBalance('Impostos a Pagar'); // Exemplo de imposto geral a pagar
  const icmsARecolher = getAccountBalance('ICMS a Recolher');

  // Ajuste para "Imposto a pagar": soma Impostos a Pagar (geral) com ICMS a Recolher
  const impostoAPagarExibicao = impostosAPagarGeral + icmsARecolher;

  // Grupos do PASSIVO E PL
  const passivoCirculante = fornecedores + salariosAPagar + impostoAPagarExibicao; // Usa o valor somado
  const passivoNaoCirculante = 0;

  const totalDoPassivo = passivoCirculante + passivoNaoCirculante;

  const capitalSocialSubscrito = getAccountBalance('Capital Social Subscrito');
  const capitalAIntegralizar = getAccountBalance('Capital Social a Integralizar');

  // Capital Social Integralizado para exibição principal
  const capitalSocialIntegralizado = capitalSocialSubscrito - capitalAIntegralizar; // Calcula o capital já integralizado

  // Reserva de Lucro: Soma o lucro líquido do exercício ao saldo existente (se houver)
  const saldoReservaDeLucroExistente = getAccountBalance('Reserva de Lucro');
  const reservaDeLucroTotal = saldoReservaDeLucroExistente + lucroLiquidoExercicio.value;

  const totalPatrimonioLiquido =
    capitalSocialIntegralizado + // Usa o capital integralizado
    (reservaDeLucroTotal > 0 ? reservaDeLucroTotal : 0); // Capital a Integralizar já foi deduzido antes

  const totalPassivoEPatrimonioLiquido = totalDoPassivo + totalPatrimonioLiquido;

  const balanceDifference = totalDoAtivo - totalPassivoEPatrimonioLiquido;
  const isBalanced = Math.abs(balanceDifference) < 0.01;

  return {
    // ATIVO
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

    // PASSIVO E PL
    passivoCirculante,
    fornecedores,
    despesasComPessoal: salariosAPagar,
    salariosAPagar,
    impostoAPagar: impostoAPagarExibicao, // Usa o valor somado para Imposto a pagar
    icmsARecolher,
    passivoNaoCirculante,
    totalDoPassivo,
    capitalSocial: capitalSocialIntegralizado, // Exibe o capital integralizado aqui
    capitalSocialSubscrito, // Mantém para sub-item se necessário
    capitalAIntegralizar,
    reservas: reservaDeLucroTotal,
    reservaDeLucro: reservaDeLucroTotal,
    totalPatrimonioLiquido,
    totalPassivoEPatrimonioLiquido,

    // Balanço
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
        <h2 class="section-title">ATIVO</h2>
        <div class="account-group" v-if="balanceSheetData.ativoCirculante > 0">
          <h3 class="group-title">ATIVO CIRCULANTE</h3>
          
          <div class="item-with-subgroup" v-if="balanceSheetData.disponibilidades > 0">
            <span class="item-name">Disponibilidades</span>
            <span class="item-value">R$ {{ balanceSheetData.disponibilidades.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.caixa > 0"><span>Caixa</span><span>R$ {{ balanceSheetData.caixa.toFixed(2) }}</span></li>
            <li v-if="balanceSheetData.caixaCef > 0"><span>CFE</span><span>R$ {{ balanceSheetData.caixaCef.toFixed(2) }}</span></li>
            <li v-if="balanceSheetData.bancoItau > 0"><span>Banco Itaú</span><span>R$ {{ balanceSheetData.bancoItau.toFixed(2) }}</span></li>
            <li v-if="balanceSheetData.bancoBradesco > 0"><span>Banco Bradesco</span><span>R$ {{ balanceSheetData.bancoBradesco.toFixed(2) }}</span></li>
          </ul>

          <div class="item-with-subgroup" v-if="balanceSheetData.clientes > 0">
            <span class="item-name">Clientes</span>
            <span class="item-value">R$ {{ balanceSheetData.clientes.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.clientes > 0"><span>Clientes</span><span>R$ {{ balanceSheetData.clientes.toFixed(2) }}</span></li>
          </ul>

          <div class="item-with-subgroup" v-if="balanceSheetData.estoqueDeMercadorias > 0">
            <span class="item-name">Estoque de Mercadorias</span>
            <span class="item-value">R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.estoqueDeMercadorias > 0"><span>Estoque</span><span>R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span></li>
          </ul>

          <div class="total-line">
            <span>Total do Ativo Circulante</span>
            <span>R$ {{ balanceSheetData.ativoCirculante.toFixed(2) }}</span>
          </div>
        </div>

        <div class="account-group" v-if="balanceSheetData.ativoNaoCirculante > 0">
          <h3 class="group-title">ATIVO NÃO CIRCULANTE</h3>
          <div class="item-with-subgroup" v-if="balanceSheetData.moveisEUtensilios > 0">
            <span class="item-name">Imobilizado</span>
            <span class="item-value">R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.moveisEUtensilios > 0"><span>Móveis e Utensílios</span><span>R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span></li>
          </ul>
          <div class="total-line">
            <span>Total do Ativo Não Circulante</span>
            <span>R$ {{ balanceSheetData.ativoNaoCirculante.toFixed(2) }}</span>
          </div>
        </div>

        <div class="total-assets-line">
          <h3>TOTAL DO ATIVO</h3>
          <span>R$ {{ balanceSheetData.totalDoAtivo.toFixed(2) }}</span>
        </div>
      </div>

      <div class="column liabilities-equity-column">
        <h2 class="section-title">PASSIVO E PATRIMÔNIO LÍQUIDO</h2>
        <div class="account-group" v-if="balanceSheetData.passivoCirculante > 0">
          <h3 class="group-title">PASSIVO CIRCULANTE</h3>
          
          <div class="item-with-subgroup" v-if="balanceSheetData.fornecedores > 0">
            <span class="item-name">Fornecedores</span>
            <span class="item-value">R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.fornecedores > 0"><span>Fornecedores</span><span>R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span></li>
          </ul>

          <div class="item-with-subgroup" v-if="balanceSheetData.despesasComPessoal > 0">
            <span class="item-name">Despesas com Pessoal</span>
            <span class="item-value">R$ {{ balanceSheetData.despesasComPessoal.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.salariosAPagar > 0"><span>Salários a Pagar</span><span>R$ {{ balanceSheetData.salariosAPagar.toFixed(2) }}</span></li>
          </ul>

          <div class="item-with-subgroup" v-if="balanceSheetData.impostoAPagar > 0"> <span class="item-name">Imposto a pagar</span>
            <span class="item-value">R$ {{ balanceSheetData.impostoAPagar.toFixed(2) }}</span>
          </div>
          <ul class="sub-items">
            <li v-if="balanceSheetData.icmsARecolher > 0"><span>ICMS a recolher</span><span>R$ {{ balanceSheetData.icmsARecolher.toFixed(2) }}</span></li>
          </ul>
          
          <div class="total-line">
            <span>Total do Passivo Circulante</span>
            <span>R$ {{ balanceSheetData.passivoCirculante.toFixed(2) }}</span>
          </div>
        </div>

        <div class="account-group" v-if="balanceSheetData.passivoNaoCirculante > 0">
          <h3 class="group-title">PASSIVO NÃO CIRCULANTE</h3>
          <div class="total-line">
            <span>Total do Passivo Não Circulante</span>
            <span>R$ {{ balanceSheetData.passivoNaoCirculante.toFixed(2) }}</span>
          </div>
        </div>

        <div class="total-assets-line">
          <h3>TOTAL DO PASSIVO</h3>
          <span>R$ {{ balanceSheetData.totalDoPassivo.toFixed(2) }}</span>
        </div>

        <div class="account-group" v-if="balanceSheetData.totalPatrimonioLiquido !== 0">
          <h2 class="section-title">PATRIMÔNIO LÍQUIDO</h2>
          <ul class="main-items">
            <div class="item-with-subgroup" v-if="balanceSheetData.capitalSocial !== 0">
                <span class="item-name">Capital Social</span>
                <span class="item-value">R$ {{ balanceSheetData.capitalSocial.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
                <li v-if="balanceSheetData.capitalSocialSubscrito !== 0"><span>Capital Social Subscrito</span><span>R$ {{ balanceSheetData.capitalSocialSubscrito.toFixed(2) }}</span></li>
                <li v-if="balanceSheetData.capitalAIntegralizar !== 0">
                    <span>Capital a Integralizar</span><span>-R$ {{ Math.abs(balanceSheetData.capitalAIntegralizar).toFixed(2) }}</span>
                </li>
            </ul>

            <div class="item-with-subgroup" v-if="balanceSheetData.reservas > 0">
                <span class="item-name">Reservas</span>
                <span class="item-value">R$ {{ balanceSheetData.reservas.toFixed(2) }}</span>
            </div>
            <ul class="sub-items" v-if="balanceSheetData.reservaDeLucro > 0">
                <li><span>Reserva de Lucro</span><span>R$ {{ balanceSheetData.reservaDeLucro.toFixed(2) }}</span></li>
            </ul>
          </ul>
          <div class="total-line">
            <span>Total do Patrimônio Líquido</span>
            <span>R$ {{ balanceSheetData.totalPatrimonioLiquido.toFixed(2) }}</span>
          </div>
        </div>

        <div class="total-assets-line">
          <h3>TOTAL DO PASSIVO E PATRIMÔNIO LÍQUIDO</h3>
          <span>R$ {{ balanceSheetData.totalPassivoEPatrimonioLiquido.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="balance-status" :class="{ 'balanced': balanceSheetData.isBalanced, 'unbalanced': !balanceSheetData.isBalanced }">
      <p v-if="balanceSheetData.isBalanced">Não tem diferença</p>
      <p v-else>Balanço Patrimonial NÃO Balanceado! Diferença: R$ {{ balanceSheetData.balanceDifference.toFixed(2) }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos existentes */
.balance-sheet-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ccc;
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
  gap: 30px;
  padding: 20px;
}

.column {
  flex: 1;
  padding: 0;
}

.section-title {
  text-align: left;
  font-size: 1.6rem;
  color: #222;
  margin-bottom: 15px;
  border-bottom: 2px solid #555;
  padding-bottom: 5px;
  text-transform: uppercase;
  font-weight: bold;
}

.account-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 1.2rem;
  color: #444;
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #bbb;
  padding-bottom: 5px;
  text-transform: uppercase;
  font-weight: bold;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px dotted #eee;
  font-size: 0.95rem;
}

li:last-of-type {
  border-bottom: none;
}

.main-items li {
    padding-left: 0;
}

.sub-items li {
  padding-left: 20px;
  font-size: 0.9em;
  color: #555;
}

.item-with-subgroup {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  padding: 4px 0;
  border-bottom: none;
}

.item-with-subgroup .item-name {
  font-weight: normal;
}

.item-with-subgroup .item-value {
  font-weight: bold;
}

.total-line {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-top: 8px;
  padding: 6px 0;
  border-top: 1px solid #999;
  font-size: 1rem;
}

.total-assets-line {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.3rem;
  margin-top: 20px;
  padding: 8px 0;
  border-top: 3px solid #333;
}

.total-assets-line h3 {
    margin: 0;
    padding: 0;
    border-bottom: none;
    font-size: 1.3rem;
}

/* Status do balanço */
.balance-status {
  text-align: center;
  margin-top: 30px;
  padding: 15px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.2rem;
  background-color: #f0f0f0;
  color: #333;
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
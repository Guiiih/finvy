<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import { useAccountStore } from '@/stores/accountStore';
import { useStockControlStore } from '@/stores/stockControlStore';
import { useProductStore } from '@/stores/productStore';
import type { JournalEntry, EntryLine, Account, LedgerAccount } from '@/types/index';

interface VariationEntry {
  description: string;
  value: number; // Valor final da conta
  type: 'Ativo' | 'Passivo' | 'Patrimônio Líquido' | 'Lucro do Exercício'; // Tipo da conta
  variationType: 'Positiva' | 'Negativa'; // Tipo da variação (se o valor aumentou ou diminuiu)
  signedVariationValue: number; // Valor da variação com sinal
  activity: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL';
  isMainCategory?: boolean;
  isSubtotal?: boolean;
}

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
        if (line.type === 'debit') {
          accountData.debits += line.amount;
        } else {
          accountData.credits += line.amount;
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
      finalStockAccount.debits = finalStockAccount.totalDebits = productXBalance.totalValue; // Use totalDebits
      finalStockAccount.credits = finalStockAccount.totalCredits = 0; // Use totalCredits
    } else {
      finalStockAccount.finalBalance = 0;
      finalStockAccount.debits = finalStockAccount.totalDebits = 0;
      finalStockAccount.credits = finalStockAccount.totalCredits = 0;
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

// Computed para calcular o Lucro Líquido do Exercício (para base da Variação do Lucro)
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


// Computed para estruturar os dados do Balanço Patrimonial (reutilizando a lógica do BalanceSheetView)
const balanceSheetData = computed(() => {
  const accounts = ledgerAccounts.value;

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

// Helper para determinar a variação (Positiva/Negativa) e o valor com sinal
// com base na regra de que ativos são sempre Negativa e passivos/PL são sempre Positiva no seu relatório
const getVariationDetails = (value: number, accountType: 'asset' | 'liability' | 'equity', description: string) => {
    let variationValue = value;
    let variationType: 'Positiva' | 'Negativa' = 'Positiva';
    let activityType: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL' = 'Operacional';

    // Regras de Variação (Positiva/Negativa na coluna "Tipo/Influência")
    if (accountType === 'asset') {
        variationType = 'Negativa'; // Ativos sempre "Negativa" (conforme sua regra)
        if (value > 0) { // Se o valor do ativo é positivo, é uma "saída" do ponto de vista do caixa
            variationValue = -Math.abs(value); // O valor na coluna Variação (a nova) será negativo
        } else {
            variationValue = Math.abs(value); // Se o ativo é negativo (diminuição), vira positivo no fluxo
        }
    } else if (accountType === 'liability' || accountType === 'equity') {
        variationType = 'Positiva'; // Passivos/PL sempre "Positiva" (conforme sua regra)
        if (value < 0) { // Se o valor do passivo/PL é negativo (diminuição), vira negativo no fluxo
             variationValue = -Math.abs(value); // O valor na coluna Variação (a nova) será negativo
        } else {
            variationValue = Math.abs(value); // Se o passivo/PL é positivo (aumento), vira positivo no fluxo
        }
    }

    // Exceção específica para "(-) Capital Social a Integralizar"
    if (description.includes('(-) Capital Social a Integralizar')) {
        variationValue = -Math.abs(value); // Sempre negativo o valor na coluna Variação
        variationType = 'Negativa'; // Sempre Negativa a variação
    }

    // Regras para a coluna "Atividade"
    if (accountType === 'asset' && description.includes('Imobilizado')) {
        activityType = 'Investimento';
    } else if (accountType === 'asset' && description.includes('Moveis e utensílios')) {
        activityType = 'Investimento';
    } else if (accountType === 'equity' && (description.includes('Capital Social') || description.includes('Integralizar'))) {
        activityType = 'Investimento'; // Regra do seu PDF, mesmo sendo atípica
    } else if (accountType === 'equity' && description.includes('Reservas')) {
        activityType = 'Lucro/PL';
    } else {
        activityType = 'Operacional';
    }

    return { variationValue, variationType, activityType };
};


const variationData = computed<VariationEntry[]>(() => {
  const data: VariationEntry[] = [];
  const bsd = balanceSheetData.value;

  // --- ATIVO ---
  const totalAtivo = bsd.totalDoAtivo;
  if (totalAtivo !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(totalAtivo, 'asset', 'Ativo');
    data.push({ description: 'Ativo', value: totalAtivo , type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType, isMainCategory: true });
  }

  const ativoCirculanteTotal = bsd.ativoCirculante;
  if (ativoCirculanteTotal !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(ativoCirculanteTotal, 'asset', 'Ativo Circulante');
    data.push({ description: 'Ativo Circulante', value: ativoCirculanteTotal, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType, isSubtotal: true });
  }
  
  const disponibilidades = bsd.disponibilidades;
  if (disponibilidades !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(disponibilidades, 'asset', 'Disponibilidades');
    data.push({ description: 'Disponibilidades', value: disponibilidades, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }
  if (bsd.caixa !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(bsd.caixa, 'asset', 'Caixa');
    data.push({ description: 'Caixa', value: bsd.caixa, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }
  if (bsd.caixaCef !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(bsd.caixaCef, 'asset', 'BCM - CEF');
    data.push({ description: 'BCM - CEF', value: bsd.caixaCef, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }
  if (bsd.bancoItau !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(bsd.bancoItau, 'asset', 'BCM - Itau');
    data.push({ description: 'BCM - Itau', value: bsd.bancoItau, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }
  if (bsd.bancoBradesco !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(bsd.bancoBradesco, 'asset', 'BCM - Bradesco');
    data.push({ description: 'BCM - Bradesco', value: bsd.bancoBradesco, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }
  
  const clientes = bsd.clientes;
  if (clientes !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(clientes, 'asset', 'Clientes');
    data.push({ description: 'Clientes', value: clientes, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }

  const estoqueDeMercadorias = bsd.estoqueDeMercadorias;
  if (estoqueDeMercadorias !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(estoqueDeMercadorias, 'asset', 'Estoque de Mercadorias');
    data.push({ description: 'Estoque de Mercadorias', value: estoqueDeMercadorias, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
    data.push({ description: 'Estoque Final', value: estoqueDeMercadorias, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }

  const ativoNaoCirculanteTotal = bsd.ativoNaoCirculante;
  if (ativoNaoCirculanteTotal !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(ativoNaoCirculanteTotal, 'asset', 'Ativo Não Circulante');
    data.push({ description: 'Ativo Não Circulante', value: ativoNaoCirculanteTotal, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType, isSubtotal: true });
  }
  const moveisEUtensilios = bsd.moveisEUtensilios;
  if (moveisEUtensilios !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(moveisEUtensilios, 'asset', 'Imobilizado');
    data.push({ description: 'Imobilizado', value: moveisEUtensilios, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
    data.push({ description: 'Moveis e utensílios', value: moveisEUtensilios, type: 'Ativo', variationType, signedVariationValue: variationValue, activity: activityType });
  }

  // --- PASSIVO ---
  const totalPassivoPrincipal = bsd.totalPassivoEPatrimonioLiquido; // Total Passivo e PL
  if (totalPassivoPrincipal !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(totalPassivoPrincipal, 'liability', 'Passivo');
    data.push({ description: 'Passivo', value: totalPassivoPrincipal, type: 'Passivo', variationType, signedVariationValue: variationValue, activity: activityType, isMainCategory: true });
  }

  const passivoCirculanteTotal = bsd.passivoCirculante;
  if (passivoCirculanteTotal !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(passivoCirculanteTotal, 'liability', 'Passivo Circulante');
    data.push({ description: 'Passivo Circulante', value: passivoCirculanteTotal, type: 'Passivo', variationType, signedVariationValue: variationValue, activity: activityType, isSubtotal: true });
  }

  const fornecedores = bsd.fornecedores;
  if (fornecedores !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(fornecedores, 'liability', 'Fornecedores');
    data.push({ description: 'Fornecedores', value: fornecedores, type: 'Passivo', variationType, signedVariationValue: variationValue, activity: activityType });
  }

  const impostosAPagarValor = bsd.impostoAPagar;
  if (impostosAPagarValor !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(impostosAPagarValor, 'liability', 'Imposto a Pagar');
    data.push({ description: 'Imposto a Pagar', value: impostosAPagarValor, type: 'Passivo', variationType, signedVariationValue: variationValue, activity: activityType });
    if (bsd.icmsARecolher !== 0) {
      const { variationValue: icmsSigned, variationType: icmsVarType, activityType: icmsActType } = getVariationDetails(bsd.icmsARecolher, 'liability', 'ICMS a Recolher');
      data.push({ description: 'ICMS a Recolher', value: bsd.icmsARecolher, type: 'Passivo', variationType: icmsVarType, signedVariationValue: icmsSigned, activity: icmsActType });
    }
  }
  
  const salariosAPagar = bsd.salariosAPagar;
  if (salariosAPagar !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(salariosAPagar, 'liability', 'Despesas com Pessoal');
    data.push({ description: 'Despesas com Pessoal', value: salariosAPagar, type: 'Passivo', variationType, signedVariationValue: variationValue, activity: activityType });
  }

  const passivoNaoCirculanteValor = bsd.passivoNaoCirculante;
  // Adiciona a linha mesmo se for zero para replicar o layout do PDF
  const { variationValue: pncVal, variationType: pncType, activityType: pncAct } = getVariationDetails(passivoNaoCirculanteValor, 'liability', 'Passivo Não Circulante');
  data.push({ description: 'Passivo Não Circulante', value: passivoNaoCirculanteValor, type: 'Passivo', variationType: pncType, signedVariationValue: pncVal, activity: pncAct, isSubtotal: true });


  // --- PATRIMÔNIO LÍQUIDO ---
  const totalPatrimonioLiquido = bsd.totalPatrimonioLiquido;
  if (totalPatrimonioLiquido !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(totalPatrimonioLiquido, 'equity', 'Patrimônio Líquido');
    data.push({ description: 'Patrimônio Líquido', value: totalPatrimonioLiquido, type: 'Patrimônio Líquido', variationType, signedVariationValue: variationValue, activity: activityType, isMainCategory: true });
  }
  
  const capitalSocial = bsd.capitalSocial;
  if (capitalSocial !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(capitalSocial, 'equity', 'Capital Social');
    data.push({ description: 'Capital Social', value: capitalSocial, type: 'Patrimônio Líquido', variationType, signedVariationValue: variationValue, activity: activityType });
    if (bsd.capitalSocialSubscrito !== 0) {
      const { variationValue: subscritoSigned, variationType: subscritoVarType, activityType: subscritoActType } = getVariationDetails(bsd.capitalSocialSubscrito, 'equity', 'Capital Social Subscrito');
      data.push({ description: 'Capital Social Subscrito', value: bsd.capitalSocialSubscrito, type: 'Patrimônio Líquido', variationType: subscritoVarType, signedVariationValue: subscritoSigned, activity: subscritoActType });
    }
    if (bsd.capitalAIntegralizar !== 0) {
      // Valor a integralizar é positivo no balanço, mas no PDF aparece como negativo.
      // A variação é Negativa porque ele REDUZ o PL efetivo.
      const { variationValue: integralizarSigned, variationType: integralizarVarType, activityType: integralizarActType } = getVariationDetails(bsd.capitalAIntegralizar, 'equity', '(-) Capital Social a Integralizar');
      data.push({ description: '(-) Capital Social a Integralizar', value: bsd.capitalAIntegralizar, type: 'Patrimônio Líquido', variationType: integralizarVarType, signedVariationValue: integralizarSigned, activity: integralizarActType });
    }
  }

  const reservaDeLucro = bsd.reservaDeLucro;
  if (reservaDeLucro !== 0) {
    const { variationValue, variationType, activityType } = getVariationDetails(reservaDeLucro, 'equity', 'Reservas');
    data.push({ description: 'Reservas', value: reservaDeLucro, type: 'Patrimônio Líquido', variationType, signedVariationValue: variationValue, activity: activityType });
    data.push({ description: 'Reserva de Lucro', value: reservaDeLucro, type: 'Patrimônio Líquido', variationType, signedVariationValue: variationValue, activity: activityType });
  }


  return data;
});
</script>

<template>
  <div class="variation-container">
    <h1>Demonstrativo de Variações</h1>

    <div class="variation-table">
      <div class="header-row">
        <span>Descrição</span>
        <span>Valor</span>
        <span>Tipo</span>
        <span>Variação</span> <span>Atividade</span>
      </div>
      
      <template v-for="(entry, index) in variationData" :key="index">
        <div
          v-if="entry.value !== 0 || entry.isMainCategory || entry.isSubtotal || entry.description === 'Passivo Não Circulante'"
          :class="{
            'variation-row': true,
            'main-category': entry.isMainCategory,
            'sub-total': entry.isSubtotal,
            'positive-var': entry.variationType === 'Positiva',
            'negative-var': entry.variationType === 'Negativa',
            'no-border-bottom': entry.isMainCategory,
            // Ajustar recuo conforme a hierarquia
            'indented': !entry.isMainCategory && !entry.isSubtotal && (entry.description === 'Disponibilidades' || entry.description === 'Clientes' || entry.description === 'Estoque de Mercadorias' || entry.description === 'Imobilizado' || entry.description === 'Fornecedores' || entry.description === 'Despesas com Pessoal' || entry.description === 'Imposto a Pagar' || entry.description === 'Capital Social' || entry.description === 'Reservas' || entry.description === 'Passivo Não Circulante' || entry.description === 'Lucro do Exercício'),
            'double-indented': ['Caixa', 'BCM - CEF', 'BCM - Itau', 'BCM - Bradesco', 'Estoque Final', 'Moveis e utensílios', 'Salários a Pagar', 'ICMS a Recolher', 'Capital Social Subscrito', '(-) Capital Social a Integralizar', 'Reserva de Lucro'].includes(entry.description)
          }"
        >
          <span>{{ entry.description }}</span>
          <span>R$ {{ entry.value.toFixed(2) }}</span> <span>{{ entry.type }}</span> <span>{{ entry.signedVariationValue >= 0 ? 'R$' : '-R$' }} {{ Math.abs(entry.signedVariationValue).toFixed(2) }}</span> <span>{{ entry.activity }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.variation-container {
  padding: 20px;
  max-width: 900px;
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

.variation-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.header-row, .variation-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr 1.5fr; /* Ajustado para 5 colunas */
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.header-row {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #222;
  border-bottom: 2px solid #ccc;
}

.variation-row {
  background-color: #fff;
  color: #333;
}

.variation-row:nth-child(even) {
  background-color: #f8f8f8;
}

.main-category {
  font-weight: bold;
  background-color: #e9ecef;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  font-size: 1.1em;
}

.sub-total {
  font-weight: bold;
  background-color: #f3f3f3;
  border-top: 1px dashed #ddd;
}

.indented {
  padding-left: 20px;
}

.double-indented {
  padding-left: 40px;
}

.positive-var {
  color: #28a745;
}

.negative-var {
  color: #dc3545;
}

/* Removido .summary-row pois não há mais uma linha de resumo final */
</style>
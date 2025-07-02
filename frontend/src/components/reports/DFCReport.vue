<script setup lang="ts">
import { computed, watch } from 'vue';
import { useReportStore } from '@/stores/reportStore';

const props = defineProps<{
  startDate: string;
  endDate: string;
}>();

const reportStore = useReportStore();

async function fetchDFCData() {
  await reportStore.fetchReports(props.startDate, props.endDate);
}

// Observa as mudanças nas props de data e busca os dados
watch([() => props.startDate, () => props.endDate], () => {
  fetchDFCData();
}, { immediate: true }); // Executa imediatamente na montagem

const dfcData = computed(() => {
  const lle = reportStore.dreData.lucroLiquido;
  const bsd = reportStore.balanceSheetData;

  // Variações das contas do Balanço (Calculadas como Saldo Final - Saldo Inicial)
  // Ajuste de sinal para DFC:
  // Ativos (exceto caixa): Aumento (-) ou Diminuição (+) no caixa
  // Passivos/PL: Aumento (+) ou Diminuição (+) no caixa

  const varFornecedores = bsd.fornecedores; // Passivo: Aumento (+) no caixa 
  const varImpostosAPagar = bsd.impostoAPagar; // Passivo: Aumento (+) no caixa 
  const varClientes = bsd.clientes; // Ativo: Aumento (-) no caixa 
  const varEstoque = bsd.estoqueDeMercadorias; // Ativo: Aumento (-) no caixa 
  const varImobilizado = bsd.moveisEUtensilios; // Ativo Não Circulante: Aumento (-) no caixa 
  const varCapitalSocial = bsd.capitalSocial; // PL: Aumento (+) no caixa 

  // Fluxo de Caixa das Atividades Operacionais
  let fluxoOperacional = lle; // Começa com o Lucro Líquido
  fluxoOperacional += varFornecedores; // + Var. Fornecedores
  fluxoOperacional += varImpostosAPagar; // + Var. Impostos
  fluxoOperacional -= varClientes; // - Var. Clientes
  fluxoOperacional -= varEstoque; // - Var. Estoque

  // Fluxo de Caixa das Atividades de Investimento
  let fluxoInvestimento = 0;
  fluxoInvestimento -= varImobilizado; // - Var. Imobilizado
  fluxoInvestimento += varCapitalSocial; // + Var. Capital Social 

  // Saldo Final de Caixa
  const sldFinalCaixa = fluxoOperacional + fluxoInvestimento;

  return {
    lucroLiquidoExercicio: lle,
    varFornecedores,
    varImpostosAPagar,
    varClientes,
    varEstoque,
    fluxoOperacional,
    varImobilizado,
    varCapitalSocial,
    fluxoInvestimento,
    sldFinalCaixa,
  };
});
</script>

<template>
  <div class="dfc-container">
    <h1>Demonstração do Fluxo de Caixa</h1>

    <p v-if="!reportStore.reports || reportStore.reports.ledgerAccounts.length === 0" class="no-entries-message">
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
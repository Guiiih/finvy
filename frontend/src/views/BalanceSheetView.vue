<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '@/stores/reportStore';
import { useJournalEntryStore } from '@/stores/journalEntryStore';

const reportStore = useReportStore();
const journalEntryStore = useJournalEntryStore();

const balanceSheetData = computed(() => reportStore.balanceSheetData);
</script>

<template>
  <div class="balance-sheet-container">
    <h1>Balanço Patrimonial</h1>

    <p v-if="!journalEntryStore.journalEntries || journalEntryStore.journalEntries.length === 0" class="no-entries-message">
      Nenhum lançamento contábil registrado. Por favor, adicione lançamentos na tela "Lançamentos Contábeis" para gerar o Balanço Patrimonial.
    </p>

    <div v-else>
      <div class="balance-sheet-report">
        <div class="column assets-column">
          <h2 class="section-title">ATIVO</h2>
          <div class="account-group" v-if="balanceSheetData.ativoCirculante !== 0">
            <h3 class="group-title">ATIVO CIRCULANTE</h3>
            
            <div class="item-with-subgroup" v-if="balanceSheetData.disponibilidades !== 0">
              <span class="item-name">Disponibilidades</span>
              <span>R$ {{ balanceSheetData.disponibilidades.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.caixa !== 0"><span>Caixa</span><span>R$ {{ balanceSheetData.caixa.toFixed(2) }}</span></li>
              <li v-if="balanceSheetData.caixaCef !== 0"><span>CFE</span><span>R$ {{ balanceSheetData.caixaCef.toFixed(2) }}</span></li>
              <li v-if="balanceSheetData.bancoItau !== 0"><span>Banco Itaú</span><span>R$ {{ balanceSheetData.bancoItau.toFixed(2) }}</span></li>
              <li v-if="balanceSheetData.bancoBradesco !== 0"><span>Banco Bradesco</span><span>R$ {{ balanceSheetData.bancoBradesco.toFixed(2) }}</span></li>
            </ul>

            <div class="item-with-subgroup" v-if="balanceSheetData.clientes !== 0">
              <span class="item-name">Clientes</span>
              <span>R$ {{ balanceSheetData.clientes.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.clientes !== 0"><span>Clientes</span><span>R$ {{ balanceSheetData.clientes.toFixed(2) }}</span></li>
            </ul>

            <div class="item-with-subgroup" v-if="balanceSheetData.estoqueDeMercadorias !== 0">
              <span class="item-name">Estoque de Mercadorias</span>
              <span>R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.estoqueDeMercadorias !== 0"><span>Estoque</span><span>R$ {{ balanceSheetData.estoqueDeMercadorias.toFixed(2) }}</span></li>
            </ul>

            <div class="total-line">
              <span>Total do Ativo Circulante</span>
              <span>R$ {{ balanceSheetData.ativoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="account-group" v-if="balanceSheetData.ativoNaoCirculante !== 0">
            <h3 class="group-title">ATIVO NÃO CIRCULANTE</h3>
            <div class="item-with-subgroup" v-if="balanceSheetData.moveisEUtensilios !== 0">
              <span class="item-name">Imobilizado</span>
              <span>R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.moveisEUtensilios !== 0"><span>Móveis e Utensílios</span><span>R$ {{ balanceSheetData.moveisEUtensilios.toFixed(2) }}</span></li>
            </ul>
            <div class="total-line">
              <span>Total do Ativo Não Circulante</span>
              <span>R$ {{ balanceSheetData.ativoNaoCirculante.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="column liabilities-equity-column">
          <h2 class="section-title">PASSIVO</h2>
          <div class="account-group" v-if="balanceSheetData.passivoCirculante !== 0">
            <h3 class="group-title">PASSIVO CIRCULANTE</h3>
            
            <div class="item-with-subgroup" v-if="balanceSheetData.fornecedores !== 0">
              <span class="item-name">Fornecedores</span>
              <span>R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.fornecedores !== 0"><span>Fornecedores</span><span>R$ {{ balanceSheetData.fornecedores.toFixed(2) }}</span></li>
            </ul>

            <div class="item-with-subgroup" v-if="balanceSheetData.despesasComPessoal !== 0">
              <span class="item-name">Despesas com Pessoal</span>
              <span>R$ {{ balanceSheetData.despesasComPessoal.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.salariosAPagar !== 0"><span>Salários a Pagar</span><span>R$ {{ balanceSheetData.salariosAPagar.toFixed(2) }}</span></li>
            </ul>

            <div class="item-with-subgroup" v-if="balanceSheetData.impostoAPagar !== 0">
              <span class="item-name">Imposto a pagar</span>
              <span>R$ {{ balanceSheetData.impostoAPagar.toFixed(2) }}</span>
            </div>
            <ul class="sub-items">
              <li v-if="balanceSheetData.icmsARecolher !== 0"><span>ICMS a recolher</span><span>R$ {{ balanceSheetData.icmsARecolher.toFixed(2) }}</span></li>
            </ul>
            
            <div class="total-line">
              <span>Total do Passivo Circulante</span>
              <span>R$ {{ balanceSheetData.passivoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="account-group">
            <h3 class="group-title">PASSIVO NÃO CIRCULANTE</h3>
            <div class="total-line">
              <span>Total do Passivo Não Circulante</span>
              <span>R$ {{ balanceSheetData.passivoNaoCirculante.toFixed(2) }}</span>
            </div>
          </div>

          <div class="account-group" v-if="balanceSheetData.totalPatrimonioLiquido !== 0">
            <h3 class="group-title">PATRIMÔNIO LÍQUIDO</h3>
            <ul class="main-items">
              <div class="item-with-subgroup" v-if="balanceSheetData.capitalSocial !== 0">
                  <span class="item-name">Capital Social</span>
                  <span>R$ {{ balanceSheetData.capitalSocial.toFixed(2) }}</span>
              </div>
              <ul class="sub-items">
                  <li v-if="balanceSheetData.capitalSocialSubscrito !== 0"><span>Capital Social Subscrito</span><span>R$ {{ balanceSheetData.capitalSocialSubscrito.toFixed(2) }}</span></li>
                  <li v-if="balanceSheetData.capitalAIntegralizar !== 0">
                      <span>Capital a Integralizar</span><span>-R$ {{ Math.abs(balanceSheetData.capitalAIntegralizar).toFixed(2) }}</span>
                  </li>
              </ul>

              <div class="item-with-subgroup" v-if="balanceSheetData.reservas > 0">
                  <span class="item-name">Reservas</span>
                  <span>R$ {{ balanceSheetData.reservas.toFixed(2) }}</span>
              </div>
              <ul class="sub-items">
                  <li v-if="balanceSheetData.reservaDeLucro > 0"><span>Reserva de Lucro</span><span>R$ {{ balanceSheetData.reservaDeLucro.toFixed(2) }}</span></li>
              </ul>
            </ul>
            <div class="total-line">
              <span>Total do Patrimônio Líquido</span>
              <span>R$ {{ balanceSheetData.totalPatrimonioLiquido.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="balance-sheet-totals">
        <div class="total-assets-line">
          <h3>TOTAL DO ATIVO</h3>
          <span>R$ {{ balanceSheetData.totalDoAtivo.toFixed(2) }}</span>
        </div>
        <div class="total-assets-line">
          <h3>TOTAL DO PASSIVO</h3>
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
  align-items: stretch;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding-bottom: 0; 
}

.column {
  flex: 1;
  padding: 0;
  padding-left: 15px;
  padding-right: 15px;
  position: relative;
  background-color: #fff; 
}

.column:first-child::after {
  content: '';
  position: absolute;
  right: -15px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e0e0e0;
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

.balance-sheet-totals {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}

.total-assets-line {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.3rem;
  margin-top: 0;
  padding: 8px 0;
  border-top: 3px solid #333;
  padding-left: 15px;
  padding-right: 15px;
  box-sizing: border-box;
}

.total-assets-line:first-child {
  border-right: 1px solid #e0e0e0;
}


.total-assets-line h3 {
    margin: 0;
    padding: 0;
    border-bottom: none;
    font-size: 1.3rem;
}

.balance-status {
  text-align: center;
  margin-top: 0;
  padding: 15px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
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
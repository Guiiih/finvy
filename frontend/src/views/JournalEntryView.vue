<template>
  <div class="journal-entry-view">
    <h1>Lançamentos Contábeis</h1>

    <div class="controls">
      <button @click="showAddEntryForm = !showAddEntryForm">
        {{ showAddEntryForm ? 'Fechar Formulário' : 'Novo Lançamento' }}
      </button>
      <button @click="addAllMonth1Entries">Adicionar Lançamentos do Mês 1 (Exemplo)</button>
      <button @click="addAllMonth2Entries">Adicionar Lançamentos do Mês 2 (Exemplo)</button>
      <button @click="resetAllData">Resetar Todos os Dados</button>
    </div>

    <form v-if="showAddEntryForm" @submit.prevent="submitEntry" class="journal-entry-form">
      <h2>{{ editingEntryId ? 'Editar Lançamento' : 'Adicionar Novo Lançamento' }}</h2>
      <div class="form-group">
        <label for="entry-date">Data:</label>
        <input type="date" id="entry-date" v-model="newEntryDate" required />
      </div>
      <div class="form-group">
        <label for="entry-description">Descrição:</label>
        <input type="text" id="entry-description" v-model="newEntryDescription" placeholder="Descrição do lançamento" required />
      </div>

      <h3>Linhas do Lançamento:</h3>
      <div v-for="(line, index) in newEntryLines" :key="index" class="entry-line">
        <select v-model="line.accountId" required>
          <option value="" disabled>Selecione a Conta</option>
          <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
            <option v-for="account in accountStore.getAccountsByType(type)" :value="account.id" :key="account.id">
              {{ account.name }}
            </option>
          </optgroup>
        </select>
        <input type="number" v-model.number="line.amount" placeholder="Valor" step="0.01" required min="0" />
        <select v-model="line.type" required>
          <option value="debit">Débito</option>
          <option value="credit">Crédito</option>
        </select>
        <button type="button" @click="removeLine(index)">Remover</button>
      </div>
      <button type="button" @click="addLine">Adicionar Linha</button>

      <div class="balance-info">
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Total Débitos: R$ {{ totalDebits.toFixed(2) }}
        </p>
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Total Créditos: R$ {{ totalCredits.toFixed(2) }}
        </p>
        <p :class="{ 'positive': totalDebits === totalCredits, 'negative': totalDebits !== totalCredits }">
          Diferença: R$ {{ (totalDebits - totalCredits).toFixed(2) }}
        </p>
      </div>

      <button type="submit" :disabled="totalDebits !== totalCredits">
        {{ editingEntryId ? 'Atualizar Lançamento' : 'Registrar Lançamento' }}
      </button>
      <button type="button" @click="cancelEdit" v-if="editingEntryId">Cancelar</button>
    </form>

    <h2>Lançamentos Registrados</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Débitos</th>
          <th>Créditos</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="entry in sortedJournalEntries" :key="entry.id">
          <tr class="entry-summary">
            <td>{{ entry.date }}</td>
            <td>{{ entry.description }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'debit').toFixed(2) }}</td>
            <td>R$ {{ calculateTotal(entry.lines, 'credit').toFixed(2) }}</td>
            <td>
              <button @click="editEntry(entry)">Editar</button>
              <button @click="deleteEntry(entry.id)">Excluir</button>
              <button @click="toggleDetails(entry.id)">
                {{ showDetails[entry.id] ? 'Ocultar Detalhes' : 'Mostrar Detalhes' }}
              </button>
            </td>
          </tr>
          <tr v-if="showDetails[entry.id]" class="entry-details">
            <td colspan="5">
              <table>
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                    <td>{{ getAccountName(line.accountId) }}</td>
                    <td>{{ line.type === 'debit' ? 'Débito' : 'Crédito' }}</td>
                    <td>R$ {{ line.amount.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useJournalEntryStore } from '../stores/journalEntryStore';
import { useAccountStore } from '../stores/accountStore';
import { useProductStore } from '../stores/productStore';
import { useStockControlStore } from '../stores/stockControlStore';
import type { JournalEntry, EntryLine as JournalEntryLine } from '../types';

const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const productStore = useProductStore();
const stockControlStore = useStockControlStore();

const showAddEntryForm = ref(false);
const newEntryDate = ref('');
const newEntryDescription = ref('');
const newEntryLines = ref<JournalEntryLine[]>([
  { accountId: '', amount: 0, type: 'debit' },
  { accountId: '', amount: 0, type: 'credit' },
]);
const editingEntryId = ref<string | null>(null);
const showDetails = ref<{ [key: string]: boolean }>({});

// Computed properties for totals
const totalDebits = computed(() =>
  newEntryLines.value
    .filter((line) => line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0)
);

const totalCredits = computed(() =>
  newEntryLines.value
    .filter((line) => line.type === 'credit')
    .reduce((sum, line) => sum + line.amount, 0)
);

const sortedJournalEntries = computed(() => {
  return [...journalEntryStore.journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

// Watch for changes in journal entries to update stock control
watch(() => journalEntryStore.journalEntries, (newEntries, oldEntries) => {
  // Simple re-processing of all movements for demonstration.
  // In a real app, you might want more granular updates (e.g., only for new/changed entries).
  stockControlStore.movements = []; // Clear existing movements
  stockControlStore.balances = []; // Clear existing balances
  newEntries.forEach(entry => handleStockMovementFromJournalEntry(entry));
}, { deep: true, immediate: true });

// --- Helper Functions ---
function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0];
  newEntryDescription.value = '';
  newEntryLines.value = [
    { accountId: '', amount: 0, type: 'debit' },
    { accountId: '', amount: 0, type: 'credit' },
  ];
  editingEntryId.value = null;
  showAddEntryForm.value = false;
}

function addLine() {
  newEntryLines.value.push({ accountId: '', amount: 0, type: 'debit' });
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1);
}

function calculateTotal(lines: JournalEntryLine[], type: 'debit' | 'credit'): number {
  return lines.filter(line => line.type === type).reduce((sum, line) => sum + line.amount, 0);
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'Conta Desconhecida';
}

function toggleDetails(id: string) {
  showDetails.value[id] = !showDetails.value[id];
}

// --- Lógica de Integração com Controle de Estoque ---
function handleStockMovementFromJournalEntry(entry: JournalEntry) {
  const stockAccount = accountStore.getAccountByName('Compras de Mercadoria'); // Ou "Estoque" se você tiver uma conta mais específica
  const cmvAccount = accountStore.getAccountByName('CMV');
  const salesRevenueAccount = accountStore.getAccountByName('Receita de Vendas');
  const productId = productStore.getProductByName('Produto X')?.id; // Supondo que você sempre vende "Produto X"

  if (!stockAccount || !cmvAccount || !salesRevenueAccount || !productId) {
    console.warn('Contas de estoque, CMV, Receita de Vendas ou Produto X não encontrados. Ajuste as configurações.');
    return;
  }

  let isStockMovementIdentified = false;
  let quantity = 0;

  // --- Lógica para identificar COMPRA DE MERCADORIA ---
  const debitStockLine = entry.lines.find(line => line.accountId === stockAccount.id && line.type === 'debit');
  if (debitStockLine && entry.description.toLowerCase().includes('compra de mercadoria')) {
    isStockMovementIdentified = true;
    const quantityMatch = entry.description.match(/(\d[\d\.,]*)\s*(?:unds|unidade|unidades)\b/i);
    if (quantityMatch && quantityMatch[1]) {
      quantity = parseFloat(quantityMatch[1].replace(/[.,]/g, ''));
      if (quantity > 0) {
        let purchaseValue = debitStockLine.amount; // Valor bruto da compra

        // Tentar encontrar o crédito para 'Compras de Mercadoria' que representa a redução do ICMS
        // OU o débito na conta 'ICMS sobre Compras'
        const icmsOnPurchasesAccount = accountStore.getAccountByName('ICMS sobre Compras');
        let icmsAmount = 0;

        if (icmsOnPurchasesAccount) {
            // Verifique se há uma linha que credita "Compras de Mercadoria" pelo valor do ICMS
            // ou se há uma linha que debita "ICMS sobre Compras" e seu valor corresponde ao ICMS da descrição.
            // Para seus exemplos, o ICMS é um DÉBITO em "ICMS sobre Compras" e um CRÉDITO em "Compras de Mercadoria"
            // para mostrar a recuperação do imposto.

            const creditStockForIcms = entry.lines.find(line =>
                line.accountId === stockAccount.id && line.type === 'credit' &&
                (entry.description.includes('ICMS de 12%') || entry.description.includes('ICMS sobre Compras')) // Melhorar a detecção se a descrição é consistente
            );
            
            // Para o cenário de "Compras de Mercadoria" (débito) e "Compras de Mercadoria" (crédito pelo ICMS)
            if (creditStockForIcms) {
                purchaseValue -= creditStockForIcms.amount; // Subtrai o valor do ICMS recuperado
                icmsAmount = creditStockForIcms.amount; // Armazena o valor do ICMS
            } 
            // Cenário onde ICMS sobre Compras é debitado para ICMS a Recuperar
            // No seu exemplo, a compra de R$ 75.000 tem um débito de ICMS sobre Compras de R$ 9.000
            // E a compra de R$ 60.000 tem um débito de ICMS sobre Compras de R$ 7.200
            const debitIcmsOnPurchases = entry.lines.find(line => 
                line.accountId === icmsOnPurchasesAccount.id && line.type === 'debit'
            );
            // Se o lançamento tem um débito para ICMS sobre Compras (ativo)
            // e não foi subtraído anteriormente (para evitar duplicação em lançamentos compostos como o Exemplo 2)
            if (debitIcmsOnPurchases && !creditStockForIcms) {
                 // Assumimos que este débito diretamente reduz o custo da mercadoria na FCE
                 purchaseValue -= debitIcmsOnPurchases.amount;
                 icmsAmount = debitIcmsOnPurchases.amount;
            }
        }
        
        const netPurchaseValue = purchaseValue; // O valor líquido agora

        if (quantity > 0 && netPurchaseValue >= 0) { // Valor líquido deve ser não-negativo
          stockControlStore.addMovement({
            id: entry.id + '-mov-compra',
            journalEntryId: entry.id,
            date: entry.date,
            type: 'in',
            productId: productId,
            quantity: quantity,
            unitPrice: netPurchaseValue / quantity, // Custo unitário LÍQUIDO
            totalValue: netPurchaseValue // Valor total LÍQUIDO
          });
          console.log(`Movimento de COMPRA de estoque (IN) adicionado via lançamento. Valor Líquido: R$ ${netPurchaseValue.toFixed(2)}`);
        } else {
             console.warn('Quantidade ou valor de estoque (líquido) inválido para a compra. Movimento de estoque não adicionado. Lançamento ID:', entry.id);
        }
      }
    } else {
        console.warn('Não foi possível extrair quantidade da descrição para a compra. Movimento de estoque pode estar impreciso. Lançamento ID:', entry.id);
    }
  }
  // --- NOVA Lógica para identificar VENDA DE MERCADORIA e gerar CMV automaticamente ---
  // Procuramos por um crédito na conta de "Receita de Vendas"
  const creditSalesRevenueLine = entry.lines.find(line => line.accountId === salesRevenueAccount.id && line.type === 'credit');

  if (creditSalesRevenueLine && entry.description.toLowerCase().includes('venda de mercadoria')) {
    isStockMovementIdentified = true;
    const quantityMatch = entry.description.match(/(\d[\d\.,]*)\s*(?:unds|unidade|unidades)\b/i);

    if (quantityMatch && quantityMatch[1]) {
      quantity = parseFloat(quantityMatch[1].replace(/[.,]/g, ''));

      if (quantity > 0) {
        const currentProductBalance = stockControlStore.getBalanceByProductId(productId);
        const unitCostAtSale = currentProductBalance ? currentProductBalance.unitCost : (productStore.getProductById(productId)?.unitPrice || 0); // Pegar o custo médio atual ou o custo inicial do produto

        if (unitCostAtSale > 0) {
          const totalCMV = quantity * unitCostAtSale;

          stockControlStore.addMovement({
            id: entry.id + '-mov-venda',
            journalEntryId: entry.id,
            date: entry.date,
            type: 'out',
            productId: productId,
            quantity: quantity,
            unitPrice: unitCostAtSale, // O custo unitário da venda (CMV unitário)
            totalValue: totalCMV // O custo total da mercadoria vendida
          });
          console.log('Movimento de VENDA de estoque (OUT - CMV automático) adicionado via lançamento de Receita.');

        } else {
          console.warn('Custo unitário do produto X é zero ou não definido. CMV não calculado. Lançamento ID:', entry.id);
        }
      }
    } else {
      console.warn('Não foi possível extrair quantidade da descrição para a venda de estoque. Movimento de estoque pode estar impreciso. Lançamento ID:', entry.id);
    }
  }

  if (!isStockMovementIdentified) {
    console.log('Lançamento não identificado como compra ou venda de mercadoria para fins de estoque. Lançamento ID:', entry.id);
  }
}

// --- Funções de Exemplo (para simular dados) ---
function addAccounts() {
  accountStore.$reset();

  accountStore.addAccount({ id: '1', name: 'Capital Social Subscrito', type: 'equity', nature: 'credit' });
  accountStore.addAccount({ id: '2', name: 'Capital Social a Integralizar', type: 'equity', nature: 'debit' });
  accountStore.addAccount({ id: '3', name: 'Caixa Econômica Federal', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '4', name: 'Móveis e Utensílios', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '5', name: 'Compras de Mercadoria', type: 'expense', nature: 'debit' }); // Alterado para expense, pois é uma conta de resultado que compõe o CMV
  accountStore.addAccount({ id: '6', name: 'Fornecedores', type: 'liability', nature: 'credit' });
  accountStore.addAccount({ id: '7', name: 'Caixa', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '8', name: 'Banco Itaú', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '9', name: 'Banco Bradesco', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '10', name: 'Receita de Vendas', type: 'revenue', nature: 'credit' });
  accountStore.addAccount({ id: '11', name: 'Clientes', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '12', name: 'ICMS sobre Compras', type: 'asset', nature: 'debit' }); // ICMS a recuperar
  accountStore.addAccount({ id: '13', name: 'ICMS sobre Vendas', type: 'expense', nature: 'debit' }); // Dedução de Receita
  accountStore.addAccount({ id: '14', name: 'C/C ICMS', type: 'asset', nature: 'debit' }); // Conta transitória para apuração de ICMS
  accountStore.addAccount({ id: '15', name: 'CMV', type: 'expense', nature: 'debit' }); // Custo da Mercadoria Vendida - Pode ser usada para lançamentos diretos ou apuração
  accountStore.addAccount({ id: '17', 'name': 'Resultado Bruto', type: 'revenue', nature: 'credit' }); // Conta de apuração
  accountStore.addAccount({ id: '18', name: 'Reserva de Lucro', type: 'equity', nature: 'credit' });
  accountStore.addAccount({ id: '19', name: 'Salários a Pagar', type: 'liability', nature: 'credit' });
  accountStore.addAccount({ id: '20', name: 'Despesas com Salários', type: 'expense', nature: 'debit' });
  accountStore.addAccount({ id: '21', name: 'Impostos a Pagar', type: 'liability', nature: 'credit' });
  accountStore.addAccount({ id: '22', name: 'ICMS Antecipado', type: 'asset', nature: 'debit' });
  accountStore.addAccount({ id: '26', name: 'Estoque Final', type: 'asset', nature: 'debit' });

  console.log('Contas padrão adicionadas.');
}

function addProducts() {
  productStore.$reset();
  productStore.addProduct({ id: 'prod-x-1', name: 'Produto X', quantity: 0, unitPrice: 0 });
  console.log('Produtos padrão adicionados.');
}

function addInitialCapitalEntry() {
  resetForm();
  newEntryDate.value = '2025-01-01';
  newEntryDescription.value = 'Integralização de Capital Social Inicial';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 500000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Móveis e Utensílios')?.id || '', amount: 500000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Capital Social a Integralizar')?.id || '', amount: 1000000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Capital Social Subscrito')?.id || '', amount: 2000000, type: 'credit' },
  ];
  submitEntry();
}

function addPurchaseEntry1() {
  resetForm();
  newEntryDate.value = '2025-01-02';
  newEntryDescription.value = 'Compra de mercadoria para revenda de 15000 unds de produto X no valor total de aquisição de R$ 75.000,00';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Compras de Mercadoria')?.id || '', amount: 75000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Fornecedores')?.id || '', amount: 75000, type: 'credit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 9000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Compras de Mercadoria')?.id || '', amount: 9000, type: 'credit' },
  ];
  submitEntry();
}

function addPurchaseEntry2() {
  resetForm();
  newEntryDate.value = '2025-01-03';
  newEntryDescription.value = 'Compra de mercadoria para revenda sendo 25% a vista com pagamento efetuado via transferência bancária do banco CEF, de 14000 unds de produto X por R$ 60.000,00, com conhecimento de transporte terrestre (CIF) no valor de R$ 5.000,00, com ICMS de 12%';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Compras de Mercadoria')?.id || '', amount: 60000, type: 'debit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 7200, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 15000, type: 'credit' },
    { accountId: accountStore.getAccountByName('Fornecedores')?.id || '', amount: 45000, type: 'credit' },
    { accountId: accountStore.getAccountByName('Compras de Mercadoria')?.id || '', amount: 7200, type: 'credit' },
  ];
  submitEntry();
}

function addWithdrawalEntry() {
  resetForm();
  newEntryDate.value = '2025-01-03';
  newEntryDescription.value = 'Saque da conta corrente no valor de R$ 150.000,00';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 150000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 150000, type: 'credit' },
  ];
  submitEntry();
}

function addTransferToItauEntry() {
  resetForm();
  newEntryDate.value = '2025-01-05';
  newEntryDescription.value = 'Transferência de recursos via TED para o banco Itaú no valor de R$ 100.000,00';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Banco Itaú')?.id || '', amount: 100000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 100000, type: 'credit' },
  ];
  submitEntry();
}

function addClientReceiptEntry() {
  resetForm();
  newEntryDate.value = '2025-01-08';
  newEntryDescription.value = 'Recebimento de 10% do saldo da conta clientes (R$ 14.000,00)';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Clientes')?.id || '', amount: 14000, type: 'credit' },
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 14000, type: 'debit' },
  ];
  submitEntry();
}

function addSupplierPaymentEntry() {
  resetForm();
  newEntryDate.value = '2025-01-09';
  newEntryDescription.value = 'Pagamento de 5% do saldo da conta Fornecedor (R$ 6.000,00) via Caixa Econômica Federal';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Fornecedores')?.id || '', amount: 6000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 6000, type: 'credit' },
  ];
  submitEntry();
}

function addSaleEntry1() {
  resetForm();
  newEntryDate.value = '2025-01-07';
  newEntryDescription.value = 'Venda de mercadoria por R$ 400.000,00, vendidas 20000 unds do produto X (Receita e Impostos)';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 60000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Banco Bradesco')?.id || '', amount: 80000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 120000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Clientes')?.id || '', amount: 140000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Receita de Vendas')?.id || '', amount: 400000, type: 'credit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Vendas')?.id || '', amount: 72000, type: 'credit' },
    { accountId: accountStore.getAccountByName('Receita de Vendas')?.id || '', amount: 72000, type: 'debit' },
  ];
  submitEntry();
}

function addIcmsSettlementEntry1() {
  resetForm();
  newEntryDate.value = '2025-01-31';
  newEntryDescription.value = 'Apuração e Transferência de ICMS Mês 1';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 9000, type: 'credit' },
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 9000, type: 'debit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 7200, type: 'credit' },
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 7200, type: 'debit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Vendas')?.id || '', amount: 72000, type: 'debit' },
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 72000, type: 'credit' },
  ];
  submitEntry();
}

// Example additional entries for Month 2 (ensure this is a function, not a const arrow function)
function addMonth2Entries() {
  // Recebimento de Clientes M2
  resetForm();
  newEntryDate.value = '2025-02-10';
  newEntryDescription.value = 'Recebimento de clientes';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Bancos')?.id || '', amount: 300000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Clientes')?.id || '', amount: 300000, type: 'credit' },
  ];
  submitEntry();

  // Pagamento de Salários M2
  resetForm();
  newEntryDate.value = '2025-02-28';
  newEntryDescription.value = 'Pagamento de salários';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Despesas com Salários')?.id || '', amount: 50000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Bancos')?.id || '', amount: 50000, type: 'credit' },
  ];
  submitEntry();
}

// --- Main Action Functions (can call helpers above) ---
async function submitEntry() {
  if (totalDebits.value !== totalCredits.value) {
    alert('Débitos e Créditos devem ser iguais!');
    return;
  }

  if (newEntryLines.value.some(line => line.amount <= 0)) {
    alert('Todos os valores devem ser maiores que zero.');
    return;
  }

  const newEntry: JournalEntry = {
    id: editingEntryId.value || `JE-${Date.now()}`,
    date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: newEntryLines.value.map(line => ({ ...line })),
  };

  if (editingEntryId.value) {
    journalEntryStore.updateEntry(newEntry);
    console.log('Lançamento atualizado:', newEntry);
  } else {
    journalEntryStore.addJournalEntry(newEntry); // Corrected action name
    console.log('Novo lançamento adicionado:', newEntry);
  }
  resetForm();
}

function editEntry(entry: JournalEntry) {
  showAddEntryForm.value = true;
  editingEntryId.value = entry.id;
  newEntryDate.value = entry.date;
  newEntryDescription.value = entry.description;
  newEntryLines.value = entry.lines.map(line => ({ ...line }));
}

function cancelEdit() {
  resetForm();
}

function deleteEntry(id: string) {
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    journalEntryStore.deleteEntry(id);
    if (editingEntryId.value === id) {
      resetForm();
    }
    console.log('Lançamento excluído:', id);
  }
}


async function addAllMonth1Entries() {
  journalEntryStore.$reset();
  stockControlStore.$reset();
  productStore.$reset();
  addAccounts();
  addProducts();
  await new Promise(resolve => setTimeout(resolve, 50));

  addInitialCapitalEntry();
  await new Promise(resolve => setTimeout(resolve, 50));
  addPurchaseEntry1();
  await new Promise(resolve => setTimeout(resolve, 50));
  addPurchaseEntry2();
  await new Promise(resolve => setTimeout(resolve, 50));
  addWithdrawalEntry();
  await new Promise(resolve => setTimeout(resolve, 50));
  addTransferToItauEntry();
  await new Promise(resolve => setTimeout(resolve, 50));
  addSaleEntry1();
  await new Promise(resolve => setTimeout(resolve, 50));
  addClientReceiptEntry();
  await new Promise(resolve => setTimeout(resolve, 50));
  addSupplierPaymentEntry();
  await new Promise(resolve => setTimeout(resolve, 50));
  addIcmsSettlementEntry1();
  await new Promise(resolve => setTimeout(resolve, 50));

  alert('Todos os lançamentos do Mês 1 adicionados com sucesso!');
}

async function addAllMonth2Entries() {
  if (journalEntryStore.journalEntries.length === 0) {
    await addAllMonth1Entries(); // This call is now correctly resolved
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  addMonth2Entries(); // This call should now be resolved
  alert('Todos os lançamentos do Mês 2 adicionados com sucesso!');
}

const resetAllData = () => {
  if (confirm('Tem certeza que deseja resetar todos os dados (lançamentos, contas, produtos, estoque)?')) {
    journalEntryStore.$reset();
    accountStore.$reset();
    productStore.$reset();
    stockControlStore.$reset();
    resetForm();
    console.log('Todos os dados foram resetados.');
  }
};

onMounted(() => {
  resetForm();
  addAccounts();
  addProducts();
});
</script>

<style scoped>
.journal-entry-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1, h2, h3 {
  color: #333;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.controls button:hover {
  background-color: #0056b3;
}

.controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.journal-entry-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="date"],
.form-group input[type="text"] {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.entry-line {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.entry-line select,
.entry-line input[type="number"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.entry-line select {
  flex: 2;
  min-width: 150px;
}

.entry-line input[type="number"] {
  flex: 1;
  min-width: 100px;
}

.entry-line button {
  padding: 8px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.entry-line button:hover {
  background-color: #c82333;
}

.balance-info {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #e9ecef;
}

.balance-info p {
  margin: 5px 0;
  font-weight: bold;
}

.balance-info .positive {
  color: green;
}

.balance-info .negative {
  color: red;
}

.journal-entry-form button[type="submit"],
.journal-entry-form button[type="button"]:not(.entry-line button) {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  margin-right: 10px;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.journal-entry-form button[type="submit"]:hover,
.journal-entry-form button[type="button"]:not(.entry-line button):hover {
  background-color: #218838;
}

.journal-entry-form button[type="submit"]:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

th, td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}

.entry-summary td {
  background-color: #ffffff;
}

.entry-details td {
  background-color: #f0f8ff;
  padding: 10px 20px;
}

.entry-details table {
  width: 100%;
  margin: 0;
  box-shadow: none;
}

.entry-details th, .entry-details td {
  padding: 8px;
  font-size: 0.9em;
}

.entry-summary button {
  padding: 6px 10px;
  margin-right: 5px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.entry-summary button:hover {
  background-color: #138496;
}

.entry-summary button:last-child {
  background-color: #6c757d;
}

.entry-summary button:last-child:hover {
  background-color: #5a6268;
}

.entry-summary button:nth-child(2) { /* Delete button */
  background-color: #dc3545;
}

.entry-summary button:nth-child(2):hover {
  background-color: #c82333;
}
</style>
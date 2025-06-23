<script setup lang="ts">
import { ref, computed } from 'vue';
import { useJournalEntryStore } from '../stores/journalEntryStore';
import { useAccountStore } from '../stores/accountStore';
import { useStockControlStore } from '../stores/stockControlStore';
import { useProductStore } from '../stores/productStore';
import type { JournalEntry, EntryLine, StockMovement } from '../types/index';

const journalEntryStore = useJournalEntryStore();
const accountStore = useAccountStore();
const stockControlStore = useStockControlStore();
const productStore = useProductStore();

const newEntryDate = ref<string>(new Date().toISOString().substring(0, 10));
const newEntryDescription = ref('');
const newEntryLines = ref<EntryLine[]>([
  { accountId: '', amount: 0, type: 'debit' },
  { accountId: '', amount: 0, type: 'credit' },
]);

const accounts = computed(() => accountStore.getAllAccounts);
const allJournalEntries = computed(() => journalEntryStore.getAllJournalEntries);


const addLine = () => {
  newEntryLines.value.push({ accountId: '', amount: 0, type: 'debit' });
};

const removeLine = (index: number) => {
  newEntryLines.value.splice(index, 1);
};

const resetForm = () => {
  newEntryDate.value = new Date().toISOString().substring(0, 10);
  newEntryDescription.value = '';
  newEntryLines.value = [
    { accountId: '', amount: 0, type: 'debit' },
    { accountId: '', amount: 0, type: 'credit' },
  ];
};

const calculateTotals = computed(() => {
  let totalDebits = 0;
  let totalCredits = 0;
  newEntryLines.value.forEach(line => {
    if (line.type === 'debit') {
      totalDebits += line.amount;
    } else {
      totalCredits += line.amount;
    }
  });
  return { totalDebits, totalCredits, balanced: totalDebits === totalCredits && totalDebits > 0 };
});

const submitEntry = () => {
  if (!calculateTotals.value.balanced) {
    alert('Débitos e Créditos devem ser iguais e maiores que zero para o lançamento ser válido.');
    return;
  }

  const filteredLines = newEntryLines.value.filter(line => line.accountId && line.amount > 0);
  if (filteredLines.length === 0) {
      alert('Adicione ao menos uma linha válida ao lançamento.');
      return;
  }

  const newJournalEntryId = Date.now().toString();
  const newJournalEntry: JournalEntry = {
    id: newJournalEntryId,
    date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: filteredLines,
  };

  journalEntryStore.addJournalEntry(newJournalEntry);

  handleStockMovementFromJournalEntry(newJournalEntry, newJournalEntryId);

  resetForm();
};

const handleStockMovementFromJournalEntry = (entry: JournalEntry, journalEntryId: string) => {
  const stockAccount = accountStore.getAccountByName('Compras de Mercadoria');
  const cmvAccount = accountStore.getAccountByName('Custo da Mercadoria Vendida');
  const icmsComprasAccount = accountStore.getAccountByName('ICMS sobre Compras');

  if (!stockAccount || !cmvAccount || !icmsComprasAccount) {
    console.warn('Contas essenciais para o controle de estoque (Compras de Mercadoria, Custo da Mercadoria Vendida, ICMS sobre Compras) não encontradas. Verifique o Plano de Contas.');
    return;
  }

  let quantity = 0;
  let productId = '';

  const productX = productStore.getProductByName('Produto X');
  if (productX) {
      productId = productX.id;
  } else {
      console.error('Produto X não encontrado no productStore. Adicione-o para que o controle de estoque funcione.');
      return;
  }

  let isStockMovementIdentified = false;

  // --- Lógica para identificar COMPRA ---
  const debitStockGrossLine = entry.lines.find(line => line.accountId === stockAccount.id && line.type === 'debit');
  const creditStockICMSLine = entry.lines.find(line => line.accountId === stockAccount.id && line.type === 'credit');

  if (debitStockGrossLine && entry.description.toLowerCase().includes('compra de mercadoria')) {
    isStockMovementIdentified = true;
    const quantityMatch = entry.description.match(/(\d[\d\.,]*)\s*(?:unds|unidade|unidades)\b/i);

    if (quantityMatch && quantityMatch[1]) {
        quantity = parseFloat(quantityMatch[1].replace(/[.,]/g, ''));
        
        let netPurchaseValue = debitStockGrossLine.amount;

        const icmsAmountInEntry = entry.lines.find(line => 
          line.accountId === icmsComprasAccount.id && line.type === 'debit'
        )?.amount || 0;
        
        if (creditStockICMSLine && creditStockICMSLine.amount === icmsAmountInEntry) {
            netPurchaseValue = debitStockGrossLine.amount - creditStockICMSLine.amount;
        }

        if (quantity > 0 && netPurchaseValue > 0) {
          const unitPriceCalculated = netPurchaseValue / quantity;
          stockControlStore.addMovement({
            id: journalEntryId + '-mov-compra',
            journalEntryId: journalEntryId,
            date: entry.date,
            type: 'in',
            productId: productId,
            quantity: quantity,
            unitPrice: unitPriceCalculated,
            totalValue: netPurchaseValue
          });
          console.log(`Movimento de COMPRA de estoque (IN) adicionado via lançamento. Valor Líquido: R$ ${netPurchaseValue.toFixed(2)}`);
        } else {
             console.warn('Quantidade ou valor de estoque (líquido) inválido para a compra. Movimento de estoque não adicionado. Lançamento ID:', journalEntryId);
        }
    } else {
        console.warn('Não foi possível extrair quantidade da descrição para a compra. Movimento de estoque pode estar impreciso. Lançamento ID:', journalEntryId);
    }
  }

  // --- Lógica para identificar VENDA DE ESTOQUE (CMV) ---
  const debitCMVLine = entry.lines.find(line => line.accountId === cmvAccount.id && line.type === 'debit');
  const creditStockLine = entry.lines.find(line => line.accountId === stockAccount.id && line.type === 'credit');

  if (debitCMVLine && creditStockLine && (entry.description.toLowerCase().includes('venda de mercadoria') || entry.description.toLowerCase().includes('baixa de estoque'))) {
    isStockMovementIdentified = true;
    const quantityMatch = entry.description.match(/(\d[\d\.,]*)\s*(?:unds|unidade|unidades)\b/i);

    if (quantityMatch && quantityMatch[1]) {
        quantity = parseFloat(quantityMatch[1].replace(/[.,]/g, ''));

        if (quantity > 0) {
          const currentProductBalance = stockControlStore.getBalanceByProductId(productId);
          const averageCost = currentProductBalance ? currentProductBalance.unitCost : (productX ? productX.unitPrice : 0);
          const totalValueCMV = debitCMVLine.amount;

          stockControlStore.addMovement({
            id: journalEntryId + '-mov-venda',
            journalEntryId: journalEntryId,
            date: entry.date,
            type: 'out',
            productId: productId,
            quantity: quantity,
            unitPrice: averageCost,
            totalValue: totalValueCMV
          });
          console.log('Movimento de VENDA de estoque (OUT) adicionado via lançamento.');
        }
    } else {
        console.warn('Não foi possível extrair quantidade da descrição para a venda de estoque. Movimento de estoque pode estar impreciso. Lançamento ID:', journalEntryId);
    }
  }

  if (!isStockMovementIdentified) {
    console.log('Lançamento não identificado como compra ou venda de mercadoria para fins de estoque. Lançamento ID:', journalEntryId);
  }
};


// Exemplo do primeiro lançamento do exercício para teste: Integralização de capital
const addInitialCapitalEntry = () => {
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
};

// Exemplo de lançamento de Compra de mercadoria (Mês 1, item 2)
const addPurchaseEntry1 = () => {
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
};

// Exemplo de lançamento de Compra de mercadoria (Mês 1, item 6)
const addPurchaseEntry2 = () => {
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
};

// Exemplo de Saque (Mês 1, item 3)
const addWithdrawalEntry = () => {
  resetForm();
  newEntryDate.value = '2025-01-03';
  newEntryDescription.value = 'Saque da conta corrente no valor de R$ 150.000,00';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 150000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 150000, type: 'credit' },
  ];
  submitEntry();
};

// Exemplo de Transferência para Banco Itaú (Mês 1, item 5)
const addTransferToItauEntry = () => {
  resetForm();
  newEntryDate.value = '2025-01-05';
  newEntryDescription.value = 'Transferência de recursos via TED para o banco Itaú no valor de R$ 100.000,00';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Banco Itaú')?.id || '', amount: 100000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 100000, type: 'credit' },
  ];
  submitEntry();
};

// Exemplo de Recebimento de Clientes (Mês 1, item 8)
const addClientReceiptEntry = () => {
  resetForm();
  newEntryDate.value = '2025-01-08';
  newEntryDescription.value = 'Recebimento de 10% do saldo da conta clientes (R$ 14.000,00)';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Clientes')?.id || '', amount: 14000, type: 'credit' },
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 14000, type: 'debit' },
  ];
  submitEntry();
};

// Exemplo de Pagamento de Fornecedores (Mês 1, item 9)
const addSupplierPaymentEntry = () => {
  resetForm();
  newEntryDate.value = '2025-01-09';
  newEntryDescription.value = 'Pagamento de 5% do saldo da conta Fornecedor (R$ 6.000,00) via Caixa Econômica Federal';
  newEntryLines.value = [
    { accountId: accountStore.getAccountByName('Fornecedores')?.id || '', amount: 6000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 6000, type: 'credit' },
  ];
  submitEntry();
};


// Exemplo de lançamento de Venda de mercadoria (Mês 1, item 7)
const addSaleEntry1 = () => {
  // LANÇAMENTO DA RECEITA DA VENDA
  resetForm();
  newEntryDate.value = '2025-01-07';
  newEntryDescription.value = 'Venda de mercadoria por R$ 400.000,00, vendidas 20000 unds do produto X (Receita e Impostos)';
  newEntryLines.value = [
    // Débitos para o recebimento da venda
    { accountId: accountStore.getAccountByName('Caixa')?.id || '', amount: 60000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Banco Bradesco')?.id || '', amount: 80000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Caixa Econômica Federal')?.id || '', amount: 120000, type: 'debit' },
    { accountId: accountStore.getAccountByName('Clientes')?.id || '', amount: 140000, type: 'debit' },
    // Crédito para a Receita Bruta de Vendas
    { accountId: accountStore.getAccountByName('Receita de Vendas')?.id || '', amount: 400000, type: 'credit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Vendas')?.id || '', amount: 72000, type: 'credit' }, // Total ICMS Vendas
    { accountId: accountStore.getAccountByName('Receita de Vendas')?.id || '', amount: 72000, type: 'debit' },

  ];
  submitEntry();
};


// Lançamento de Apuração de ICMS (Mês 1)
const addIcmsSettlementEntry1 = () => {
  resetForm();
  newEntryDate.value = '2025-01-31'; // Fim do mês
  newEntryDescription.value = 'Apuração e Transferência de ICMS Mês 1';
  newEntryLines.value = [
    // Apuração de ICMS sobre Compras (ativos a recuperar)
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 9000, type: 'credit' }, // Total ICMS Compras (9000+7200)
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 9000, type: 'debit' },
    { accountId: accountStore.getAccountByName('ICMS sobre Compras')?.id || '', amount: 7200, type: 'credit' }, // Total ICMS Compras (9000+7200)
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 7200, type: 'debit' },

    // Apuração de ICMS sobre Vendas (dedução da receita, natureza devedora)
    { accountId: accountStore.getAccountByName('ICMS sobre Vendas')?.id || '', amount: 72000, type: 'debit' }, // Total ICMS Vendas
    { accountId: accountStore.getAccountByName('C/C ICMS')?.id || '', amount: 72000, type: 'credit' },
  ];
  submitEntry();
};

// REMOVIDO: Lançamento de Apuração de RCM
// (Não haverá mais uma conta RCM para onde transferir o resultado)

// Botão Mestre: Adicionar todos os lançamentos do Mês 1
const addAllMonth1Entries = async () => {
  journalEntryStore.journalEntries = [];
  stockControlStore.movements = [];
  stockControlStore.balances = [];
  
  // Ordem lógica e de data dos lançamentos do Mês 1
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
  // REMOVIDO: Chamada para addRcmSettlementEntry1();

  alert('Todos os lançamentos do Mês 1 adicionados com sucesso!');
};

</script>

<template>
  <div class="journal-entries-container">
    <h1>Livro Diário - Lançamentos Contábeis</h1>

    <div class="journal-entry-form">
      <h2>Adicionar Novo Lançamento</h2>
      <div class="form-group">
        <label for="entry-date">Data:</label>
        <input type="date" id="entry-date" v-model="newEntryDate" />
      </div>
      <div class="form-group">
        <label for="entry-description">Descrição:</label>
        <input type="text" id="entry-description" v-model="newEntryDescription" placeholder="Histórico do lançamento" />
      </div>

      <h3>Linhas do Lançamento:</h3>
      <div v-for="(line, index) in newEntryLines" :key="index" class="entry-line">
        <div class="form-group">
          <label :for="'account-select-' + index">Conta:</label>
          <select :id="'account-select-' + index" v-model="line.accountId">
            <option value="">Selecione uma conta</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">
              {{ account.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label :for="'amount-input-' + index">Valor:</label>
          <input type="number" :id="'amount-input-' + index" v-model.number="line.amount" />
        </div>
        <div class="form-group">
          <label :for="'type-select-' + index">Tipo:</label>
          <select :id="'type-select-' + index" v-model="line.type">
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
        </div>
        <button @click="removeLine(index)" class="remove-line-btn">Remover</button>
      </div>
      <button @click="addLine" class="add-line-btn">Adicionar Linha</button>

      <div class="totals-summary">
        <p>Total Débitos: R$ {{ calculateTotals.totalDebits.toFixed(2) }}</p>
        <p>Total Créditos: R$ {{ calculateTotals.totalCredits.toFixed(2) }}</p>
        <p :class="{ 'balanced': calculateTotals.balanced, 'unbalanced': !calculateTotals.balanced }">
          Status: {{ calculateTotals.balanced ? 'Balanceado' : 'Não Balanceado' }}
        </p>
      </div>

      <button @click="submitEntry" :disabled="!calculateTotals.balanced" class="submit-entry-btn">Registrar Lançamento</button>
    </div>

    <hr />

    <div class="journal-entries-list">
      <h2>Lançamentos Registrados</h2>
      <p v-if="allJournalEntries.length === 0" class="no-entries-message">Nenhum lançamento registrado ainda.</p>
      <div v-else class="journal-entries-grid">
        <div v-for="entry in allJournalEntries" :key="entry.id" class="journal-entry-card">
          <h3>ID: {{ entry.id }}</h3>
          <p><strong>Data:</strong> {{ entry.date }}</p>
          <p><strong>Descrição:</strong> {{ entry.description }}</p>
          <div class="entry-lines-summary-card">
            <h4>Linhas:</h4>
            <ul>
              <li v-for="(line, lineIndex) in entry.lines" :key="lineIndex"
                  :class="{ 'debit-line': line.type === 'debit', 'credit-line': line.type === 'credit' }">
                <span class="line-type">{{ line.type === 'debit' ? 'D' : 'C' }}</span>
                <span class="account-name">{{ accountStore.getAccountById(line.accountId)?.name || 'Conta Desconhecida' }}</span>
                <span class="line-amount">R$ {{ line.amount.toFixed(2) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="example-entry-buttons">
        <button @click="addInitialCapitalEntry" class="btn-example-entry">Adicionar Lançamento de Capital (Exemplo)</button>
        <button @click="addPurchaseEntry1" class="btn-example-entry">Adicionar Compra Mercadoria M1 (Exemplo 1)</button>
        <button @click="addPurchaseEntry2" class="btn-example-entry">Adicionar Compra Mercadoria M1 (Exemplo 2)</button>
        <button @click="addSaleEntry1" class="btn-example-entry">Adicionar Venda Mercadoria M1 (Exemplo)</button>
        <button @click="addWithdrawalEntry" class="btn-example-entry">Adicionar Saque M1 (Exemplo)</button>
        <button @click="addTransferToItauEntry" class="btn-example-entry">Adicionar Transf. Itaú M1 (Exemplo)</button>
        <button @click="addClientReceiptEntry" class="btn-example-entry">Adicionar Recebimento Clientes M1 (Exemplo)</button>
        <button @click="addSupplierPaymentEntry" class="btn-example-entry">Adicionar Pgto Fornecedores M1 (Exemplo)</button>
        <button @click="addIcmsSettlementEntry1" class="btn-example-entry">Apuração ICMS M1 (Exemplo)</button>
        <button @click="addAllMonth1Entries" class="btn-example-entry btn-all-entries">Adicionar TODOS Lançamentos M1</button>
    </div>
  </div>
</template>

<style scoped>
.journal-entries-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.journal-entry-form, .journal-entries-list {
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #666;
}

input[type="date"],
input[type="text"],
input[type="number"],
select {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.entry-line {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 50px;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px dashed #ccc;
  border-radius: 6px;
  background-color: #fff;
}

.entry-line .form-group {
  margin-bottom: 0; /* Remove bottom margin for alignment in grid */
}

.remove-line-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.remove-line-btn:hover {
  background-color: #c82333;
}

.add-line-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.add-line-btn:hover {
  background-color: #0056b3;
}

.totals-summary {
  margin-top: 25px;
  padding: 15px;
  border: 1px solid #bce8f1;
  background-color: #d9edf7;
  border-radius: 5px;
  color: #31708f;
}

.totals-summary p {
  margin: 5px 0;
  font-weight: bold;
}

.totals-summary .balanced {
  color: #28a745;
}

.totals-summary .unbalanced {
  color: #dc3545;
}

.submit-entry-btn {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 20px;
}

.submit-entry-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-entry-btn:hover:not(:disabled) {
  background-color: #218838;
}

.journal-entry-item { /* Estilo antigo, pode ser substituído por .journal-entry-card */
  border: 1px solid #e0e0e0;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: #fff;
}

.journal-entry-item h3 {
  margin-top: 0;
  color: #444;
}

.journal-entry-item ul {
  list-style: none;
  padding: 0;
}

.journal-entry-item li {
  padding: 5px 0;
  border-bottom: 1px dotted #eee;
}

.journal-entry-item li:last-child {
  border-bottom: none;
}

.example-entry-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
}

.btn-example-entry {
  background-color: #ffc107;
  color: #333;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-example-entry:hover {
  background-color: #e0a800;
}

.btn-all-entries {
  background-color: #4CAF50; /* Um verde diferente */
  color: white;
  font-weight: bold;
}

.btn-all-entries:hover {
  background-color: #45a049;
}

/* --- Novos estilos para a lista de histórico --- */
.journal-entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.journal-entry-card {
  background-color: #fefefe;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.journal-entry-card h3 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 10px;
  border-bottom: 1px dashed #ddd;
  padding-bottom: 5px;
  text-align: left;
}

.journal-entry-card p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.entry-lines-summary-card h4 {
  font-size: 0.95rem;
  color: #555;
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: left;
  border-bottom: none;
  padding-bottom: 0;
}

.entry-lines-summary-card ul {
  list-style: none;
  padding: 0;
}

.entry-lines-summary-card li {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 3px 0;
  border-bottom: 1px dotted #eee;
}

.entry-lines-summary-card li:last-child {
  border-bottom: none;
}

.entry-lines-summary-card .line-type {
  font-weight: bold;
  width: 20px;
}

.entry-lines-summary-card .account-name {
  flex-grow: 1;
  margin-left: 5px;
  text-align: left;
}

.entry-lines-summary-card .line-amount {
  text-align: right;
  width: 80px;
}

.debit-line {
  color: #28a745;
}

.credit-line {
  color: #007bff;
}

.no-entries-message {
  text-align: center;
  color: #888;
  font-style: italic;
  margin-top: 20px;
}
</style>
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useJournalEntryStore } from './journalEntryStore';
import { useAccountStore } from './accountStore';
import { useStockControlStore } from './stockControlStore';
import { useProductStore } from './productStore';
import type { LedgerAccount } from '@/types/index';

interface VariationEntry {
  description: string;
  value: number;
  type: 'Ativo' | 'Passivo' | 'Patrimônio Líquido' | 'Lucro do Exercício';
  variationType: 'Positiva' | 'Negativa';
  signedVariationValue: number;
  activity: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL';
  isMainCategory?: boolean;
  isSubtotal?: boolean;
}

export const useReportStore = defineStore('report', () => {
  const journalEntryStore = useJournalEntryStore();
  const accountStore = useAccountStore();
  const stockControlStore = useStockControlStore();
  useProductStore();

  const allJournalEntries = computed(() => journalEntryStore.getAllJournalEntries);
  const allAccounts = computed(() => accountStore.getAllAccounts);

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
  customAccountOrder.set('Resultado Bruto', 16);
  customAccountOrder.set('Reserva de Lucro', 17);
  customAccountOrder.set('Salários a Pagar', 18);
  customAccountOrder.set('Despesas com Salários', 19);
  customAccountOrder.set('Impostos a Pagar', 20);
  customAccountOrder.set('ICMS Antecipado', 21);
  customAccountOrder.set('Estoque Final', 22);

  const ledgerAccounts = computed<LedgerAccount[]>(() => {
    const accountsMap = new Map<string, LedgerAccount>();

    if (!allAccounts.value) return [];

    allAccounts.value.forEach(account => {
      accountsMap.set(account.id, {
        accountId: account.id,
        accountName: account.name,
        type: account.type,
        debitEntries: [],
        creditEntries: [],
        totalDebits: 0,
        totalCredits: 0,
        debits: 0,
        credits: 0,
        finalBalance: 0,
      });
    });

    if (allJournalEntries.value) {
      allJournalEntries.value.forEach(entry => {
        entry.lines.forEach(line => {
          const accountData = accountsMap.get(line.accountId);
          if (accountData) {
            if (line.debit !== undefined && line.debit > 0) {
              accountData.debitEntries.push(line.debit);
              accountData.totalDebits += line.debit;
              accountData.debits += line.debit;
            }
            if (line.credit !== undefined && line.credit > 0) {
              accountData.creditEntries.push(line.credit);
              accountData.totalCredits += line.credit;
              accountData.credits += line.credit;
            }
          }
        });
      });
    }

    accountsMap.forEach(accountData => {
      const accountDetails = allAccounts.value.find(acc => acc.id === accountData.accountId);
      if (accountDetails) {
        const isDebitNature = ['asset', 'expense'].includes(accountDetails.type);
        if (isDebitNature) {
          accountData.finalBalance = accountData.totalDebits - accountData.totalCredits;
        } else {
          accountData.finalBalance = accountData.totalCredits - accountData.totalDebits;
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
      }
    });

    const estoqueFinalAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');
    const totalEstoqueFinalValue = stockControlStore.balances.reduce((sum, pb) => sum + pb.totalValue, 0);


    if (estoqueFinalAccount) {
      estoqueFinalAccount.debitEntries = [];
      estoqueFinalAccount.creditEntries = [];
      estoqueFinalAccount.totalDebits = 0;
      estoqueFinalAccount.totalCredits = 0;
      estoqueFinalAccount.debits = 0;
      estoqueFinalAccount.credits = 0;

      if (totalEstoqueFinalValue > 0) {
        estoqueFinalAccount.debitEntries.push(totalEstoqueFinalValue);
        estoqueFinalAccount.totalDebits = totalEstoqueFinalValue;
        estoqueFinalAccount.debits = totalEstoqueFinalValue;
        estoqueFinalAccount.finalBalance = totalEstoqueFinalValue;
      } else {
        estoqueFinalAccount.finalBalance = 0;
      }
    }

    const cmvAccount = accountsMap.get(accountStore.getAccountByName('CMV')?.id || '');
    const comprasDeMercadoriaAccount = accountsMap.get(accountStore.getAccountByName('Compras de Mercadoria')?.id || '');
    const currentEstoqueFinalAccount = accountsMap.get(accountStore.getAccountByName('Estoque Final')?.id || '');

    if (cmvAccount && comprasDeMercadoriaAccount && currentEstoqueFinalAccount) {
      const estoqueInicialMaisCompras = comprasDeMercadoriaAccount.finalBalance;
      const estoqueFinal = currentEstoqueFinalAccount.finalBalance;

      let cmvCalculado = estoqueInicialMaisCompras - estoqueFinal;

      if (cmvCalculado < 0) {
        cmvCalculado = 0;
      }

      cmvAccount.debitEntries = [];
      cmvAccount.creditEntries = [];
      cmvAccount.totalDebits = 0;
      cmvAccount.totalCredits = 0;
      cmvAccount.debits = 0;
      cmvAccount.credits = 0;


      if (estoqueInicialMaisCompras > 0) {
          cmvAccount.debitEntries.push(estoqueInicialMaisCompras);
          cmvAccount.totalDebits += estoqueInicialMaisCompras;
          cmvAccount.debits += estoqueInicialMaisCompras;
      }

      if (estoqueFinal > 0) {
          cmvAccount.creditEntries.push(estoqueFinal);
          cmvAccount.totalCredits += estoqueFinal;
          cmvAccount.credits += estoqueFinal;
      }
      
      cmvAccount.finalBalance = cmvCalculado;
    }

    const resultadoBrutoAccount = accountsMap.get(accountStore.getAccountByName('Resultado Bruto')?.id || '');
    if (resultadoBrutoAccount) {
      resultadoBrutoAccount.debitEntries = [];
      resultadoBrutoAccount.creditEntries = [];
      resultadoBrutoAccount.totalDebits = 0;
      resultadoBrutoAccount.totalCredits = 0;
      resultadoBrutoAccount.debits = 0;
      resultadoBrutoAccount.credits = 0;

      const receitaVendasContaObj = accountsMap.get(accountStore.getAccountByName('Receita de Vendas')?.id || '');
      const netSalesRevenue = receitaVendasContaObj ? receitaVendasContaObj.finalBalance : 0;

      const costOfGoodsSold = cmvAccount ? cmvAccount.finalBalance : 0;

      const calculatedGrossProfit = netSalesRevenue - costOfGoodsSold;

      if (netSalesRevenue > 0) {
          resultadoBrutoAccount.creditEntries.push(netSalesRevenue);
          resultadoBrutoAccount.totalCredits = netSalesRevenue;
          resultadoBrutoAccount.credits = netSalesRevenue;
      }
      if (costOfGoodsSold > 0) {
          resultadoBrutoAccount.debitEntries.push(costOfGoodsSold);
          resultadoBrutoAccount.totalDebits = costOfGoodsSold;
          resultadoBrutoAccount.debits = costOfGoodsSold;
      }

      resultadoBrutoAccount.finalBalance = calculatedGrossProfit;
    }
    
    const reservaDeLucroAccount = accountsMap.get(accountStore.getAccountByName('Reserva de Lucro')?.id || '');
    if (reservaDeLucroAccount) {
        reservaDeLucroAccount.debitEntries = [];
        reservaDeLucroAccount.creditEntries = [];
        reservaDeLucroAccount.totalDebits = 0;
        reservaDeLucroAccount.totalCredits = 0;
        reservaDeLucroAccount.debits = 0;
        reservaDeLucroAccount.credits = 0;

        const lucroBruto = resultadoBrutoAccount ? resultadoBrutoAccount.finalBalance : 0;

        if (lucroBruto > 0) {
            reservaDeLucroAccount.creditEntries.push(lucroBruto);
            reservaDeLucroAccount.totalCredits = lucroBruto;
            reservaDeLucroAccount.credits = lucroBruto;
            reservaDeLucroAccount.finalBalance = lucroBruto;
        } else if (lucroBruto < 0) {
            reservaDeLucroAccount.finalBalance = 0;
        } else {
            reservaDeLucroAccount.finalBalance = 0;
        }
    }

    const finalLedgerAccounts: LedgerAccount[] = [];

    Array.from(accountsMap.values())
      .filter(account =>
          account.totalDebits > 0 ||
          account.totalCredits > 0 ||
          account.accountName === 'Resultado Bruto' ||
          account.accountName === 'Estoque Final' ||
          account.accountName === 'CMV' ||
          account.accountName.includes('ICMS a') ||
          account.accountName === 'C/C ICMS (Zerada)' ||
          account.accountName === 'Reserva de Lucro'
      )
      .sort((a, b) => {
        const orderA = customAccountOrder.get(a.accountName) || Infinity;
        const orderB = customAccountOrder.get(b.accountName) || Infinity;
        return orderA - orderB;
      })
      .forEach(account => finalLedgerAccounts.push(account));

    return finalLedgerAccounts;
  });

  const getAccountBalance = (name: string): number => {
      const account = ledgerAccounts.value.find(acc => acc.accountName === name);
      return account ? account.finalBalance : 0;
  };

  const dreData = computed(() => {
    const receitaBrutaVendas = getAccountBalance('Receita de Vendas');
    const icmsSobreVendas = getAccountBalance('ICMS sobre Vendas');
    const deducoesReceitaBruta = icmsSobreVendas;

    const receitaLiquidaVendas = receitaBrutaVendas - deducoesReceitaBruta;

    const cmv = getAccountBalance('CMV');

    const lucroBruto = receitaLiquidaVendas - cmv;

    const lucroLiquido = lucroBruto;

    return {
      receitaBrutaVendas,
      deducoesReceitaBruta,
      receitaLiquidaVendas,
      cmv,
      lucroBruto,
      lucroLiquido,
    };
  });

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
    const lucroLiquidoExercicio = dreData.value.lucroLiquido;
    const reservaDeLucroTotal = saldoReservaDeLucroExistente + lucroLiquidoExercicio;

    const totalPatrimonioLiquido =
      capitalSocialIntegralizado +
      (reservaDeLucroTotal > 0 ? reservaDeLucroTotal : 0);

    const totalPassivoEPatrimonioLiquido = totalDoPassivo + totalPatrimonioLiquido;

    const balanceDifference = totalDoAtivo - totalPassivoEPatrimonioLiquido;
    const isBalanced = Math.abs(balanceDifference) < 0.01;

    return {
      ativoCirculante,
      disponibilidades,
      caixa, caixaCef, bancoItau, bancoBradesco,
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

      balanceDifference,
      isBalanced,
    };
  });

  const getVariationDetails = (value: number, accountType: 'asset' | 'liability' | 'equity', description: string) => {
      let variationValue = value;
      let variationType: 'Positiva' | 'Negativa' = 'Positiva';
      let activityType: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL' = 'Operacional';

      if (accountType === 'asset') {
          variationType = 'Negativa';
          if (value > 0) {
              variationValue = -Math.abs(value);
          } else {
              variationValue = Math.abs(value);
          }
      } else if (accountType === 'liability' || accountType === 'equity') {
          variationType = 'Positiva';
          if (value < 0) {
               variationValue = -Math.abs(value);
          } else {
              variationValue = Math.abs(value);
          }
      }

      if (description.includes('(-) Capital Social a Integralizar')) {
          variationValue = -Math.abs(value);
          variationType = 'Negativa';
      }

      if (accountType === 'asset' && (description.includes('Imobilizado') || description.includes('Móveis e Utensílios'))) {
          activityType = 'Investimento';
      } else if (accountType === 'equity' && (description.includes('Capital Social') || description.includes('Integralizar'))) {
          activityType = 'Financiamento';
      } else if (accountType === 'equity' && description.includes('Reservas')) {
          activityType = 'Lucro/PL';
      } else if (description.includes('Despesas com Pessoal')) {
          activityType = 'Operacional';
      }
      else if (['Caixa Econômica Federal', 'Caixa', 'Banco Itaú', 'Banco Bradesco'].includes(description)) {
        activityType = 'Operacional';
      }
      else if (description === 'Clientes' || description === 'Fornecedores') {
        activityType = 'Operacional';
      }
      else if (description === 'Estoque de Mercadorias') {
        activityType = 'Operacional';
      }
      else if (description.includes('Imposto a Pagar') || description.includes('ICMS a Recolher')) {
        activityType = 'Operacional';
      }
      else if (description === 'Lucro Líquido do Exercício') {
        activityType = 'Lucro/PL';
      }


      return { variationValue, variationType, activityType };
  };

  const variationData = computed<VariationEntry[]>(() => {
    const data: VariationEntry[] = [];
    const bsd = balanceSheetData.value;
    const lled = dreData.value.lucroLiquido;

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
    }

    const totalPassivoPrincipal = bsd.totalPassivoEPatrimonioLiquido;
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
    const { variationValue: pncVal, variationType: pncType, activityType: pncAct } = getVariationDetails(passivoNaoCirculanteValor, 'liability', 'Passivo Não Circulante');
    data.push({ description: 'Passivo Não Circulante', value: passivoNaoCirculanteValor, type: 'Passivo', variationType: pncType, signedVariationValue: pncVal, activity: pncAct, isSubtotal: true });


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

    if (lled !== 0) {
        const { variationValue, variationType, activityType } = getVariationDetails(lled, 'equity', 'Lucro Líquido do Exercício');
        data.push({ description: 'Lucro Líquido do Exercício', value: lled, type: 'Lucro do Exercício', variationType, signedVariationValue: variationValue, activity: activityType, isMainCategory: true });
    }

    return data;
  });

  return {
    ledgerAccounts,
    dreData,
    balanceSheetData,
    variationData,
  };
});
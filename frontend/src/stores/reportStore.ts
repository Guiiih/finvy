import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { LedgerAccount, ProductBalance } from '@/types/index'

interface ReportData {
  ledgerAccounts: LedgerAccount[]
  trialBalanceData: LedgerAccount[]
  dreData: {
    receitaBrutaVendas: number
    deducoesReceitaBruta: number
    receitaLiquidaVendas: number
    cmv: number
    lucroBruto: number
    lucroLiquido: number
  }
  balanceSheetData: {
    totalDoAtivo: number
    totalDoPassivo: number
    totalPatrimonioLiquido: number
    totalPassivoEPatrimonioLiquido: number
    isBalanced: boolean
    ativoCirculante: number
    disponibilidades: number
    caixa: number
    caixaCef: number
    bancoItau: number
    bancoBradesco: number
    clientes: number
    estoqueDeMercadorias: number
    ativoNaoCirculante: number
    moveisEUtensilios: number
    passivoCirculante: number
    fornecedores: number
    despesasComPessoal: number
    salariosAPagar: number
    impostoAPagar: number
    icmsARecolher: number
    icmsARecuperar: number
    passivoNaoCirculante: number
    capitalSocial: number
    capitalSocialSubscrito: number
    capitalAIntegralizar: number
    reservas: number
    reservaDeLucro: number
    balanceDifference: number
  }
  stockBalances: ProductBalance[]
}

interface VariationEntry {
  description: string
  value: number
  type: 'Ativo' | 'Passivo' | 'Patrimônio Líquido' | 'Lucro do Exercício'
  variationType: 'Positiva' | 'Negativa'
  signedVariationValue: number
  activity: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL'
  isMainCategory?: boolean
  isSubtotal?: boolean
}

export type { LedgerAccount }

export const useReportStore = defineStore('report', () => {
  const reports = ref<ReportData | null>(null)
  const trialBalance = ref<LedgerAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReports(startDate?: string, endDate?: string) {
    loading.value = true
    error.value = null
    try {
      const params: { startDate?: string; endDate?: string } = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const data = await api.get<ReportData>('/reports/generate', { params })
      reports.value = data
    } catch (err: unknown) {
      console.error('Erro ao buscar relatórios:', err)
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar relatórios.'
      } else {
        error.value = 'Falha ao buscar relatórios.'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchTrialBalance(startDate?: string, endDate?: string) {
    loading.value = true
    error.value = null
    try {
      const params: { startDate?: string; endDate?: string } = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const data = await api.get<{ ledgerAccounts: LedgerAccount[] }>('/trial-balance', { params })
      trialBalance.value = data.ledgerAccounts
    } catch (err: unknown) {
      console.error('Erro ao buscar balancete:', err)
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao buscar balancete.'
      } else {
        error.value = 'Falha ao buscar balancete.'
      }
    } finally {
      loading.value = false
    }
  }

  const ledgerAccounts = computed<LedgerAccount[]>(() => reports.value?.ledgerAccounts || [])
  const trialBalanceData = computed<LedgerAccount[]>(() => trialBalance.value || [])
  const dreData = computed(
    () =>
      reports.value?.dreData || {
        receitaBrutaVendas: 0,
        deducoesReceitaBruta: 0,
        receitaLiquidaVendas: 0,
        cmv: 0,
        lucroBruto: 0,
        lucroLiquido: 0,
      },
  )
  const balanceSheetData = computed(
    () =>
      reports.value?.balanceSheetData || {
        totalDoAtivo: 0,
        totalDoPassivo: 0,
        totalPatrimonioLiquido: 0,
        totalPassivoEPatrimonioLiquido: 0,
        isBalanced: false,
        ativoCirculante: 0,
        disponibilidades: 0,
        caixa: 0,
        caixaCef: 0,
        bancoItau: 0,
        bancoBradesco: 0,
        clientes: 0,
        estoqueDeMercadorias: 0,
        ativoNaoCirculante: 0,
        moveisEUtensilios: 0,
        passivoCirculante: 0,
        fornecedores: 0,
        despesasComPessoal: 0,
        salariosAPagar: 0,
        impostoAPagar: 0,
        icmsARecolher: 0,
        icmsARecuperar: 0,
        passivoNaoCirculante: 0,
        capitalSocial: 0,
        capitalSocialSubscrito: 0,
        capitalAIntegralizar: 0,
        reservas: 0,
        reservaDeLucro: 0,
        balanceDifference: 0,
      },
  )
  const stockBalances = computed(() => reports.value?.stockBalances || [])

  const getVariationDetails = (
    value: number,
    accountType: 'asset' | 'liability' | 'equity',
    description: string,
  ) => {
    let variationValue = value
    let variationType: 'Positiva' | 'Negativa' = 'Positiva'
    let activityType: 'Operacional' | 'Investimento' | 'Financiamento' | 'Lucro/PL' = 'Operacional'

    if (accountType === 'asset') {
      variationType = 'Negativa'
      if (value > 0) {
        variationValue = -Math.abs(value)
      } else {
        variationValue = Math.abs(value)
      }
    } else if (accountType === 'liability' || accountType === 'equity') {
      variationType = 'Positiva'
      if (value < 0) {
        variationValue = -Math.abs(value)
      } else {
        variationValue = Math.abs(value)
      }
    }

    if (description.includes('(-) Capital Social a Integralizar')) {
      variationValue = -Math.abs(value)
      variationType = 'Negativa'
    }

    if (
      accountType === 'asset' &&
      (description.includes('Imobilizado') || description.includes('Móveis e Utensílios'))
    ) {
      activityType = 'Investimento'
    } else if (
      accountType === 'equity' &&
      (description.includes('Capital Social') || description.includes('Integralizar'))
    ) {
      activityType = 'Financiamento'
    } else if (accountType === 'equity' && description.includes('Reservas')) {
      activityType = 'Lucro/PL'
    } else if (description.includes('Despesas com Pessoal')) {
      activityType = 'Operacional'
    } else if (
      ['Caixa Econômica Federal', 'Caixa', 'Banco Itaú', 'Banco Bradesco'].includes(description)
    ) {
      activityType = 'Operacional'
    } else if (description === 'Clientes' || description === 'Fornecedores') {
      activityType = 'Operacional'
    } else if (description === 'Estoque de Mercadorias') {
      activityType = 'Operacional'
    } else if (description.includes('Imposto a Pagar') || description.includes('ICMS a Recolher')) {
      activityType = 'Operacional'
    } else if (description === 'Lucro Líquido do Exercício') {
      activityType = 'Lucro/PL'
    }

    return { variationValue, variationType, activityType }
  }

  const variationData = computed<VariationEntry[]>(() => {
    const data: VariationEntry[] = []
    const bsd = balanceSheetData.value
    const lled = dreData.value.lucroLiquido

    const totalAtivo = bsd.totalDoAtivo
    if (totalAtivo !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        totalAtivo,
        'asset',
        'Ativo',
      )
      data.push({
        description: 'Ativo',
        value: totalAtivo,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isMainCategory: true,
      })
    }

    const ativoCirculanteTotal = bsd.ativoCirculante
    if (ativoCirculanteTotal !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        ativoCirculanteTotal,
        'asset',
        'Ativo Circulante',
      )
      data.push({
        description: 'Ativo Circulante',
        value: ativoCirculanteTotal,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isSubtotal: true,
      })
    }

    const disponibilidades = bsd.disponibilidades
    if (disponibilidades !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        disponibilidades,
        'asset',
        'Disponibilidades',
      )
      data.push({
        description: 'Disponibilidades',
        value: disponibilidades,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }
    if (bsd.caixa !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        bsd.caixa,
        'asset',
        'Caixa',
      )
      data.push({
        description: 'Caixa',
        value: bsd.caixa,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }
    if (bsd.caixaCef !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        bsd.caixaCef,
        'asset',
        'BCM - CEF',
      )
      data.push({
        description: 'BCM - CEF',
        value: bsd.caixaCef,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }
    if (bsd.bancoItau !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        bsd.bancoItau,
        'asset',
        'BCM - Itau',
      )
      data.push({
        description: 'BCM - Itau',
        value: bsd.bancoItau,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }
    if (bsd.bancoBradesco !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        bsd.bancoBradesco,
        'asset',
        'BCM - Bradesco',
      )
      data.push({
        description: 'BCM - Bradesco',
        value: bsd.bancoBradesco,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const clientes = bsd.clientes
    if (clientes !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        clientes,
        'asset',
        'Clientes',
      )
      data.push({
        description: 'Clientes',
        value: clientes,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const estoqueDeMercadorias = bsd.estoqueDeMercadorias
    if (estoqueDeMercadorias !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        estoqueDeMercadorias,
        'asset',
        'Estoque de Mercadorias',
      )
      data.push({
        description: 'Estoque de Mercadorias',
        value: estoqueDeMercadorias,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const ativoNaoCirculanteTotal = bsd.ativoNaoCirculante
    if (ativoNaoCirculanteTotal !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        ativoNaoCirculanteTotal,
        'asset',
        'Ativo Não Circulante',
      )
      data.push({
        description: 'Ativo Não Circulante',
        value: ativoNaoCirculanteTotal,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isSubtotal: true,
      })
    }
    const moveisEUtensilios = bsd.moveisEUtensilios
    if (moveisEUtensilios !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        moveisEUtensilios,
        'asset',
        'Imobilizado',
      )
      data.push({
        description: 'Imobilizado',
        value: moveisEUtensilios,
        type: 'Ativo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const totalPassivoPrincipal = bsd.totalPassivoEPatrimonioLiquido
    if (totalPassivoPrincipal !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        totalPassivoPrincipal,
        'liability',
        'Passivo',
      )
      data.push({
        description: 'Passivo',
        value: totalPassivoPrincipal,
        type: 'Passivo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isMainCategory: true,
      })
    }

    const passivoCirculanteTotal = bsd.passivoCirculante
    if (passivoCirculanteTotal !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        passivoCirculanteTotal,
        'liability',
        'Passivo Circulante',
      )
      data.push({
        description: 'Passivo Circulante',
        value: passivoCirculanteTotal,
        type: 'Passivo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isSubtotal: true,
      })
    }

    const fornecedores = bsd.fornecedores
    if (fornecedores !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        fornecedores,
        'liability',
        'Fornecedores',
      )
      data.push({
        description: 'Fornecedores',
        value: fornecedores,
        type: 'Passivo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const impostosAPagarValor = bsd.impostoAPagar
    if (impostosAPagarValor !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        impostosAPagarValor,
        'liability',
        'Imposto a Pagar',
      )
      data.push({
        description: 'Imposto a Pagar',
        value: impostosAPagarValor,
        type: 'Passivo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
      if (bsd.icmsARecolher !== 0) {
        const {
          variationValue: icmsSigned,
          variationType: icmsVarType,
          activityType: icmsActType,
        } = getVariationDetails(bsd.icmsARecolher, 'liability', 'ICMS a Recolher')
        data.push({
          description: 'ICMS a Recolher',
          value: bsd.icmsARecolher,
          type: 'Passivo',
          variationType: icmsVarType,
          signedVariationValue: icmsSigned,
          activity: icmsActType,
        })
      }
    }

    const salariosAPagar = bsd.salariosAPagar
    if (salariosAPagar !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        salariosAPagar,
        'liability',
        'Despesas com Pessoal',
      )
      data.push({
        description: 'Despesas com Pessoal',
        value: salariosAPagar,
        type: 'Passivo',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    const passivoNaoCirculanteValor = bsd.passivoNaoCirculante
    const {
      variationValue: pncVal,
      variationType: pncType,
      activityType: pncAct,
    } = getVariationDetails(passivoNaoCirculanteValor, 'liability', 'Passivo Não Circulante')
    data.push({
      description: 'Passivo Não Circulante',
      value: passivoNaoCirculanteValor,
      type: 'Passivo',
      variationType: pncType,
      signedVariationValue: pncVal,
      activity: pncAct,
      isSubtotal: true,
    })

    const totalPatrimonioLiquido = bsd.totalPatrimonioLiquido
    if (totalPatrimonioLiquido !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        totalPatrimonioLiquido,
        'equity',
        'Patrimônio Líquido',
      )
      data.push({
        description: 'Patrimônio Líquido',
        value: totalPatrimonioLiquido,
        type: 'Patrimônio Líquido',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isMainCategory: true,
      })
    }

    const capitalSocial = bsd.capitalSocial
    if (capitalSocial !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        capitalSocial,
        'equity',
        'Capital Social',
      )
      data.push({
        description: 'Capital Social',
        value: capitalSocial,
        type: 'Patrimônio Líquido',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
      if (bsd.capitalSocialSubscrito !== 0) {
        const {
          variationValue: subscritoSigned,
          variationType: subscritoVarType,
          activityType: subscritoActType,
        } = getVariationDetails(bsd.capitalSocialSubscrito, 'equity', 'Capital Social Subscrito')
        data.push({
          description: 'Capital Social Subscrito',
          value: bsd.capitalSocialSubscrito,
          type: 'Patrimônio Líquido',
          variationType: subscritoVarType,
          signedVariationValue: subscritoSigned,
          activity: subscritoActType,
        })
      }
      if (bsd.capitalAIntegralizar !== 0) {
        const {
          variationValue: integralizarSigned,
          variationType: integralizarVarType,
          activityType: integralizarActType,
        } = getVariationDetails(
          bsd.capitalAIntegralizar,
          'equity',
          '(-) Capital Social a Integralizar',
        )
        data.push({
          description: '(-) Capital Social a Integralizar',
          value: bsd.capitalAIntegralizar,
          type: 'Patrimônio Líquido',
          variationType: integralizarVarType,
          signedVariationValue: integralizarSigned,
          activity: integralizarActType,
        })
      }
    }

    const reservaDeLucro = bsd.reservaDeLucro
    if (reservaDeLucro !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        reservaDeLucro,
        'equity',
        'Reservas',
      )
      data.push({
        description: 'Reservas',
        value: reservaDeLucro,
        type: 'Patrimônio Líquido',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
      data.push({
        description: 'Reserva de Lucro',
        value: reservaDeLucro,
        type: 'Patrimônio Líquido',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
      })
    }

    if (lled !== 0) {
      const { variationValue, variationType, activityType } = getVariationDetails(
        lled,
        'equity',
        'Lucro Líquido do Exercício',
      )
      data.push({
        description: 'Lucro Líquido do Exercício',
        value: lled,
        type: 'Lucro do Exercício',
        variationType,
        signedVariationValue: variationValue,
        activity: activityType,
        isMainCategory: true,
      })
    }

    return data
  })

  return {
    reports,
    loading,
    error,
    fetchReports,
    fetchTrialBalance,
    ledgerAccounts,
    trialBalanceData,
    dreData,
    balanceSheetData,
    stockBalances,
    variationData,
  }
})
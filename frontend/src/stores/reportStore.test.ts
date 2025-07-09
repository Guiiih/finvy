import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReportStore } from './reportStore'
import { api } from '@/services/api'
import type { LedgerAccount} from '@/types'
import { ref, computed } from 'vue'

vi.mock('./reportStore', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    useReportStore: vi.fn(() => ({
      reports: ref(null),
      trialBalance: ref([]),
      loading: ref(false),
      error: ref(null),
      fetchReports: vi.fn(),
      fetchTrialBalance: vi.fn(),
      ledgerAccounts: computed(() => []),
      trialBalanceData: computed(() => []),
      dreData: computed(() => ({
        receitaBrutaVendas: 0,
        deducoesReceitaBruta: 0,
        receitaLiquidaVendas: 0,
        cmv: 0,
        lucroBruto: 0,
        lucroLiquido: 0,
      })),
      balanceSheetData: computed(() => ({
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
      })),
      stockBalances: computed(() => []),
      variationData: computed(() => []),
    })),
  }
})

describe('reportStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should fetch reports successfully', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [],
      trialBalanceData: [],
      dreData: {
        receitaBrutaVendas: 0,
        deducoesReceitaBruta: 0,
        receitaLiquidaVendas: 0,
        cmv: 0,
        lucroBruto: 0,
        lucroLiquido: 0,
      },
      balanceSheetData: {
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
      stockBalances: [],
    }
    ;(api.get as Mock).mockResolvedValueOnce(mockReportData)

    await store.fetchReports('2024-01-01', '2024-12-31')

    expect(store.reports).toEqual(mockReportData)
    expect(store.loading).toBe(false)
  })

  it('should handle error when fetching reports', async () => {
    const store = useReportStore()
    const errorMessage = 'Network Error'
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await store.fetchReports('2024-01-01', '2024-12-31')

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should fetch trial balance successfully', async () => {
    const store = useReportStore()
    const mockTrialBalance: LedgerAccount[] = [{ account_id: '1', accountName: 'Cash', type: 'asset', debitEntries: [], creditEntries: [], totalDebits: 100, totalCredits: 50, debits: 0, credits: 0, finalBalance: 50 }]
    ;(api.get as Mock).mockResolvedValueOnce({ ledgerAccounts: mockTrialBalance })

    await store.fetchTrialBalance('2024-01-01', '2024-12-31')

    expect(store.trialBalanceData).toEqual(mockTrialBalance)
    expect(store.loading).toBe(false)
  })

  it('should handle error when fetching trial balance', async () => {
    const store = useReportStore()
    const errorMessage = 'Network Error'
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await store.fetchTrialBalance('2024-01-01', '2024-12-31')

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should return correct ledgerAccounts computed property', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [{ account_id: '1', accountName: 'Cash', type: 'asset', debitEntries: [], creditEntries: [], totalDebits: 100, totalCredits: 50, debits: 0, credits: 0, finalBalance: 50 }],
      trialBalanceData: [],
      dreData: { receitaBrutaVendas: 0, deducoesReceitaBruta: 0, receitaLiquidaVendas: 0, cmv: 0, lucroBruto: 0, lucroLiquido: 0 },
      balanceSheetData: { totalDoAtivo: 0, totalDoPassivo: 0, totalPatrimonioLiquido: 0, totalPassivoEPatrimonioLiquido: 0, isBalanced: false, ativoCirculante: 0, disponibilidades: 0, caixa: 0, caixaCef: 0, bancoItau: 0, bancoBradesco: 0, clientes: 0, estoqueDeMercadorias: 0, ativoNaoCirculante: 0, moveisEUtensilios: 0, passivoCirculante: 0, fornecedores: 0, despesasComPessoal: 0, salariosAPagar: 0, impostoAPagar: 0, icmsARecolher: 0, icmsARecuperar: 0, passivoNaoCirculante: 0, capitalSocial: 0, capitalSocialSubscrito: 0, capitalAIntegralizar: 0, reservas: 0, reservaDeLucro: 0, balanceDifference: 0 },
      stockBalances: [],
    }
    ;(api.get as Mock).mockResolvedValueOnce(mockReportData)
    await store.fetchReports()

    expect(store.ledgerAccounts).toEqual(mockReportData.ledgerAccounts)
  })

  it('should return correct trialBalanceData computed property', async () => {
    const store = useReportStore()
    const mockTrialBalance: LedgerAccount[] = [{ account_id: '1', accountName: 'Cash', type: 'asset', debitEntries: [], creditEntries: [], totalDebits: 100, totalCredits: 50, debits: 0, credits: 0, finalBalance: 50 }]
    expect(store.trialBalanceData).toEqual(mockTrialBalance)
  })

  it('should return correct dreData computed property', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [],
      trialBalanceData: [],
      dreData: { receitaBrutaVendas: 100, deducoesReceitaBruta: 10, receitaLiquidaVendas: 90, cmv: 50, lucroBruto: 40, lucroLiquido: 30 },
      balanceSheetData: { totalDoAtivo: 0, totalDoPassivo: 0, totalPatrimonioLiquido: 0, totalPassivoEPatrimonioLiquido: 0, isBalanced: false, ativoCirculante: 0, disponibilidades: 0, caixa: 0, caixaCef: 0, bancoItau: 0, bancoBradesco: 0, clientes: 0, estoqueDeMercadorias: 0, ativoNaoCirculante: 0, moveisEUtensilios: 0, passivoCirculante: 0, fornecedores: 0, despesasComPessoal: 0, salariosAPagar: 0, impostoAPagar: 0, icmsARecolher: 0, icmsARecuperar: 0, passivoNaoCirculante: 0, capitalSocial: 0, capitalSocialSubscrito: 0, capitalAIntegralizar: 0, reservas: 0, reservaDeLucro: 0, balanceDifference: 0 },
      stockBalances: [],
    }
    store.reports = mockReportData

    expect(store.dreData).toEqual(mockReportData.dreData)
  })

  it('should return correct balanceSheetData computed property', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [],
      trialBalanceData: [],
      dreData: { receitaBrutaVendas: 0, deducoesReceitaBruta: 0, receitaLiquidaVendas: 0, cmv: 0, lucroBruto: 0, lucroLiquido: 0 },
      balanceSheetData: { totalDoAtivo: 100, totalDoPassivo: 50, totalPatrimonioLiquido: 50, totalPassivoEPatrimonioLiquido: 100, isBalanced: true, ativoCirculante: 0, disponibilidades: 0, caixa: 0, caixaCef: 0, bancoItau: 0, bancoBradesco: 0, clientes: 0, estoqueDeMercadorias: 0, ativoNaoCirculante: 0, moveisEUtensilios: 0, passivoCirculante: 0, fornecedores: 0, despesasComPessoal: 0, salariosAPagar: 0, impostoAPagar: 0, icmsARecolher: 0, icmsARecuperar: 0, passivoNaoCirculante: 0, capitalSocial: 0, capitalSocialSubscrito: 0, capitalAIntegralizar: 0, reservas: 0, reservaDeLucro: 0, balanceDifference: 0 },
      stockBalances: [],
    }
    store.reports = mockReportData

    expect(store.balanceSheetData).toEqual(mockReportData.balanceSheetData)
  })

  it('should return correct stockBalances computed property', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [],
      trialBalanceData: [],
      dreData: { receitaBrutaVendas: 100, deducoesReceitaBruta: 10, receitaLiquidaVendas: 90, cmv: 50, lucroBruto: 40, lucroLiquido: 30 },
      balanceSheetData: { totalDoAtivo: 0, totalDoPassivo: 0, totalPatrimonioLiquido: 0, totalPassivoEPatrimonioLiquido: 0, isBalanced: false, ativoCirculante: 0, disponibilidades: 0, caixa: 0, caixaCef: 0, bancoItau: 0, bancoBradesco: 0, clientes: 0, estoqueDeMercadorias: 0, ativoNaoCirculante: 0, moveisEUtensilios: 0, passivoCirculante: 0, fornecedores: 0, despesasComPessoal: 0, salariosAPagar: 0, impostoAPagar: 0, icmsARecolher: 0, icmsARecuperar: 0, passivoNaoCirculante: 0, capitalSocial: 0, capitalSocialSubscrito: 0, capitalAIntegralizar: 0, reservas: 0, reservaDeLucro: 0, balanceDifference: 0 },
      stockBalances: [{ product_id: '1', productName: 'Product A', quantity: 10, unit_cost: 5, totalValue: 50 }],
    }
    store.reports = mockReportData

    expect(store.stockBalances).toEqual(mockReportData.stockBalances)
  })

  it('should return correct variationData computed property', async () => {
    const store = useReportStore()
    const mockReportData = {
      ledgerAccounts: [],
      trialBalanceData: [],
      dreData: { receitaBrutaVendas: 1000, deducoesReceitaBruta: 0, receitaLiquidaVendas: 1000, cmv: 0, lucroBruto: 0, lucroLiquido: 500 },
      balanceSheetData: {
        totalDoAtivo: 1000,
        totalDoPassivo: 200,
        totalPatrimonioLiquido: 800,
        totalPassivoEPatrimonioLiquido: 1000,
        isBalanced: true,
        ativoCirculante: 500,
        disponibilidades: 300,
        caixa: 100,
        caixaCef: 100,
        bancoItau: 50,
        bancoBradesco: 50,
        clientes: 100,
        estoqueDeMercadorias: 100,
        ativoNaoCirculante: 500,
        moveisEUtensilios: 500,
        passivoCirculante: 150,
        fornecedores: 100,
        despesasComPessoal: 0,
        salariosAPagar: 50,
        impostoAPagar: 0,
        icmsARecolher: 0,
        icmsARecuperar: 0,
        passivoNaoCirculante: 50,
        capitalSocial: 700,
        capitalSocialSubscrito: 700,
        capitalAIntegralizar: 0,
        reservas: 100,
        reservaDeLucro: 100,
        balanceDifference: 0,
      },
      stockBalances: [],
    }
    store.reports = mockReportData

    const variationData = store.variationData

    expect(variationData).toBeInstanceOf(Array)
    expect(variationData.length).toBeGreaterThan(0)
    expect(variationData).toContainEqual(expect.objectContaining({
      description: 'Ativo',
      value: 1000,
      type: 'Ativo',
      variationType: 'Negativa',
      signedVariationValue: -1000,
      activity: 'Operacional',
      isMainCategory: true,
    }))

    expect(variationData).toContainEqual(expect.objectContaining({
      description: 'Lucro Líquido do Exercício',
      value: 500,
      type: 'Lucro do Exercício',
      variationType: 'Positiva',
      signedVariationValue: 500,
      activity: 'Lucro/PL',
      isMainCategory: true,
    }))
  })
})
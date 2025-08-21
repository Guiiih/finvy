import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, StockMovement } from '@/types/index'
import { api } from '@/services/api'
import { useAccountingPeriodStore } from './accountingPeriodStore'

// Define a interface para os dados de análise que virão da API
export interface ProductAnalytics {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalInventoryValue: number
  totalRevenue: number // Pode ser usado no futuro
  valueByCategory: { name: string; value: number }[]
}

export const useProductStore = defineStore('products', () => {
  // --- STATE ---
  const products = ref<Product[]>([])
  const analytics = ref<ProductAnalytics | null>(null)
  const movements = ref<StockMovement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalProducts = ref(0)

  const accountingPeriodStore = useAccountingPeriodStore()

  // --- GETTERS ---
  const getProductById = computed(() => (id: string) => {
    return products.value.find((product) => product.id === id)
  })

  // --- ACTIONS ---

  // Função auxiliar para obter os IDs da organização e período
  const getOrgAndPeriodIds = () => {
    const organization_id = accountingPeriodStore.activeAccountingPeriod?.organization_id
    const accounting_period_id = accountingPeriodStore.activeAccountingPeriod?.id
    if (!organization_id || !accounting_period_id) {
      throw new Error('Organização ou período contábil não selecionado.')
    }
    return { organization_id, accounting_period_id }
  }

  // Busca produtos com filtros
  async function fetchProducts(filters: {
    page?: number
    itemsPerPage?: number
    searchTerm?: string
    category?: string
    status?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const { organization_id, accounting_period_id } = getOrgAndPeriodIds()
      const response = await api.get<{ data: Product[]; total: number }>('/products', {
        params: {
          organization_id,
          accounting_period_id,
          page: filters.page || 1,
          limit: filters.itemsPerPage || 10,
          search: filters.searchTerm,
          category: filters.category,
          status: filters.status,
        },
      })
      products.value = response.data || []
      totalProducts.value = response.total || 0
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao buscar produtos.'
      console.error('Erro ao buscar produtos:', message)
      error.value = message
    } finally {
      loading.value = false
    }
  }

  // Busca dados de análise
  async function fetchAnalytics() {
    try {
      const { organization_id, accounting_period_id } = getOrgAndPeriodIds()
      const response = await api.get<ProductAnalytics>('/products/analytics', {
        params: { organization_id, accounting_period_id },
      })
      analytics.value = response
    } catch (err: unknown) {
      console.error('Erro ao buscar dados de análise:', err)
      // Não define um erro global para não impactar a UI principal
    }
  }

  // Busca movimentações de um produto
  async function fetchStockMovements(productId: string) {
    try {
      const response = await api.get<StockMovement[]>(`/products/${productId}/movements`)
      movements.value = response
    } catch (err: unknown) {
      console.error(`Erro ao buscar movimentações para o produto ${productId}:`, err)
    }
  }

  // Adiciona um novo produto
  async function addProduct(product: Omit<Product, 'id'>) {
    loading.value = true
    error.value = null
    try {
      const { organization_id, accounting_period_id } = getOrgAndPeriodIds()
      const payload = { ...product, organization_id, accounting_period_id }
      const newProduct = await api.post<Product, typeof payload>('/products', payload)
      // O ideal é recarregar a lista para manter a paginação correta
      await fetchProducts({ page: 1, itemsPerPage: 10 })
      return newProduct
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao adicionar produto.'
      console.error('Erro ao adicionar produto:', message)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Atualiza um produto existente
  async function updateProduct(id: string, updatedFields: Partial<Product>) {
    loading.value = true
    error.value = null
    try {
      const updatedProduct = await api.put<Product, Partial<Product>>(
        `/products/${id}`,
        updatedFields,
      )
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updatedProduct }
      }
      return updatedProduct
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar produto.'
      console.error('Erro ao atualizar produto:', message)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Deleta um produto
  async function deleteProduct(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/products/${id}`)
      // Remove da lista local e decrementa o total
      products.value = products.value.filter((p) => p.id !== id)
      totalProducts.value--
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao deletar produto.'
      console.error('Erro ao deletar produto:', message)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    products,
    analytics,
    movements,
    loading,
    error,
    totalProducts,
    // Getters
    getProductById,
    // Actions
    fetchProducts,
    fetchAnalytics,
    fetchStockMovements,
    addProduct,
    updateProduct,
    deleteProduct,
  }
})

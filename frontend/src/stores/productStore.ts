import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types/index'
import { api } from '@/services/api'
import { useAccountingPeriodStore } from './accountingPeriodStore'

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalProducts = ref(0)

  const accountingPeriodStore = useAccountingPeriodStore()

  const getAllProducts = computed(() => products.value)

  const getProductById = computed(() => (id: string) => {
    return products.value.find((product) => product.id === id)
  })

  const getProductByName = computed(() => (name: string) => {
    return products.value.find((product) => product.name === name)
  })

  async function fetchProducts(page: number = 1, itemsPerPage: number = 10) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        await accountingPeriodStore.fetchAccountingPeriods()
      }
      const productsData = await api.get<Product[]>('/products', {
        params: {
          organization_id: accountingPeriodStore.activeAccountingPeriod?.organization_id,
          accounting_period_id: accountingPeriodStore.activeAccountingPeriod?.id,
          _page: page,
          _limit: itemsPerPage,
        },
      })
      products.value = Array.isArray(productsData) ? productsData : []
    } catch (err: unknown) {
      console.error('Erro ao buscar produtos:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao buscar produtos.'
    } finally {
      loading.value = false
    }
  }

  async function addProduct(product: Omit<Product, 'id'>) {
    loading.value = true
    error.value = null
    try {
      if (!accountingPeriodStore.activeAccountingPeriod?.id) {
        throw new Error('Nenhum período contábil ativo selecionado.')
      }
      const payload = {
        ...product,
        organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
        accounting_period_id: accountingPeriodStore.activeAccountingPeriod.id,
      }
      const newProduct = await api.post<Product, Omit<Product, 'id'>>('/products', payload)
      products.value.push(newProduct)
      return newProduct
    } catch (err: unknown) {
      console.error('Erro ao adicionar produto:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar produto.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: string, updatedFields: Partial<Product>) {
    loading.value = true
    error.value = null
    try {
      const updatedProduct = await api.put<Product, Partial<Product>>(
        `/products/${id}`,
        updatedFields,
      )
      const index = products.value.findIndex((prod) => prod.id === id)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }
      return updatedProduct
    } catch (err: unknown) {
      console.error('Erro ao atualizar produto:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar produto.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/products/${id}`)
      products.value = products.value.filter((prod) => prod.id !== id)
    } catch (err: unknown) {
      console.error('Erro ao deletar produto:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao deletar produto.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    getAllProducts,
    getProductById,
    getProductByName,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
    totalProducts,
  }
})

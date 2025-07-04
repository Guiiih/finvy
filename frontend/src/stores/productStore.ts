import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '../types/index'
import { api } from '@/services/api'

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAllProducts = computed(() => products.value)

  const getProductById = computed(() => (id: string) => {
    return products.value.find((product) => product.id === id)
  })

  const getProductByName = computed(() => (name: string) => {
    return products.value.find((product) => product.name === name)
  })

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<Product[]>('/products')
      products.value = data
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
      const newProduct = await api.post<Product, Omit<Product, 'id'>>('/products', product)
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
  }
})

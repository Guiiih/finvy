import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from './productStore'
import { api } from '@/services/api'
import type { Product } from '@/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('productStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should fetch products successfully', async () => {
    const store = useProductStore()
    const mockProducts: Product[] = [{ id: '1', name: 'Product A', unit_cost: 10, current_stock: 100 }]
    ;(api.get as Mock).mockResolvedValueOnce(mockProducts)

    await store.fetchProducts()

    expect(store.products).toEqual(mockProducts)
    expect(store.loading).toBe(false)
  })

  it('should handle error when fetching products', async () => {
    const store = useProductStore()
    const errorMessage = 'Network Error'
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await store.fetchProducts()

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should add a product successfully', async () => {
    const store = useProductStore()
    const newProduct: Omit<Product, 'id'> = { name: 'Product B', unit_cost: 20, current_stock: 50 }
    const addedProduct: Product = { id: '2', ...newProduct }

    ;(api.post as Mock).mockResolvedValueOnce(addedProduct)

    const result = await store.addProduct(newProduct)

    expect(result).toEqual(addedProduct)
    expect(store.products).toContainEqual(addedProduct)
    expect(store.loading).toBe(false)
  })

  it('should handle error when adding a product', async () => {
    const store = useProductStore()
    const newProduct: Omit<Product, 'id'> = { name: 'Product B', unit_cost: 20, current_stock: 50 }
    const errorMessage = 'API Error'
    ;(api.post as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.addProduct(newProduct)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should update a product successfully', async () => {
    const store = useProductStore()
    const existingProduct: Product = { id: '1', name: 'Product A', unit_cost: 10, current_stock: 100 }
    store.products = [existingProduct]

    const updatedFields = { unit_cost: 12, current_stock: 90 }
    const updatedProduct: Product = { ...existingProduct, ...updatedFields }

    ;(api.put as Mock).mockResolvedValueOnce(updatedProduct)

    const result = await store.updateProduct('1', updatedFields)

    expect(result).toEqual(updatedProduct)
    expect(store.products[0]).toEqual(updatedProduct)
    expect(store.loading).toBe(false)
  })

  it('should handle error when updating a product', async () => {
    const store = useProductStore()
    const existingProduct: Product = { id: '1', name: 'Product A', unit_cost: 10, current_stock: 100 }
    store.products = [existingProduct]

    const updatedFields = { unit_cost: 12 }
    const errorMessage = 'API Error'
    ;(api.put as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.updateProduct('1', updatedFields)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should delete a product successfully', async () => {
    const store = useProductStore()
    const productToDelete: Product = { id: '1', name: 'Product A', unit_cost: 10, current_stock: 100 }
    store.products = [productToDelete]

    ;(api.delete as Mock).mockResolvedValueOnce(null)

    await store.deleteProduct('1')

    expect(store.products).not.toContainEqual(productToDelete)
    expect(store.loading).toBe(false)
  })

  it('should handle error when deleting a product', async () => {
    const store = useProductStore()
    const productToDelete: Product = { id: '1', name: 'Product A', unit_cost: 10, current_stock: 100 }
    store.products = [productToDelete]

    const errorMessage = 'API Error'
    ;(api.delete as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.deleteProduct('1')).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })
})
import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from './transactionStore'
import { useJournalEntryStore } from './journalEntryStore'
import { useProductStore } from './productStore'
import type { JournalEntry, Product } from '@/types'

// Mock dependencies
vi.mock('./journalEntryStore', () => ({
  useJournalEntryStore: vi.fn(() => ({
    addJournalEntry: vi.fn(),
  })),
}))

vi.mock('./productStore', () => ({
  useProductStore: vi.fn(() => ({
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
  })),
}))

describe('transactionStore', () => {
  let journalEntryStore: ReturnType<typeof useJournalEntryStore>
  let productStore: ReturnType<typeof useProductStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    journalEntryStore = useJournalEntryStore()
    productStore = useProductStore()
  })

  it('should record a sale successfully', async () => {
    const store = useTransactionStore()
    const saleDetails = {
      productId: 'prod1',
      quantity: 5,
      salePrice: 100,
      customerAccountId: 'acc-customer',
      revenueAccountId: 'acc-revenue',
      cogsAccountId: 'acc-cogs',
      inventoryAccountId: 'acc-inventory',
      date: '2024-07-08',
      description: 'Test Sale',
    }
    const mockProduct: Product = { id: 'prod1', name: 'Test Product', unit_cost: 50, current_stock: 100 }

    vi.mocked(productStore.getProductById).mockReturnValue(mockProduct)
        vi.mocked(journalEntryStore.addJournalEntry).mockResolvedValue({} as JournalEntry)
    vi.mocked(productStore.updateProduct).mockResolvedValue({} as Product)

    await store.recordSale(saleDetails)

    expect(productStore.getProductById).toHaveBeenCalledWith('prod1')
    expect(journalEntryStore.addJournalEntry).toHaveBeenCalledWith(expect.objectContaining({
      entry_date: '2024-07-08',
      description: 'Test Sale',
      lines: expect.arrayContaining([
        expect.objectContaining({ account_id: 'acc-customer', debit: 500, credit: 0 }),
        expect.objectContaining({ account_id: 'acc-revenue', debit: 0, credit: 500 }),
        expect.objectContaining({ account_id: 'acc-cogs', debit: 250, credit: 0 }),
        expect.objectContaining({ account_id: 'acc-inventory', debit: 0, credit: 250 }),
      ]),
    }))
    expect(productStore.updateProduct).toHaveBeenCalledWith('prod1', { current_stock: 95 })
  })

  it('should throw error if product not found during sale recording', async () => {
    const store = useTransactionStore()
    const saleDetails = {
      productId: 'prod-nonexistent',
      quantity: 5,
      salePrice: 100,
      customerAccountId: 'acc-customer',
      revenueAccountId: 'acc-revenue',
      cogsAccountId: 'acc-cogs',
      inventoryAccountId: 'acc-inventory',
      date: '2024-07-08',
      description: 'Test Sale',
    }

    vi.mocked(productStore.getProductById).mockReturnValue(undefined)

    await expect(store.recordSale(saleDetails)).rejects.toThrow('Produto com ID prod-nonexistent não encontrado.')

    expect(journalEntryStore.addJournalEntry).not.toHaveBeenCalled()
    expect(productStore.updateProduct).not.toHaveBeenCalled()
  })

  it('should handle error during journal entry addition', async () => {
    const store = useTransactionStore()
    const saleDetails = {
      productId: 'prod1',
      quantity: 5,
      salePrice: 100,
      customerAccountId: 'acc-customer',
      revenueAccountId: 'acc-revenue',
      cogsAccountId: 'acc-cogs',
      inventoryAccountId: 'acc-inventory',
      date: '2024-07-08',
      description: 'Test Sale',
    }
    const mockProduct: Product = { id: 'prod1', name: 'Test Product', unit_cost: 50, current_stock: 100 }
    const errorMessage = 'Failed to add journal entry'

    vi.mocked(productStore.getProductById).mockReturnValue(mockProduct)
    vi.mocked(journalEntryStore.addJournalEntry).mockRejectedValue(new Error(errorMessage))

    await expect(store.recordSale(saleDetails)).rejects.toThrow(errorMessage)

    expect(productStore.updateProduct).not.toHaveBeenCalled()
  })

  it('should handle error during product stock update', async () => {
    const store = useTransactionStore()
    const saleDetails = {
      productId: 'prod1',
      quantity: 5,
      salePrice: 100,
      customerAccountId: 'acc-customer',
      revenueAccountId: 'acc-revenue',
      cogsAccountId: 'acc-cogs',
      inventoryAccountId: 'acc-inventory',
      date: '2024-07-08',
      description: 'Test Sale',
    }
    const mockProduct: Product = { id: 'prod1', name: 'Test Product', unit_cost: 50, current_stock: 100 }
    const errorMessage = 'Failed to update product stock'

    vi.mocked(productStore.getProductById).mockReturnValue(mockProduct)
    vi.mocked(journalEntryStore.addJournalEntry).mockResolvedValue({} as JournalEntry)
    vi.mocked(productStore.updateProduct).mockRejectedValue(new Error(errorMessage))

    await expect(store.recordSale(saleDetails)).rejects.toThrow(errorMessage)
  })
})
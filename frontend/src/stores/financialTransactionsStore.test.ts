import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinancialTransactionsStore } from './financialTransactionsStore'
import { api } from '@/services/api'
import type { FinancialTransaction } from '@/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Financial Transactions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches financial transactions successfully', async () => {
    const store = useFinancialTransactionsStore()
    const mockPayables: FinancialTransaction[] = [{ id: '1', description: 'Rent', amount: 1000, due_date: '2024-01-01', created_at: '2024-01-01' }]
    const mockReceivables: FinancialTransaction[] = [{ id: '2', description: 'Sale', amount: 500, due_date: '2024-01-01', created_at: '2024-01-01' }]

    ;(api.get as Mock).mockResolvedValueOnce(mockPayables)
    ;(api.get as Mock).mockResolvedValueOnce(mockReceivables)

    await store.fetchFinancialTransactions()

    expect(store.payables).toEqual(mockPayables)
    expect(store.receivables).toEqual(mockReceivables)
    expect(store.loading).toBe(false)
  })

  it('handles error when fetching financial transactions', async () => {
    const store = useFinancialTransactionsStore()
    const errorMessage = 'Network Error'
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await store.fetchFinancialTransactions()

    expect(store.error).toBe(`Falha ao buscar transações financeiras.`)
    expect(store.loading).toBe(false)
  })

  it('adds a payable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const newTransaction = { description: 'New Rent', amount: 1200, due_date: '2024-02-01' }
    const addedTransaction: FinancialTransaction = { id: '3', created_at: '2024-02-01', ...newTransaction }

    ;(api.post as Mock).mockResolvedValueOnce(addedTransaction)

    const result = await store.addFinancialTransaction('payable', newTransaction)

    expect(result).toEqual(addedTransaction)
    expect(store.payables).toContainEqual(addedTransaction)
    expect(store.loading).toBe(false)
  })

  it('adds a receivable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const newTransaction = { description: 'New Sale', amount: 600, due_date: '2024-02-01' }
    const addedTransaction: FinancialTransaction = { id: '4', created_at: '2024-02-01', ...newTransaction }

    ;(api.post as Mock).mockResolvedValueOnce(addedTransaction)

    const result = await store.addFinancialTransaction('receivable', newTransaction)

    expect(result).toEqual(addedTransaction)
    expect(store.receivables).toContainEqual(addedTransaction)
    expect(store.loading).toBe(false)
  })

  it('handles error when adding a transaction', async () => {
    const store = useFinancialTransactionsStore()
    const newTransaction = { description: 'New Rent', amount: 1200, due_date: '2024-02-01' }
    const errorMessage = 'API Error'
    ;(api.post as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.addFinancialTransaction('payable', newTransaction)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(`Falha ao adicionar transação payable.`)
    expect(store.loading).toBe(false)
  })

  it('updates a payable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const existingTransaction: FinancialTransaction = { id: '1', description: 'Rent', amount: 1000, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.payables = [existingTransaction]

    const updatedFields = { amount: 1100, is_paid: true }
    const updatedTransaction: FinancialTransaction = { ...existingTransaction, ...updatedFields }

    ;(api.put as Mock).mockResolvedValueOnce(updatedTransaction)

    const result = await store.updateFinancialTransaction('payable', '1', updatedFields)

    expect(result).toEqual(updatedTransaction)
    expect(store.payables[0]).toEqual(updatedTransaction)
    expect(store.loading).toBe(false)
  })

  it('updates a receivable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const existingTransaction: FinancialTransaction = { id: '2', description: 'Sale', amount: 500, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.receivables = [existingTransaction]

    const updatedFields = { amount: 550, is_received: true }
    const updatedTransaction: FinancialTransaction = { ...existingTransaction, ...updatedFields }

    ;(api.put as Mock).mockResolvedValueOnce(updatedTransaction)

    const result = await store.updateFinancialTransaction('receivable', '2', updatedFields)

    expect(result).toEqual(updatedTransaction)
    expect(store.receivables[0]).toEqual(updatedTransaction)
    expect(store.loading).toBe(false)
  })

  it('handles error when updating a transaction', async () => {
    const store = useFinancialTransactionsStore()
    const existingTransaction: FinancialTransaction = { id: '1', description: 'Rent', amount: 1000, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.payables = [existingTransaction]

    const updatedFields = { amount: 1100 }
    const errorMessage = 'API Error'
    ;(api.put as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.updateFinancialTransaction('payable', '1', updatedFields)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(`Falha ao atualizar transação payable.`)
    expect(store.loading).toBe(false)
  })

  it('deletes a payable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const transactionToDelete: FinancialTransaction = { id: '1', description: 'Rent', amount: 1000, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.payables = [transactionToDelete]

    ;(api.delete as Mock).mockResolvedValueOnce(null)

    await store.deleteFinancialTransaction('payable', '1')

    expect(store.payables).not.toContainEqual(transactionToDelete)
    expect(store.loading).toBe(false)
  })

  it('deletes a receivable transaction successfully', async () => {
    const store = useFinancialTransactionsStore()
    const transactionToDelete: FinancialTransaction = { id: '2', description: 'Sale', amount: 500, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.receivables = [transactionToDelete]

    ;(api.delete as Mock).mockResolvedValueOnce(null)

    await store.deleteFinancialTransaction('receivable', '2')

    expect(store.receivables).not.toContainEqual(transactionToDelete)
    expect(store.loading).toBe(false)
  })

  it('handles error when deleting a transaction', async () => {
    const store = useFinancialTransactionsStore()
    const transactionToDelete: FinancialTransaction = { id: '1', description: 'Rent', amount: 1000, due_date: '2024-01-01', created_at: '2024-01-01' }
    store.payables = [transactionToDelete]

    const errorMessage = 'API Error'
    ;(api.delete as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.deleteFinancialTransaction('payable', '1')).rejects.toThrow(errorMessage)

    expect(store.error).toBe(`Falha ao deletar transação payable.`)
    expect(store.loading).toBe(false)
  })
})
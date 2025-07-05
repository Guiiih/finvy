import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from './accountStore'
import { api } from '@/services/api'
import type { Account } from '@/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Account Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches accounts successfully', async () => {
    const store = useAccountStore()
    const mockAccounts: Account[] = [{ id: '1', name: 'Bank A', type: 'asset' }]
    ;(api.get as Mock).mockResolvedValue(mockAccounts)

    await store.fetchAccounts()

    expect(store.accounts).toEqual(mockAccounts)
  })

  it('adds an account successfully', async () => {
    const store = useAccountStore()
    const newAccount: Omit<Account, 'id'> = { name: 'Bank B', type: 'asset' }
    const addedAccount: Account = { id: '2', ...newAccount }
    ;(api.post as Mock).mockResolvedValue(addedAccount)

    await store.addAccount(newAccount)

    expect(store.accounts).toContainEqual(addedAccount)
  })

  it('updates an account successfully', async () => {
    const store = useAccountStore()
    const existingAccount: Account = { id: '1', name: 'Bank A', type: 'asset' }
    store.accounts = [existingAccount]

    const updatedAccountData: Partial<Account> = { name: 'Bank A Updated' }
    const updatedAccount: Account = { ...existingAccount, ...updatedAccountData }
    ;(api.put as Mock).mockResolvedValue(updatedAccount)

    await store.updateAccount(existingAccount.id, updatedAccountData)

    expect(store.accounts[0]).toEqual(updatedAccount)
  })

  it('deletes an account successfully', async () => {
    const store = useAccountStore()
    const accountIdToDelete = '1'
    store.accounts = [{ id: accountIdToDelete, name: 'Bank A', type: 'asset' }]
    ;(api.delete as Mock).mockResolvedValue(null)

    await store.deleteAccount(accountIdToDelete)

    expect(store.accounts.find((a) => a.id === accountIdToDelete)).toBeUndefined()
  })
})
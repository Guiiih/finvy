import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { useToast } from 'primevue/usetoast'
import { setActivePinia, createPinia } from 'pinia'
import { useJournalEntryStore } from './journalEntryStore'
import { api } from '@/services/api'
import { supabase } from '@/supabase'
import type { JournalEntry, EntryLine } from '@/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      update: vi.fn(),
      eq: vi.fn(() => ({ single: vi.fn() })),
    })),
  },
}))

// Mock useToast from PrimeVue
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}))

describe('journalEntryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should fetch journal entries and their lines successfully', async () => {
    const store = useJournalEntryStore()
    const mockJournalEntries: JournalEntry[] = [
      { id: 'je1', entry_date: '2024-01-01', description: 'Entry 1', lines: [] },
    ]
    const mockEntryLines: EntryLine[] = [
      { account_id: 'acc1', debit: 100, credit: 0, type: 'debit', amount: 100 },
    ]

    ;(api.get as Mock).mockResolvedValueOnce(mockJournalEntries) // For journal entries
    ;(api.get as Mock).mockResolvedValueOnce(mockEntryLines) // For entry lines

    await store.fetchJournalEntries()

    expect(store.journalEntries).toEqual([
      { ...mockJournalEntries[0], lines: mockEntryLines },
    ])
    expect(store.loading).toBe(false)
  })

  it('should handle error when fetching journal entries', async () => {
    const store = useJournalEntryStore()
    const errorMessage = 'Network Error'
    ;(api.get as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await store.fetchJournalEntries()

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should add a journal entry with lines successfully', async () => {
    const store = useJournalEntryStore()
    const newEntry: Omit<JournalEntry, 'id'> = {
      entry_date: '2024-01-02',
      description: 'New Entry',
      lines: [
        { account_id: 'acc1', type: 'debit', amount: 200 },
        { account_id: 'acc2', type: 'credit', amount: 200 },
      ],
    }
    const addedEntry: JournalEntry = { id: 'je2', ...newEntry }
    const addedLine1: EntryLine = { account_id: 'acc1', debit: 200, credit: 0, type: 'debit', amount: 200, id: 'el1' }
    const addedLine2: EntryLine = { account_id: 'acc2', debit: 0, credit: 200, type: 'credit', amount: 200, id: 'el2' }

    ;(api.post as Mock).mockResolvedValueOnce(addedEntry) // For journal entry
    ;(api.post as Mock).mockResolvedValueOnce(addedLine1) // For first line
    ;(api.post as Mock).mockResolvedValueOnce(addedLine2) // For second line

    await store.addJournalEntry(newEntry)

    expect(store.journalEntries).toContainEqual({
      ...addedEntry,
      lines: [
        { ...addedLine1, amount: 200 },
        { ...addedLine2, amount: 200 },
      ],
    })
    expect(store.loading).toBe(false)
  })

  it('should handle error when adding a journal entry', async () => {
    const store = useJournalEntryStore()
    const newEntry: Omit<JournalEntry, 'id'> = {
      entry_date: '2024-01-02',
      description: 'New Entry',
      lines: [
        { account_id: 'acc1', type: 'debit', amount: 200 },
      ],
    }
    const errorMessage = 'API Error'
    ;(api.post as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.addJournalEntry(newEntry)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should update a journal entry with lines successfully', async () => {
    const store = useJournalEntryStore()
    const existingEntry: JournalEntry = {
      id: 'je1',
      entry_date: '2024-01-01',
      description: 'Entry 1',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0, type: 'debit', amount: 100 },
      ],
    }
    store.journalEntries = [existingEntry]

    const updatedEntryData: JournalEntry = {
      ...existingEntry,
      description: 'Updated Entry',
      lines: [
        { account_id: 'acc1', type: 'debit', amount: 150 },
        { account_id: 'acc3', type: 'credit', amount: 150 },
      ],
    }
    const updatedLine1: EntryLine = { account_id: 'acc1', debit: 150, credit: 0, type: 'debit', amount: 150, id: 'el1' }
    const updatedLine2: EntryLine = { account_id: 'acc3', debit: 0, credit: 150, type: 'credit', amount: 150, id: 'el2' }

    ;(api.put as Mock).mockResolvedValueOnce(updatedEntryData) // For journal entry update
    ;(api.delete as Mock).mockResolvedValueOnce(null) // For deleting old lines
    ;(api.post as Mock).mockResolvedValueOnce(updatedLine1) // For first new line
    ;(api.post as Mock).mockResolvedValueOnce(updatedLine2) // For second new line

    await store.updateEntry(updatedEntryData)

    expect(store.journalEntries[0]).toEqual({
      ...updatedEntryData,
      lines: [
        { ...updatedLine1, amount: 150 },
        { ...updatedLine2, amount: 150 },
      ],
    })
    expect(store.loading).toBe(false)
  })

  it('should handle error when updating a journal entry', async () => {
    const store = useJournalEntryStore()
    const existingEntry: JournalEntry = {
      id: 'je1',
      entry_date: '2024-01-01',
      description: 'Entry 1',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0, type: 'debit', amount: 100 },
      ],
    }
    store.journalEntries = [existingEntry]

    const updatedEntryData: JournalEntry = {
      ...existingEntry,
      description: 'Updated Entry',
    }
    const errorMessage = 'API Error'
    ;(api.put as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.updateEntry(updatedEntryData)).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should delete a journal entry successfully', async () => {
    const store = useJournalEntryStore()
    const entryToDelete: JournalEntry = { id: 'je1', entry_date: '2024-01-01', description: 'Entry 1', lines: [] }
    store.journalEntries = [entryToDelete]

    ;(api.delete as Mock).mockResolvedValueOnce(null)

    await store.deleteEntry('je1')

    expect(store.journalEntries).not.toContainEqual(entryToDelete)
    expect(store.loading).toBe(false)
  })

  it('should handle error when deleting a journal entry', async () => {
    const store = useJournalEntryStore()
    const entryToDelete: JournalEntry = { id: 'je1', entry_date: '2024-01-01', description: 'Entry 1', lines: [] }
    store.journalEntries = [entryToDelete]

    const errorMessage = 'API Error'
    ;(api.delete as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.deleteEntry('je1')).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })

  it('should reverse a journal entry successfully', async () => {
    const store = useJournalEntryStore()
    const originalEntry: JournalEntry = {
      id: 'je1',
      entry_date: '2024-01-01',
      description: 'Original Entry',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0, type: 'debit', amount: 100 },
        { account_id: 'acc2', debit: 0, credit: 100, type: 'credit', amount: 100 },
      ],
    }
    store.journalEntries = [originalEntry]

    const reversedEntry: Omit<JournalEntry, 'id'> = {
      entry_date: expect.any(String),
      description: expect.stringContaining('Estorno do Lançamento je1'),
      lines: [
        { account_id: 'acc1', type: 'credit', amount: 100 },
        { account_id: 'acc2', type: 'debit', amount: 100 },
      ],
    }

    ;(api.post as Mock).mockResolvedValueOnce({ id: 'je-reversed', ...reversedEntry }) // For new journal entry
    ;(api.post as Mock).mockResolvedValueOnce({ id: 'el-rev1', account_id: 'acc1', debit: 0, credit: 100, amount: 100 }) // For first reversed line
    ;(api.post as Mock).mockResolvedValueOnce({ id: 'el-rev2', account_id: 'acc2', debit: 100, credit: 0, amount: 100 }) // For second reversed line

    const mockUseToast = vi.mocked(useToast)
    const toastAddSpy = vi.spyOn(mockUseToast(), 'add')

    await store.reverseJournalEntry('je1')

    expect(api.post).toHaveBeenCalledWith('/journal-entries', expect.objectContaining({
      description: expect.stringContaining('Estorno do Lançamento je1'),
    }))
    expect(store.journalEntries).toHaveLength(2) // Original + Reversed
    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(store.loading).toBe(false)
  })

  it('should handle error when reversing a journal entry', async () => {
    const store = useJournalEntryStore()
    const originalEntry: JournalEntry = {
      id: 'je1',
      entry_date: '2024-01-01',
      description: 'Original Entry',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0, type: 'debit', amount: 100 },
      ],
    }
    store.journalEntries = [originalEntry]

    const errorMessage = 'API Error'
    ;(api.post as Mock).mockRejectedValueOnce(new Error(errorMessage))

    await expect(store.reverseJournalEntry('je1')).rejects.toThrow(errorMessage)

    expect(store.error).toBe(errorMessage)
    expect(store.loading).toBe(false)
  })
})
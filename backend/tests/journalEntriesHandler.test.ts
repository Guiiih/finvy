/// <reference types="vitest/globals" />
// @ts-expect-error Vite/Vitest types are not available in the test environment.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import httpMocks from 'node-mocks-http'
import type { VercelResponse } from '@vercel/node'
import handler from '../handlers/accounting/journal-entries.js'
import * as journalEntryService from '../services/journalEntryService'
import * as supabaseClient from '../utils/supabaseClient'
import logger from '../utils/logger'
import { createJournalEntrySchema } from '../utils/schemas'

// Mock external dependencies
vi.mock('../services/journalEntryService')
vi.mock('../utils/supabaseClient')
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))
vi.mock('../utils/schemas', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createJournalEntrySchema: {
      safeParse: vi.fn(),
    },
  }
})

describe('journal-entries handler', () => {
  const commonUserArgs = {
    user_id: 'test-user-id',
    token: 'test-token',
  }
  const commonOrgPeriod = {
    organization_id: 'test-org-id',
    active_accounting_period_id: 'test-period-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabaseClient.getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue(commonOrgPeriod)
    ;(supabaseClient.getUserProfileInfo as vi.Mock).mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      handle: 'testhandle',
    })
    ;(supabaseClient.handleErrorResponse as vi.Mock).mockImplementation(
      (res: VercelResponse, status: number, message: string) => {
        res.statusCode = status
        res.json({ error: message })
      },
    )
  })

  describe('POST /journal-entries', () => {
    it('should create a journal entry successfully', async () => {
      const newEntryData = {
        entry_date: '2025-01-01',
        description: 'Test Entry',
        reference: 'REF001',
        status: 'draft',
      }
      const createdEntry = { id: 'new-uuid', ...newEntryData }

      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: newEntryData,
      })
      ;(journalEntryService.createJournalEntry as vi.Mock).mockResolvedValue(createdEntry)

      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries',
        body: newEntryData,
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(201)
      expect(response._getJSONData()).toEqual(createdEntry)
      expect(journalEntryService.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_date: newEntryData.entry_date,
          description: newEntryData.description,
        }),
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
      )
    })

    it('should return 400 if validation fails for create journal entry', async () => {
      const validationErrors = [{ message: 'Invalid date' }]
      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: false,
        error: { errors: validationErrors },
      })

      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries',
        body: { entry_date: 'invalid-date' },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toEqual({ error: 'Invalid date' })
      expect(journalEntryService.createJournalEntry).not.toHaveBeenCalled()
    })

    it('should handle bulk delete request successfully', async () => {
      const idsToDelete = ['id1', 'id2']
      ;(journalEntryService.bulkDeleteJournalEntries as vi.Mock).mockResolvedValue(true)

      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries/bulk-delete',
        body: { ids: idsToDelete },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toEqual({
        message: `${idsToDelete.length} lançamentos deletados com sucesso.`,
      })
      expect(journalEntryService.bulkDeleteJournalEntries).toHaveBeenCalledWith(
        idsToDelete,
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
        commonUserArgs.user_id,
      )
    })

    it('should return 400 for invalid bulk delete IDs', async () => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries/bulk-delete',
        body: { ids: ['id1', 123] }, // Invalid ID type
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toEqual({
        error: 'IDs inválidos fornecidos para exclusão em massa.',
      })
      expect(journalEntryService.bulkDeleteJournalEntries).not.toHaveBeenCalled()
    })

    it('should handle bulk update status request successfully', async () => {
      const idsToUpdate = ['id1', 'id2']
      const newStatus = 'posted'
      ;(journalEntryService.bulkUpdateJournalEntryStatus as vi.Mock).mockResolvedValue(true)

      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries/bulk-update-status',
        body: { ids: idsToUpdate, status: newStatus },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toEqual({
        message: `Status de ${idsToUpdate.length} lançamentos atualizado para ${newStatus}.`,
      })
      expect(journalEntryService.bulkUpdateJournalEntryStatus).toHaveBeenCalledWith(
        idsToUpdate,
        newStatus,
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
      )
    })

    it('should return 400 for invalid bulk update status data', async () => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/journal-entries/bulk-update-status',
        body: { ids: ['id1'], status: 123 }, // Invalid status type
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toEqual({
        error: 'IDs ou status inválidos fornecidos para atualização em massa.',
      })
      expect(journalEntryService.bulkUpdateJournalEntryStatus).not.toHaveBeenCalled()
    })
  })

  describe('GET /journal-entries', () => {
    it('should retrieve journal entries successfully', async () => {
      const mockEntries = [{ id: 'entry1', description: 'Entry 1' }]
      ;(journalEntryService.getJournalEntries as vi.Mock).mockResolvedValue({
        data: mockEntries,
        count: 1,
      })

      const request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/journal-entries?page=1&limit=10',
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toEqual({ data: mockEntries, count: 1 })
      expect(journalEntryService.getJournalEntries).toHaveBeenCalledWith(
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
        1,
        10,
      )
    })

    it('should return 403 if organization or period not found', async () => {
      ;(supabaseClient.getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue(null)

      const request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/journal-entries',
      })
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(403)
      expect(response._getJSONData()).toEqual({
        error: 'Organização ou período contábil não encontrado para o usuário.',
      })
    })

    it('should handle errors from getJournalEntries service', async () => {
      ;(journalEntryService.getJournalEntries as vi.Mock).mockRejectedValue(
        new Error('Service Error'),
      )

      const request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/journal-entries',
      })
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(500)
      expect(response._getJSONData()).toEqual({ error: 'Service Error' })
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(Object),
        'Journal Entries Handler: Erro inesperado na API de lançamentos:',
      )
    })
  })

  describe('PUT /journal-entries/{id}', () => {
    it('should update a journal entry successfully', async () => {
      const updateData = { description: 'Updated Description' }
      const updatedEntry = { id: 'uuid-123', ...updateData }

      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: updateData,
      })
      ;(journalEntryService.updateJournalEntry as vi.Mock).mockResolvedValue(updatedEntry)

      const request = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/journal-entries/uuid-123',
        params: { id: 'uuid-123' },
        body: updateData,
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toEqual(updatedEntry)
      expect(journalEntryService.updateJournalEntry).toHaveBeenCalledWith(
        'uuid-123',
        updateData,
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
      )
    })

    it('should return 400 if validation fails for update journal entry', async () => {
      const validationErrors = [{ message: 'Invalid description' }]
      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: false,
        error: { errors: validationErrors },
      })

      const request = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/journal-entries/uuid-123',
        params: { id: 'uuid-123' },
        body: { description: 123 }, // Invalid data
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toEqual({ error: 'Expected string, received number' })
      expect(journalEntryService.updateJournalEntry).not.toHaveBeenCalled()
    })

    it('should return 400 if no update data is provided', async () => {
      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: {},
      })

      const request = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/journal-entries/uuid-123',
        params: { id: 'uuid-123' },
        body: {},
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toEqual({ error: 'Nenhum campo para atualizar fornecido.' })
      expect(journalEntryService.updateJournalEntry).not.toHaveBeenCalled()
    })

    it('should return 404 if journal entry not found for update', async () => {
      ;(createJournalEntrySchema.safeParse as vi.Mock).mockReturnValue({
        success: true,
        data: { description: 'Updated' },
      })
      ;(journalEntryService.updateJournalEntry as vi.Mock).mockResolvedValue(null)

      const request = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/journal-entries/non-existent-id',
        params: { id: 'non-existent-id' },
        body: { description: 'Updated' },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(404)
      expect(response._getJSONData()).toEqual({
        error: 'Lançamento não encontrado ou você não tem permissão para atualizar.',
      })
    })
  })

  describe('DELETE /journal-entries/{id}', () => {
    it('should delete a journal entry successfully', async () => {
      ;(journalEntryService.deleteJournalEntry as vi.Mock).mockResolvedValue(true)

      const request = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/journal-entries/uuid-123',
        params: { id: 'uuid-123' },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(204)
      expect(response._getData()).toBe('') // No content for 204
      expect(journalEntryService.deleteJournalEntry).toHaveBeenCalledWith(
        'uuid-123',
        commonOrgPeriod.organization_id,
        commonOrgPeriod.active_accounting_period_id,
        commonUserArgs.token,
        commonUserArgs.user_id,
      )
    })

    it('should return 404 if journal entry not found for delete', async () => {
      ;(journalEntryService.deleteJournalEntry as vi.Mock).mockResolvedValue(false)

      const request = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/journal-entries/non-existent-id',
        params: { id: 'non-existent-id' },
      }) as VercelRequest
      const response = httpMocks.createResponse()

      await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

      expect(response.statusCode).toBe(404)
      expect(response._getJSONData()).toEqual({
        error: 'Lançamento não encontrado ou você não tem permissão para deletar.',
      })
    })
  })

  it('should return 405 for unsupported methods', async () => {
    const request = httpMocks.createRequest({
      method: 'PATCH',
      url: '/api/journal-entries',
    }) as VercelRequest
    const response = httpMocks.createResponse()

    await handler(request, response, commonUserArgs.user_id, commonUserArgs.token)

    expect(response.statusCode).toBe(405)
    expect(response._getJSONData()).toEqual({ error: 'Method PATCH Not Allowed' })
    expect(response._getHeaders()).toHaveProperty('allow', ['GET', 'POST', 'PUT', 'DELETE'])
  })
})

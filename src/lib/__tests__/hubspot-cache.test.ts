import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CachedHubspotService } from '@/lib/hubspot-cache'
import { hubspotClient } from '@/lib/hubspot'

// Mocking the real hubspotClient to avoid hitting network during testing
vi.mock('@/lib/hubspot', () => {
    return {
        hubspotClient: {
            crm: {
                contacts: {
                    basicApi: {
                        getById: vi.fn()
                    }
                }
            }
        }
    }
})

describe('CachedHubspotService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        // Muta o console.error gerado pelo fallback de erro do HubSpot apenas durantes os testes
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    it('1. Returns a default value when HubSpot API fails', async () => {
        // Simulate API throwing an error
        ; (hubspotClient as any).crm.contacts.basicApi.getById.mockRejectedValue(new Error('API Down'))

        const contact = await CachedHubspotService.getBasicContact('failing-123')
        expect(contact.name).toBe('Unknown Contact (API Error)')

        // Validate we actually called the mock
        expect((hubspotClient as any).crm.contacts.basicApi.getById).toHaveBeenCalledTimes(1)
    })

    it('2. Successfully caches and prevents multiple network calls on rapid requests', async () => {
        // Setup Mock response
        ; (hubspotClient as any).crm.contacts.basicApi.getById.mockResolvedValue({
            properties: { firstname: 'Maria', lastname: 'Doe' }
        })

        // First call: Hits the network
        const req1 = await CachedHubspotService.getFullContact('cached-123')
        expect(req1.name).toBe('Maria Doe')
        expect((hubspotClient as any).crm.contacts.basicApi.getById).toHaveBeenCalledTimes(1)

        // Second call immediately after: Returns from cache
        const req2 = await CachedHubspotService.getFullContact('cached-123')
        expect(req2.name).toBe('Maria Doe')
        // Verification: Network call count is still exactly 1
        expect((hubspotClient as any).crm.contacts.basicApi.getById).toHaveBeenCalledTimes(1)

        // Simulate time passing (61 seconds - longer than TTL)
        vi.setSystemTime(Date.now() + 61000)

        // Third call: Should hit the network again
        await CachedHubspotService.getFullContact('cached-123')
        // Network call count goes to 2
        expect((hubspotClient as any).crm.contacts.basicApi.getById).toHaveBeenCalledTimes(2)
    })
})

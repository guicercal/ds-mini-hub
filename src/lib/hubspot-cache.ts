import { hubspotClient } from './hubspot'

type CachedContact = {
    data: any
    expiresAt: number
}

// In-memory cache to prevent hammering HubSpot CRM API.
// Note: In a real serverless cluster, Redis is preferred. 
// For this Node.js process / Assessment, a Map is sufficient.
const contactCache = new Map<string, CachedContact>()
const CACHE_TTL_MS = 60000 // 60 seconds

/**
 * Service to fetch Contact details from HubSpot with basic LRU/TTL caching logic.
 * Ensures that rapid polling from the UI doesn't blow up rate limits.
 */
export class CachedHubspotService {
    static async getBasicContact(id: string) {
        if (!hubspotClient) return { name: 'Unknown Contact (No API Key)' }

        const cacheKey = `basic_${id}`
        const cached = contactCache.get(cacheKey)

        if (cached && cached.expiresAt > Date.now()) {
            return cached.data
        }

        try {
            const contact = await hubspotClient.crm.contacts.basicApi.getById(id, ['firstname', 'lastname'])
            const firstName = contact.properties.firstname || ''
            const lastName = contact.properties.lastname || ''
            const name = `${firstName} ${lastName}`.trim() || 'Unknown Contact'

            const result = { name }

            contactCache.set(cacheKey, {
                data: result,
                expiresAt: Date.now() + CACHE_TTL_MS
            })

            return result
        } catch (e) {
            console.error(`Error fetching basic HubSpot contact ${id}`)
            return { name: 'Unknown Contact (API Error)' }
        }
    }

    static async getFullContact(id: string) {
        if (!hubspotClient) return { name: 'Unknown Contact', email: '', phone: '', notes: '' }

        const cacheKey = `full_${id}`
        const cached = contactCache.get(cacheKey)

        if (cached && cached.expiresAt > Date.now()) {
            return cached.data
        }

        try {
            const contact = await hubspotClient.crm.contacts.basicApi.getById(id, ['firstname', 'lastname', 'email', 'phone', 'notes'])
            const props = contact.properties
            const result = {
                name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unknown Contact',
                email: props.email || '',
                phone: props.phone || '',
                notes: props.notes || '',
            }

            contactCache.set(cacheKey, {
                data: result,
                expiresAt: Date.now() + CACHE_TTL_MS
            })

            return result
        } catch (e) {
            console.error(`Error fetching full HubSpot contact ${id}`)
            return { name: 'Unknown Contact (API Error)', email: '', phone: '', notes: '' }
        }
    }
}

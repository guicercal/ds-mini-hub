import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CachedHubspotService } from '@/lib/hubspot-cache'

/**
 * HTTP GET Handler for Conversations Listing
 *
 * Fetches all conversations from the local SQLite (Prisma) database,
 * ordered by the latest activity. It also retrieves a single latest 
 * message per conversation for preview purposes, and concurrently 
 * queries HubSpot CRM to hydrate the user's first and last name.
 * 
 * @returns {Promise<NextResponse>} A JSON array of enriched conversations
 *   containing id, status, contactName, lastMessage, and timestamp.
 */
export async function GET() {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Get only the latest message for preview
                },
            },
            orderBy: { updatedAt: 'desc' },
        })

        // Fetch contact details for each conversation from HubSpot to show the name
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                let contactName = 'Unknown Contact'
                try {
                    const result = await CachedHubspotService.getBasicContact(conv.hubspotContactId)
                    contactName = result.name
                } catch (e) {
                    console.error(`Error with cached contact ${conv.hubspotContactId}`)
                }

                return {
                    id: conv.id,
                    status: conv.status,
                    contactName,
                    hubspotContactId: conv.hubspotContactId,
                    lastMessage: conv.messages[0]?.text || '',
                    timestamp: conv.messages[0]?.createdAt || conv.updatedAt,
                }
            })
        )

        return NextResponse.json(enrichedConversations)
    } catch (error) {
        console.error('Failed to fetch conversations:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

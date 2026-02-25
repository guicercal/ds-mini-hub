import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CachedHubspotService } from '@/lib/hubspot-cache'

/**
 * HTTP GET Handler for Single Conversation details.
 * 
 * Looks up a conversation by ID, retrieves its full history sorted chronologically,
 * and fetches deep HubSpot CRM properties (name, phone, email, notes).
 * 
 * @param {Request} request - Next.js Request object.
 * @param {object} context - Route context containing the URL dynamic ID parameters.
 * @returns {Promise<NextResponse>} Detailed conversation payload combined with contact details.
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversationId } = await context.params

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Fetch deep contact data safely utilizing the Cache strategy
        let contactData = await CachedHubspotService.getFullContact(conversation.hubspotContactId)

        return NextResponse.json({
            ...conversation,
            contact: contactData,
        })
    } catch (error) {
        console.error('Error fetching conversation detail:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

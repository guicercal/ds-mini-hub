import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hubspotClient } from '@/lib/hubspot'

/**
 * HTTP POST Handler for Message Creation.
 * 
 * Creates a local Message inside a Conversation and concurrently attempts
 * to sync it to the HubSpot CRM as a Note on the associated Contact.
 * If the sync fails (e.g., rate limit, network issue), sets syncFailed=true 
 * locally securely handling error scenarios.
 * 
 * @param {Request} request - Next.js Request object containing JSON payload 
 *   with { conversationId, text, senderType }.
 * @returns {Promise<NextResponse>} Information of the successfully created message.
 */
export async function POST(request: Request) {
    try {
        const { conversationId, text, senderType } = await request.json()

        if (!conversationId || !text || !senderType) {
            return NextResponse.json({ error: 'Missing conversationId, text or senderType' }, { status: 400 })
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        let syncFailed = false
        let hubspotNoteId = null

        // Attempt to sync to HubSpot CRM
        // HubSpot Notes refer to engagements
        if (hubspotClient && conversation.hubspotContactId) {
            try {
                const hsNote = await hubspotClient.crm.objects.notes.basicApi.create({
                    properties: {
                        hs_timestamp: Date.now().toString(),
                        hs_note_body: `[DealSmart AI - ${senderType}] ${text}`,
                    },
                })

                if (hsNote && hsNote.id) {
                    hubspotNoteId = hsNote.id
                    // Associate the note to the contact
                    await hubspotClient.crm.associations.v4.basicApi.create(
                        'notes',
                        hsNote.id,
                        'contacts',
                        conversation.hubspotContactId,
                        [{ associationCategory: 'HUBSPOT_DEFINED' as any, associationTypeId: 202 }]
                    )
                }
            } catch (error) {
                console.error('Failed to sync message to HubSpot CRM:', error)
                syncFailed = true
            }
        }

        // Save message locally
        const message = await prisma.message.create({
            data: {
                conversationId,
                text,
                senderType,
                hubspotNoteId,
                syncFailed,
            },
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error('POST /api/messages error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

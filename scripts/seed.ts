import { PrismaClient } from '@prisma/client'
import { Client } from '@hubspot/api-client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.error("Missing HUBSPOT_ACCESS_TOKEN in .env")
    process.exit(1)
}

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN })

async function main() {
    console.log('Fetching contacts from HubSpot...')
    let contacts: any[] = []

    try {
        const contactsResponse = await hubspotClient.crm.contacts.basicApi.getPage(10, undefined, ['firstname', 'lastname'])
        contacts = contactsResponse.results
    } catch (error) {
        console.error("Error fetching contacts from Hubspot. Check your App Scopes and Token.")
        console.error(error)
        process.exit(1)
    }

    if (contacts.length < 3) {
        console.warn(`Only found ${contacts.length} contacts matching your account. Ideally, we need at least 3 to match the test cases, but we will reuse them!`)
    }

    // Clear existing SQLite conversations
    console.log('Clearing existing DB conversations...')
    await prisma.message.deleteMany()
    await prisma.conversation.deleteMany()

    // Defined seed data from the take-home specs
    const seedData = [
        {
            name: 'Sarah Chen',
            status: 'IN_PROGRESS',
            messages: [
                { senderType: 'CUSTOMER', text: 'Hi, I saw your ad for the 2024 BMW X5. Is it still available?' },
                { senderType: 'AI_AGENT', text: 'Hi Sarah! Yes, we have the 2024 X5 in stock. Are you interested in the xDrive40i or the M50?' },
                { senderType: 'CUSTOMER', text: 'The M50. What colors do you have?' }
            ]
        },
        {
            name: 'Mike Rodriguez',
            status: 'IN_PROGRESS',
            messages: [
                { senderType: 'CUSTOMER', text: 'I need to schedule service for my 330i. Check engine light came on.' },
                { senderType: 'AI_AGENT', text: "I'm sorry to hear that, Mike. I can help you schedule a diagnostic. What days work best for you this week?" }
            ]
        },
        {
            name: 'Jennifer Walsh',
            status: 'NEW',
            messages: [
                { senderType: 'CUSTOMER', text: "What's your best price on the X3? I'm also looking at the Audi Q5." }
            ]
        }
    ]

    console.log('Generating seed data...')

    for (let i = 0; i < seedData.length; i++) {
        const data = seedData[i]
        let contactId = ''

        // Pick a contact (fallback to the first one available or mock ID if none)
        const hubspotContact = contacts[i] || contacts[0]

        if (hubspotContact) {
            contactId = hubspotContact.id
        } else {
            contactId = `mock-contact-id-${i}`
            console.log(`No HubSpot contact available, using fallback ID: ${contactId}`)
        }

        const conv = await prisma.conversation.create({
            data: {
                hubspotContactId: contactId,
                status: data.status,
                messages: {
                    create: data.messages.map(m => ({
                        senderType: m.senderType,
                        text: m.text
                    }))
                }
            }
        })
        console.log(`Created conversation for ${data.name} (linked to HubSpot ID: ${contactId}) => ID: ${conv.id}`)
    }

    console.log('Seed completed successfully! ✅')
}

main()
    .catch((e) => {
        console.error('Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

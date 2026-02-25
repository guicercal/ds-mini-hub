import { AiProvider, Message } from './types'

/**
 * AI Provider Implementation for Google's Gemini Models.
 * Requires process.env.GEMINI_API_KEY.
 */
export class GeminiProvider implements AiProvider {
    private readonly apiKey: string

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || ''
    }

    /**
     * Transforms standard messages into Gemini's payload format and fetches a reply.
     * 
     * @param {Message[]} messages - The array of conversation messages.
     * @returns {Promise<string>} The AI-generated suggestion block.
     */
    async generateSuggestion(messages: Message[]): Promise<string> {
        if (!this.apiKey) {
            throw new Error("GEMINI_API_KEY is not set.")
        }

        const systemPrompt = `You are a helpful and professional dealership sales advisor named Max at DealSmart Motors. 
Your goal is to assist customers with their inquiries, schedule services, and help close deals.
Rules:
- Be helpful and professional.
- Reference specific details from the conversation.
- AVOID MAKING UP INFORMATION. Do not invent prices, exact inventory colors, or random availability unless explicitly stated in the context. If you do not know, state that you will check and get back to them.
- Keep the response concise, suitable for SMS or a standard web chat.`

        const formattedMessages = messages.map((msg) => ({
            role: msg.senderType === 'CUSTOMER' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }))

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: formattedMessages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        })

        if (!response.ok) {
            const err = await response.json()
            console.error("Gemini API error:", err)
            throw new Error("Failed to fetch from Gemini API")
        }

        const data = await response.json()
        const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

        if (!suggestion) {
            throw new Error("Gemini returned an empty suggestion")
        }

        return suggestion
    }
}

import { AiProvider, Message } from './types'

/**
 * AI Provider Implementation for OpenAI's GPT Models.
 * Requires process.env.OPENAI_API_KEY.
 */
export class OpenAiProvider implements AiProvider {
    private readonly apiKey: string

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || ''
    }

    /**
     * Transforms standard messages into OpenAI completion chunks and fetches a reply.
     * 
     * @param {Message[]} messages - The array of conversation messages.
     * @returns {Promise<string>} The AI-generated suggestion block.
     */
    async generateSuggestion(messages: Message[], systemPromptOverride?: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error("OPENAI_API_KEY is not set.")
        }

        const systemPrompt = systemPromptOverride || `You are a helpful and professional dealership sales advisor named Max at DealSmart Motors. 
Your goal is to assist customers with their inquiries, schedule services, and help close deals.
Rules:
- Be helpful and professional.
- Reference specific details from the conversation.
- AVOID MAKING UP INFORMATION. Do not invent prices, exact inventory colors, or random availability unless explicitly stated in the context. If you do not know, state that you will check and get back to them.
- Keep the response concise, suitable for SMS or a standard web chat.`

        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg) => ({
                role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
                content: msg.text || '(media/attachment)'
            })),
            { role: 'user', content: '[System Function]: Draft the next reply for Max to send to the customer.' }
        ]

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 150
            })
        })

        if (!response.ok) {
            const err = await response.json()
            console.error("OpenAI API error:", err)
            throw new Error("Failed to fetch from OpenAI API")
        }

        const data = await response.json()
        const suggestion = data.choices?.[0]?.message?.content?.trim()

        if (!suggestion) {
            throw new Error("OpenAI returned an empty suggestion")
        }

        return suggestion
    }
}

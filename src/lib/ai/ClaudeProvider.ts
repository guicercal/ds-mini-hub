import { AiProvider, Message } from './types'

/**
 * AI Provider Implementation for Anthropic's Claude Models.
 * Requires process.env.CLAUDE_API_KEY.
 */
export class ClaudeProvider implements AiProvider {
    private readonly apiKey: string

    constructor() {
        this.apiKey = process.env.CLAUDE_API_KEY || ''
    }

    /**
     * Transforms standard messages into Claude's prompt constraints and fetches a reply.
     * 
     * @param {Message[]} messages - The array of conversation messages.
     * @returns {Promise<string>} The AI-generated suggestion block.
     */
    async generateSuggestion(messages: Message[]): Promise<string> {
        if (!this.apiKey) {
            throw new Error("CLAUDE_API_KEY is not set.")
        }

        const systemPrompt = `You are a helpful and professional dealership sales advisor named Max at DealSmart Motors. 
Your goal is to assist customers with their inquiries, schedule services, and help close deals.
Rules:
- Be helpful and professional.
- Reference specific details from the conversation.
- AVOID MAKING UP INFORMATION. Do not invent prices, exact inventory colors, or random availability unless explicitly stated in the context. If you do not know, state that you will check and get back to them.
- Keep the response concise, suitable for SMS or a standard web chat.`

        const formattedMessages = messages.map((msg) => ({
            role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
            content: msg.text
        }))

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 150,
                temperature: 0.7,
                system: systemPrompt,
                messages: formattedMessages
            })
        })

        if (!response.ok) {
            const err = await response.json()
            console.error("Claude API error:", err)
            throw new Error("Failed to fetch from Claude API")
        }

        const data = await response.json()
        const suggestion = data.content?.[0]?.text?.trim()

        if (!suggestion) {
            throw new Error("Claude returned an empty suggestion")
        }

        return suggestion
    }
}

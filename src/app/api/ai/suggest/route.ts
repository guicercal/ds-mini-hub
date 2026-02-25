import { NextResponse } from 'next/server'
import { AiFactory } from '@/lib/ai/AiFactory'

/**
 * HTTP POST Handler for AI Generation.
 * 
 * Proxies the request through the AiFactory strategy pattern to 
 * generate context-aware AI replies utilizing the currently configured 
 * active model strictly loaded from the Database (OpenAI, Gemini, etc.).
 * 
 * @param {Request} request - Next.js Request object containing JSON payload 
 *   with { messages } array representing history.
 * @returns {Promise<NextResponse>} The AI generated string payload (suggestion).
 */
export async function POST(request: Request) {
    try {
        const { messages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid message array' }, { status: 400 })
        }

        // Use the Factory Pattern to obtain the active AI Strategy reading from Prisma
        const aiProvider = await AiFactory.getProvider()

        try {
            const suggestion = await aiProvider.generateSuggestion(messages)
            return NextResponse.json({ suggestion })
        } catch (providerError: any) {
            console.warn("AI Provider Error. Returning fallback.", providerError)
            return NextResponse.json({
                suggestion: `⚠️ I'm sorry, I'm currently unable to connect to the ${aiProvider.constructor.name || 'AI'} API. Please check your API Keys or credit balance.`
            })
        }
    } catch (error) {
        console.error('AI Suggestion error:', error)
        return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 })
    }
}

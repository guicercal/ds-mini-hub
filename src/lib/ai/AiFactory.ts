import prisma from '@/lib/prisma'
import { AiProvider } from './types'
import { OpenAiProvider } from './OpenAiProvider'
import { GeminiProvider } from './GeminiProvider'
import { ClaudeProvider } from './ClaudeProvider'

/**
 * Factory class responsible for instantiating the correct AI Provider
 * based on the dynamic database configuration.
 */
export class AiFactory {
    /**
     * Reads the application settings and returns the configured AI Provider instance.
     * Defaults to GeminiProvider if a setup error occurs.
     * 
     * @returns {Promise<AiProvider>} An instance implementing the AiProvider interface.
     */
    static async getProvider(): Promise<AiProvider> {
        try {
            // Fetch dynamic configuration from DB
            let settings = await prisma.appSettings.findUnique({
                where: { id: 'global' }
            })

            // Seed the default if it doesn't exist
            if (!settings) {
                settings = await prisma.appSettings.create({
                    data: {
                        id: 'global',
                        activeAiConfig: 'GEMINI' // Fallback automatically to Gemini
                    }
                })
            }

            console.log(`[AiFactory] Consuming API using provider: ${settings.activeAiConfig}`)

            switch (settings.activeAiConfig.toUpperCase()) {
                case 'OPENAI':
                    return new OpenAiProvider()
                case 'CLAUDE':
                    return new ClaudeProvider()
                case 'GEMINI':
                default:
                    return new GeminiProvider()
            }
        } catch (e) {
            console.warn("[AiFactory] DB Error fetching AppSettings, falling back to GEMINI.", e)
            return new GeminiProvider()
        }
    }
}

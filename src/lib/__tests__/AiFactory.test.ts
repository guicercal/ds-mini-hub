import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiFactory } from '@/lib/ai/AiFactory'
import { OpenAiProvider } from '@/lib/ai/OpenAiProvider'
import { GeminiProvider } from '@/lib/ai/GeminiProvider'
import { ClaudeProvider } from '@/lib/ai/ClaudeProvider'
import prisma from '@/lib/prisma'

// Mock Prisma ORM
vi.mock('@/lib/prisma', () => ({
    default: {
        appSettings: {
            findUnique: vi.fn(),
            create: vi.fn()
        }
    }
}))

describe('AiFactory Pattern', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Suprime os logs cosméticos do código nativo para garantir um terminal Vitest impecável
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })

        // Set dummy env variables to avoid validation errors when initializing providers
        process.env.GEMINI_API_KEY = 'test_gemini'
        process.env.OPENAI_API_KEY = 'test_openai'
        process.env.CLAUDE_API_KEY = 'test_claude'
    })

    it('1. Instantiates OpenAI Provider when DB config dictates it', async () => {
        (prisma.appSettings.findUnique as any).mockResolvedValue({ activeAiConfig: 'OPENAI' })
        const provider = await AiFactory.getProvider()
        expect(provider).toBeInstanceOf(OpenAiProvider)
    })

    it('2. Instantiates Claude Provider correctly', async () => {
        (prisma.appSettings.findUnique as any).mockResolvedValue({ activeAiConfig: 'CLAUDE' })
        const provider = await AiFactory.getProvider()
        expect(provider).toBeInstanceOf(ClaudeProvider)
    })

    it('3. Falls back gracefully to GEMINI if DB throws an error', async () => {
        (prisma.appSettings.findUnique as any).mockRejectedValue(new Error('DB Failed'))
        const provider = await AiFactory.getProvider()
        // Even on error, we must safely return an instance to keep the system up
        expect(provider).toBeInstanceOf(GeminiProvider)
    })
})

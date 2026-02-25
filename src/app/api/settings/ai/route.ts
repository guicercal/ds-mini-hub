import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * HTTP GET/POST Handler for AI Settings.
 * 
 * Verifies which AI Provider API Keys exist in the environment
 * to dynamically feed the UI Selectors, and allows the active
 * provider state to be updated globally.
 */
export async function GET() {
    try {
        const available = []

        // Dynamically inspect environment variables to tell the UI what to render
        if (process.env.GEMINI_API_KEY) available.push('GEMINI')
        if (process.env.OPENAI_API_KEY) available.push('OPENAI')
        if (process.env.CLAUDE_API_KEY) available.push('CLAUDE')

        let settings = await prisma.appSettings.findUnique({
            where: { id: 'global' }
        })

        if (!settings) {
            settings = await prisma.appSettings.create({
                data: {
                    id: 'global',
                    activeAiConfig: available.length > 0 ? available[0] : 'GEMINI'
                }
            })
        }

        return NextResponse.json({
            available,
            active: settings.activeAiConfig,
            systemPrompt: settings.systemPrompt
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed retrieving AI settings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { activeAiConfig, systemPrompt } = body

        if (activeAiConfig && !['GEMINI', 'OPENAI', 'CLAUDE'].includes(activeAiConfig)) {
            return NextResponse.json({ error: 'Invalid AI model config' }, { status: 400 })
        }

        const updateData: any = {}
        if (activeAiConfig) updateData.activeAiConfig = activeAiConfig
        if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt

        const settings = await prisma.appSettings.upsert({
            where: { id: 'global' },
            create: { id: 'global', ...updateData },
            update: updateData
        })

        return NextResponse.json(settings)
    } catch (e: any) {
        console.error("AI Settings POST error:", e.message || e)
        return NextResponse.json({ error: 'Failed updating global settings' }, { status: 500 })
    }
}

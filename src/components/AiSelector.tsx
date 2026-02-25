'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AiSelector() {
    const [available, setAvailable] = useState<string[]>([])
    const [active, setActive] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/settings/ai')
            .then(res => res.json())
            .then(data => {
                if (data.available) setAvailable(data.available)
                if (data.active) setActive(data.active)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        setActive(val)
        try {
            await fetch('/api/settings/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeAiConfig: val })
            })
        } catch (error) {
            console.error('Failed to change AI Engine:', error)
        }
    }

    if (loading) return null

    if (available.length === 0) {
        return (
            <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-1 rounded">
                No API Keys Set
            </span>
        )
    }

    return (
        <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition-colors hover:border-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <select
                value={active}
                onChange={handleChange}
                className="bg-transparent text-xs font-semibold text-indigo-800 outline-none cursor-pointer appearance-none pr-3"
            >
                {available.map(ai => {
                    const label = ai === 'GEMINI' ? 'Google Gemini'
                        : ai === 'OPENAI' ? 'ChatGPT 4o'
                            : ai === 'CLAUDE' ? 'Claude 3' : ai
                    return <option key={ai} value={ai}>{label}</option>
                })}
            </select>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Settings } from 'lucide-react'

export default function AiSelector() {
    const [available, setAvailable] = useState<string[]>([])
    const [active, setActive] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/settings/ai')
            .then(res => res.json())
            .then(data => {
                if (data.available) setAvailable(data.available)
                if (data.active) setActive(data.active)
                if (data.systemPrompt) setSystemPrompt(data.systemPrompt)
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

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            await fetch('/api/settings/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt })
            })
            setIsSettingsOpen(false)
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
                onClick={() => setIsSettingsOpen(true)}
                title="AI Settings & Prompt"
                className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md border border-slate-200 transition-colors"
            >
                <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Configured AI Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 transition-colors hover:border-indigo-200">
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

            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> AI System Prompt
                            </h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
                        </div>
                        <div className="p-5 flex-1 flex flex-col gap-3">
                            <p className="text-sm text-slate-500 mb-1">
                                Customize the core instruction the AI follows to draft replies (Persona, Inventory Rules, Dealership Name, etc).
                            </p>
                            <textarea
                                className="w-full flex-1 min-h-[200px] border border-slate-200 rounded-lg p-3 text-sm focus-visible:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono text-slate-700 leading-relaxed resize-y"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import { Send, Bot, X, Loader2, User, Phone, Mail } from 'lucide-react'
import AiSelector from './AiSelector'

/**
 * The Main Chat Interface Component.
 * Fetches the specific conversation detail by ID, performs intelligent short-polling,
 * manages optimistic UI state during message sending, and hosts the floating AI
 * suggestions logic interacting with the backend APIs.
 * 
 * @param {{conversationId: string}} props - The active conversation ID to render.
 * @returns {JSX.Element} The Chat wrapper containing header, history feed and input box.
 */
export default function ChatArea({ conversationId }: { conversationId: string }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [inputVal, setInputVal] = useState('')
    const [suggesting, setSuggesting] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let polling: NodeJS.Timeout
        const fetchConversation = async () => {
            try {
                const res = await fetch(`/api/conversations/${conversationId}`)
                if (res.ok) {
                    const json = await res.json()

                    setData((currentData: any) => {
                        if (!currentData) return json;
                        // Preserve optimistic messages that haven't been returned by the DB yet
                        const optimisticMsgs = currentData.messages.filter((m: any) => m.isOptimistic);
                        return {
                            ...json,
                            messages: [...json.messages, ...optimisticMsgs]
                        }
                    })
                }
            } catch (e) {
                console.error('Error fetching conversation', e)
            } finally {
                setLoading(false)
            }
        }

        fetchConversation()

        // Basic polling for real-time updates as requested
        polling = setInterval(fetchConversation, 3000)

        return () => clearInterval(polling)
    }, [conversationId])

    useEffect(() => {
        // Scroll to bottom when messages get updated
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [data?.messages])

    /**
     * Helper to append a message securely via the backend API.
     * Starts by pushing a temporary optimistic UI object, fires the fetch call, 
     * and relies on the next polling tick to validate against the real DB entry.
     * 
     * @param {string} text - The raw message string.
     * @param {boolean} [isFromAI=false] - Whether this is passed from the AI suggestion box.
     */
    const handleSend = async (text: string, isFromAI = false) => {
        if (!text.trim()) return

        // Optimistic UI update
        const tempMsg = {
            id: 'temp-' + Date.now().toString(),
            senderType: isFromAI ? 'AI_AGENT' : 'HUMAN_AGENT',
            text,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        }

        // We append the optimistic message to the current state
        setData((prev: any) => ({
            ...prev,
            messages: [...(prev?.messages || []), tempMsg]
        }))

        setInputVal('')
        setSuggestion(null)

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    text: tempMsg.text,
                    senderType: tempMsg.senderType
                })
            })
            // Re-fetch immediately to resolve UI
            const res = await fetch(`/api/conversations/${conversationId}`);
            if (res.ok) {
                const refreshed = await res.json();
                setData(refreshed);
            }
        } catch (e) {
            console.error('Failed to send:', e)
        }
    }

    /**
     * Invokes the LLM handler passing the context history array.
     * It manages its own loading UI logic gracefully catching explicit errors
     * if the backend rate-limits or fails.
     */
    const handleGenerateSuggestion = async () => {
        setSuggesting(true)
        setSuggestion(null)
        try {
            // Token Consumption Control: Extrating only the last 10 interactions to preserve context while drastically saving costs.
            const contextPayload = data.messages.slice(-10)

            const res = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: contextPayload })
            })
            const result = await res.json()
            if (res.ok) {
                setSuggestion(result.suggestion)
            } else {
                // Fallback Explicit error as requested
                setSuggestion('⚠️ Failed to generate AI suggestion. The AI service might be busy.')
            }
        } catch (e) {
            setSuggestion('⚠️ An error occurred communicating with the AI.')
        } finally {
            setSuggesting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p>Loading conversation...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500">
                Failed to load conversation.
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-full relative">
            {/* Header with HubSpot CRM Info */}
            <div className="h-[80px] px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                        {data.contact?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">{data.contact?.name || 'Unknown Contact'}</h2>
                        <div className="flex gap-3 text-xs text-slate-500">
                            {data.contact?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.contact.phone}</span>}
                            {data.contact?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.contact.email}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <AiSelector />
                    <span className="text-xs font-semibold bg-slate-100 rounded px-2 py-1 flex items-center gap-1 text-slate-600">
                        <User className="w-3 h-3" /> CRM Sync
                    </span>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {data.messages?.map((msg: any) => {
                    const isCustomer = msg.senderType === 'CUSTOMER'
                    const isAgent = msg.senderType === 'HUMAN_AGENT'
                    const isAI = msg.senderType === 'AI_AGENT'

                    return (
                        <div
                            key={msg.id}
                            className={clsx(
                                "flex flex-col max-w-[75%]",
                                isCustomer ? "items-start" : "items-end ml-auto"
                            )}
                        >
                            {!isCustomer && (
                                <span className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                                    {isAI ? <><Bot className="w-3 h-3" /> DealSmart AI</> : 'You'}
                                </span>
                            )}
                            {isCustomer && (
                                <span className="text-[10px] text-slate-500 mb-1">
                                    Customer
                                </span>
                            )}

                            <div
                                className={clsx(
                                    "px-4 py-3 rounded-2xl shadow-sm relative group",
                                    isCustomer && "bg-white text-slate-800 border border-slate-200 rounded-tl-sm",
                                    isAgent && "bg-blue-600 text-white rounded-tr-sm",
                                    isAI && "bg-slate-800 text-white rounded-tr-sm"
                                )}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                                {/* Fallback Sync Badge */}
                                {msg.syncFailed && (
                                    <span className="absolute -bottom-4 right-0 text-[9px] text-red-500 font-medium flex items-center gap-1 whitespace-nowrap">
                                        ⚠️ CRM Sync failed
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">
                                {formatDistanceToNow(new Date(msg.createdAt))} ago
                            </span>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion Panel (Floating above input) */}
            {suggestion && (
                <div className="mx-6 mb-2 p-4 bg-white border border-blue-200 rounded-xl shadow-lg relative animate-in slide-in-from-bottom-2 fade-in">
                    <button
                        onClick={() => setSuggestion(null)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
                        <Bot className="w-4 h-4" /> Suggested Reply
                    </div>

                    <p className="text-sm text-slate-700 italic border-l-2 border-blue-400 pl-3 mb-4 whitespace-pre-wrap">
                        {suggestion.startsWith('⚠️') ? <span className="text-red-500 not-italic">{suggestion}</span> : suggestion}
                    </p>

                    {!suggestion.startsWith('⚠️') && (
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setInputVal(suggestion)
                                    setSuggestion(null)
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Edit & Send
                            </button>
                            <button
                                onClick={() => handleSend(suggestion, true)}
                                className="px-3 py-1.5 text-sm font-medium bg-blue-600 outline-none text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            >
                                Send As AI
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">

                    {/* Ask AI Button (Floating inside input) */}
                    <button
                        onClick={handleGenerateSuggestion}
                        disabled={suggesting}
                        title="Generate AI Reply"
                        className={clsx(
                            "p-2 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                            suggesting ? "bg-slate-200 cursor-not-allowed" : "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
                        )}
                    >
                        {suggesting ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : <Bot className="w-5 h-5" />}
                    </button>

                    <textarea
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend(inputVal)
                            }
                        }}
                        placeholder="Type your reply to customer..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 text-sm text-slate-800 placeholder-slate-400 outline-none"
                        rows={Math.max(1, Math.min(inputVal.split('\n').length, 5))}
                    />

                    <button
                        onClick={() => handleSend(inputVal)}
                        disabled={!inputVal.trim() || suggesting}
                        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    Press Enter to send, Shift+Enter for a new line. The AI acts as your co-pilot.
                </p>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import { Bot, Inbox } from 'lucide-react'

/**
 * The Root Page Component (Home).
 * Bootstraps the layout shell, maintains the global state for 
 * conversation listings, and manages the SWR polling loop updating 
 * the Sidebar every 5 seconds.
 * 
 * @returns {JSX.Element} The main layout tree.
 */
export default function Home() {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 15

  useEffect(() => {
    const fetchList = async () => {
      try {
        const queryParams = new URLSearchParams()
        if (searchQuery) queryParams.set('search', searchQuery)
        queryParams.set('page', '1')
        // We fetch all loaded pages at once to maintain the list smoothly during polling
        queryParams.set('limit', (page * LIMIT).toString())

        const res = await fetch(`/api/conversations?${queryParams.toString()}`)
        if (res.ok) {
          const { data, totalCount } = await res.json()
          setConversations(data)
          setTotalCount(totalCount)
        }
      } catch (e) {
        console.error(e)
      }
    }

    fetchList()
    const interval = setInterval(fetchList, 5000) // update sidebar every 5s
    return () => clearInterval(interval)
  }, [searchQuery, page])

  const hasMore = conversations.length < totalCount

  return (
    <div className="flex h-screen bg-slate-100 font-sans font-inter overflow-hidden selection:bg-blue-100 selection:text-blue-900">

      {/* Global App Layout Header wrapper */}
      <div className="flex-1 flex w-full bg-white shadow-2xl">

        {/* DealSmart Nav (Left slim bar) */}
        <div className="hidden md:flex w-16 bg-slate-900 border-r border-slate-800 flex-col items-center py-6 gap-6 flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        {/* Dynamic Sidebar List */}
        <div className={`w-full md:w-80 flex-shrink-0 ${selectedId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <Sidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onLoadMore={() => setPage(p => p + 1)}
            hasMore={hasMore}
          />
        </div>

        {/* Main Chat/Display Area */}
        <main className={`flex-1 flex flex-col bg-slate-50 relative ${selectedId ? 'flex' : 'hidden md:flex'}`}>
          {selectedId ? (
            <ChatArea key={selectedId} conversationId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">DealSmart AI OS</h3>
              <p className="max-w-md text-center">Select a conversation from the sidebar to start tracking CRM messages and leveraging AI suggestions.</p>
            </div>
          )}
        </main>
      </div>

    </div>
  )
}

import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

type ConversationListProps = {
    conversations: any[]
    selectedId: string | null
    onSelect: (id: string) => void
}

/**
 * Renders the left sidebar containing the list of conversations.
 * Handles selection state and displays truncated recent message previews.
 * 
 * @param {ConversationListProps} props - The array of conversations and selection handler.
 * @returns {JSX.Element} The sidebar UI component.
 */
export default function Sidebar({ conversations, selectedId, onSelect }: ConversationListProps) {
    return (
        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
            <div className="h-[80px] p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-lg">Conversations</h2>
                <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {conversations.length}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => {
                    const isSelected = selectedId === conv.id
                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={clsx(
                                "w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex flex-col gap-1 focus:outline-none focus:bg-slate-50",
                                isSelected && "bg-blue-50/50 border-l-4 border-l-blue-600 hover:bg-blue-50/50"
                            )}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className="font-semibold text-slate-800 truncate pr-2">
                                    {conv.contactName}
                                </span>
                                <span className="text-xs text-slate-400 flex-shrink-0">
                                    {conv.timestamp ? formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true }) : ''}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 truncate w-full">
                                {conv.lastMessage || 'No messages yet...'}
                            </p>

                            <div className="mt-1 flex items-center">
                                <StatusBadge status={conv.status} />
                            </div>
                        </button>
                    )
                })}
                {conversations.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No conversations found. Have you seeded the database?
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Helper component that renders a visual badge reflecting the conversation status.
 * e.g., NEW (Green), IN_PROGRESS (Amber), RESOLVED (Gray).
 * 
 * @param {{status: string}} props - The status string from the database.
 * @returns {JSX.Element} A colored badge span.
 */
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        NEW: 'bg-green-100 text-green-700',
        IN_PROGRESS: 'bg-amber-100 text-amber-700',
        RESOLVED: 'bg-slate-100 text-slate-700'
    }
    const label = status.replace('_', ' ')

    return (
        <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", styles[status] || styles['NEW'])}>
            {label}
        </span>
    )
}

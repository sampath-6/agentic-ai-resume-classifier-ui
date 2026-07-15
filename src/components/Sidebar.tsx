import { FileUp, LogOut, MessageSquare, Plus, Trash2, Workflow } from 'lucide-react'
import { useSessions } from '../sessions/SessionsContext'
import { useAuth } from '../auth/AuthContext'

interface SidebarProps {
  showDocs: boolean
  onOpenDocs: () => void
  onExitDocs: () => void
}

export function Sidebar({ showDocs, onOpenDocs, onExitDocs }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSessionId, createChatSession, deleteChatSession } =
    useSessions()
  const { email, logout } = useAuth()

  function selectSession(id: string) {
    setActiveSessionId(id)
    onExitDocs()
  }

  function newChat() {
    createChatSession()
    onExitDocs()
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-blue-100 bg-blue-950 text-blue-50">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <FileUp size={16} />
        </div>
        <span className="font-semibold">Resume Classifier</span>
      </div>

      <button
        onClick={newChat}
        className="mx-3 flex items-center justify-center gap-2 rounded-lg border border-blue-700 bg-blue-900/50 px-3 py-2 text-sm font-medium text-blue-50 transition hover:bg-blue-800"
      >
        <Plus size={16} />
        New chat
      </button>

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-2">
        {sessions.map((session) => {
          const isActive = !showDocs && session.id === activeSessionId
          return (
            <div
              key={session.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-900/60'
              }`}
            >
              <button
                onClick={() => selectSession(session.id)}
                className="flex flex-1 items-center gap-2 overflow-hidden text-left"
              >
                {session.type === 'upload' ? (
                  <FileUp size={16} className="shrink-0" />
                ) : (
                  <MessageSquare size={16} className="shrink-0" />
                )}
                <span className="truncate">{session.title}</span>
              </button>
              {session.type === 'chat' && (
                <button
                  onClick={() => deleteChatSession(session.id)}
                  className="hidden shrink-0 text-blue-200 hover:text-white group-hover:block"
                  aria-label="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </nav>

      <button
        onClick={onOpenDocs}
        className={`mx-2 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          showDocs ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-900/60'
        }`}
      >
        <Workflow size={16} className="shrink-0" />
        Architecture
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-blue-800 px-4 py-3 text-sm">
        <span className="truncate text-blue-200">{email}</span>
        <button
          onClick={logout}
          className="flex shrink-0 items-center gap-1 text-blue-200 hover:text-white"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

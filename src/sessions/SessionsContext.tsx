import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import type { Match } from '../api/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'blocked'
  content: string
  matches?: Match[]
  createdAt: number
}

export interface Session {
  id: string
  type: 'upload' | 'chat'
  title: string
  messages: ChatMessage[]
  createdAt: number
}

const UPLOAD_SESSION: Session = {
  id: 'upload-session',
  type: 'upload',
  title: 'Upload Resumes',
  messages: [],
  createdAt: 0,
}

const STORAGE_KEY = 'resume-classifier-sessions'

interface SessionsContextValue {
  sessions: Session[]
  activeSessionId: string
  setActiveSessionId: (id: string) => void
  createChatSession: () => void
  deleteChatSession: (id: string) => void
  appendMessage: (sessionId: string, message: ChatMessage) => void
  renameSession: (sessionId: string, title: string) => void
}

const SessionsContext = createContext<SessionsContextValue | undefined>(undefined)

function loadChatSessions(): Session[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as Session[]
    return parsed.filter((s) => s.type === 'chat')
  } catch {
    return []
  }
}

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [chatSessions, setChatSessions] = useState<Session[]>(() => loadChatSessions())
  const [activeSessionId, setActiveSessionId] = useState<string>(UPLOAD_SESSION.id)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions))
  }, [chatSessions])

  const sessions = [UPLOAD_SESSION, ...chatSessions]

  function createChatSession() {
    const session: Session = {
      id: uuid(),
      type: 'chat',
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
    }
    setChatSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
  }

  function deleteChatSession(id: string) {
    setChatSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) setActiveSessionId(UPLOAD_SESSION.id)
  }

  function appendMessage(sessionId: string, message: ChatMessage) {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s)),
    )
  }

  function renameSession(sessionId: string, title: string) {
    setChatSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)))
  }

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        activeSessionId,
        setActiveSessionId,
        createChatSession,
        deleteChatSession,
        appendMessage,
        renameSession,
      }}
    >
      {children}
    </SessionsContext.Provider>
  )
}

export function useSessions() {
  const ctx = useContext(SessionsContext)
  if (!ctx) throw new Error('useSessions must be used within SessionsProvider')
  return ctx
}

import { useEffect, useRef, useState } from 'react'
import { Loader2, Search, ShieldAlert, Send, Workflow } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { apiClient, extractErrorMessage } from '../api/client'
import type { QueryResult } from '../api/types'
import { useSessions, type ChatMessage } from './SessionsContext'
import { ResumeTable } from '../components/ResumeTable'
import { StepsPanel } from './StepsPanel'

const SUGGESTIONS = [
  'Senior Python backend engineer with AWS experience',
  'Frontend engineers with React and TypeScript',
  'Candidates with 5+ years of data engineering experience',
]

export function ChatSession({ sessionId }: { sessionId: string }) {
  const { sessions, appendMessage, renameSession, setSessionThreadId } = useSessions()
  const session = sessions.find((s) => s.id === sessionId)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length])

  if (!session) return null

  async function sendQuery(text: string) {
    const query = text.trim()
    if (!query || isSending) return

    if (session!.title === 'New chat') {
      renameSession(session!.id, query.length > 40 ? `${query.slice(0, 40)}…` : query)
    }

    appendMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      createdAt: Date.now(),
    })
    setInput('')
    setIsSending(true)

    try {
      const formData = new FormData()
      formData.append('query', query)
      // resume this chat's backend thread if it already has one
      if (session!.threadId) formData.append('thread_id', session!.threadId)
      const { data } = await apiClient.post<QueryResult>('/query', formData)

      // first response assigns the thread; reuse it for the rest of the chat
      if (!session!.threadId && data.thread_id) {
        setSessionThreadId(session!.id, data.thread_id)
      }

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        matches: data.matches,
        createdAt: Date.now(),
      }
      appendMessage(sessionId, message)
    } catch (err) {
      appendMessage(sessionId, {
        id: crypto.randomUUID(),
        role: 'blocked',
        content: extractErrorMessage(err, 'Something went wrong processing that query.'),
        createdAt: Date.now(),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {session.threadId && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-1.5">
          <span className="truncate font-mono text-[11px] text-slate-400" title={session.threadId}>
            thread: {session.threadId}
          </span>
          <button
            onClick={() => setShowSteps((v) => !v)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
              showSteps
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Workflow size={13} /> {showSteps ? 'Hide steps' : 'View steps'}
          </button>
        </div>
      )}
      {session.threadId && showSteps && <StepsPanel threadId={session.threadId} />}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
          {session.messages.length === 0 && (
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Search size={22} />
              </div>
              <p className="text-slate-500">
                Search indexed resumes by role, skill, or seniority.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendQuery(s)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {session.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Searching resumes…
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendQuery(input)
          }}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about candidates…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  if (message.role === 'blocked') {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-lg items-start gap-2 rounded-2xl rounded-bl-sm bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-start">
        <div className="markdown-answer max-w-2xl rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      {message.matches && message.matches.length > 0 && (
        <ResumeTable resumes={message.matches} searchable={false} />
      )}
    </div>
  )
}

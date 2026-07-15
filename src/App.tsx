import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Login } from './auth/Login'
import { SessionsProvider, useSessions } from './sessions/SessionsContext'
import { Sidebar } from './components/Sidebar'
import { UploadSession } from './sessions/UploadSession'
import { ChatSession } from './sessions/ChatSession'
import { Docs } from './docs/Docs'

function MainShell() {
  const { sessions, activeSessionId } = useSessions()
  const [showDocs, setShowDocs] = useState(false)
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar
        showDocs={showDocs}
        onOpenDocs={() => setShowDocs(true)}
        onExitDocs={() => setShowDocs(false)}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {showDocs ? (
          <Docs />
        ) : activeSession.type === 'upload' ? (
          <UploadSession />
        ) : (
          <ChatSession key={activeSession.id} sessionId={activeSession.id} />
        )}
      </main>
    </div>
  )
}

function AuthGate() {
  const { email } = useAuth()
  if (!email) return <Login />

  return (
    <SessionsProvider>
      <MainShell />
    </SessionsProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Static / offline build entry. Renders the FULL original app (sidebar + sessions +
// Architecture docs via the sidebar) exactly as in dev — but pre-seeds a placeholder
// auth session in localStorage so it lands on the app layout instead of the login screen
// when there is no backend to authenticate against.
//
// The documentation (Architecture, LangGraph, Semantic Query, REST API, Frontend,
// Design Journey) is fully browsable offline. Live features (upload / query / download)
// still require the backend on http://localhost:8000; without it they show a benign
// "could not load" state, which is expected in the static export.
try {
  if (!localStorage.getItem('resume-classifier-auth')) {
    localStorage.setItem(
      'resume-classifier-auth',
      JSON.stringify({ token: 'static-offline', email: 'retrieve-agent-test@gmail.com' }),
    )
  }
} catch {
  /* localStorage unavailable — the login screen will show instead */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

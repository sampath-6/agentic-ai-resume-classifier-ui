import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient, extractErrorMessage, setAuthToken, setUnauthorizedHandler } from '../api/client'

interface AuthContextValue {
  email: string | null
  isAuthenticating: boolean
  error: string | null
  login: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = 'resume-classifier-auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function logout() {
    setEmail(null)
    setAuthToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    setUnauthorizedHandler(logout)

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token: string; email: string }
        setAuthToken(parsed.token)
        setEmail(parsed.email)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(inputEmail: string) {
    setIsAuthenticating(true)
    setError(null)
    try {
      const { data } = await apiClient.post('/auth/login', { email: inputEmail })
      setAuthToken(data.token)
      setEmail(inputEmail)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, email: inputEmail }))
    } catch (err) {
      setError(extractErrorMessage(err, 'User is not authorized'))
      throw err
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <AuthContext.Provider value={{ email, isAuthenticating, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

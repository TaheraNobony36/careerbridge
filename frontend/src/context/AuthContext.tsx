import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  getCurrentUser,
  logoutUser,
  refreshSession,
  setAuthToken,
} from '../services/api'
import type { AuthState, AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (payload: AuthState) => void
  logout: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isStudent: boolean
  isCompany: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    try {
      window.localStorage.removeItem('careerbridge_auth')
    } catch {
      // Storage can be disabled by browser privacy settings.
    }

    const restoreSession = async () => {
      try {
        const session = await refreshSession()
        if (!mounted) return
        setAuthToken(session.access_token)
        const { data: user } = await getCurrentUser()
        if (mounted) setAuth({ user, access_token: session.access_token })
      } catch {
        setAuthToken(null)
        if (mounted) setAuth(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const clearSession = () => {
      setAuthToken(null)
      if (mounted) setAuth(null)
    }

    const updateAccessToken = (event: Event) => {
      const token = (event as CustomEvent<string>).detail
      if (mounted && typeof token === 'string') {
        setAuth((current) => current ? { ...current, access_token: token } : current)
      }
    }

    window.addEventListener('careerbridge:unauthorized', clearSession)
    window.addEventListener('careerbridge:token-refreshed', updateAccessToken)
    void restoreSession()

    return () => {
      mounted = false
      window.removeEventListener('careerbridge:unauthorized', clearSession)
      window.removeEventListener('careerbridge:token-refreshed', updateAccessToken)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: auth?.user ?? null,
    token: auth?.access_token ?? null,
    login: (payload: AuthState) => {
      setAuthToken(payload.access_token)
      setAuth(payload)
    },
    logout: async () => {
      await logoutUser()
      setAuthToken(null)
      setAuth(null)
    },
    loading,
    isAuthenticated: Boolean(auth?.user),
    isAdmin: auth?.user?.role === 'admin' || auth?.user?.role === 'super_admin',
    isSuperAdmin: auth?.user?.role === 'super_admin',
    isStudent: auth?.user?.role === 'student',
    isCompany: auth?.user?.role === 'company',
  }), [auth, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

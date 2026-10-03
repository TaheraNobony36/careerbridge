import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { setAuthToken } from '../services/api'
import type { AuthState, AuthUser } from '../types/auth'

const STORAGE_KEY = 'careerbridge_auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (payload: AuthState) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isStudent: boolean
  isCompany: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getStoredAuth = (): AuthState | null => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuthState
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => getStoredAuth())

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
      setAuthToken(auth.access_token)
      return
    }

    localStorage.removeItem(STORAGE_KEY)
    setAuthToken(null)
  }, [auth])

  const value = useMemo<AuthContextValue>(() => ({
    user: auth?.user ?? null,
    token: auth?.access_token ?? null,
    login: (payload: AuthState) => setAuth(payload),
    logout: () => setAuth(null),
    isAuthenticated: Boolean(auth?.user),
    isAdmin: auth?.user?.role === 'admin',
    isStudent: auth?.user?.role === 'student',
    isCompany: auth?.user?.role === 'company',
  }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

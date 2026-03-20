'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Role } from '@/lib/types'

interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  role: Role
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  isAdmin: boolean
  isDoctor: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isDoctor: false,
  login: async () => ({ success: false }),
  logout: () => {},
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      setUser(data.user)
      return { success: true }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isAdmin: user?.role === 'ADMIN',
        isDoctor: user?.role === 'DOCTOR',
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

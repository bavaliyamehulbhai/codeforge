import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useToast } from './toast-context'
import { User } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('codeforge_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(data.user)
      } catch (err) {
        localStorage.removeItem('codeforge_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
      localStorage.setItem('codeforge_token', data.token)
      setUser(data.user)
      toast('Welcome back to CodeForge!', 'success')
      return { error: null }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed'
      toast(msg, 'error')
      return { error: msg }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/signup`, { email, password, username })
      localStorage.setItem('codeforge_token', data.token)
      setUser(data.user)
      toast('Account created successfully!', 'success')
      return { error: null }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Signup failed'
      toast(msg, 'error')
      return { error: msg }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('codeforge_token')
    setUser(null)
    toast('Logged out successfully', 'info')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUser, isConfigured: true }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

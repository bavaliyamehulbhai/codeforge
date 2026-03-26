import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Snippet } from '@/types'
import { useAuth } from '@/lib/auth-context'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function useSnippets() {
  const { user } = useAuth()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(false)

  const getHeaders = () => {
    const token = localStorage.getItem('codeforge_token')
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }

  const fetchSnippets = useCallback(async (params?: { search?: string, language?: string, tag?: string, workspace_id?: string }) => {
    if (!user) { setSnippets([]); return }
    setLoading(true)
    
    try {
      const { data } = await axios.get(`${API_URL}/snippets`, {
        headers: getHeaders(),
        params
      })
      setSnippets(data)
    } catch (err) {
      console.error('Error fetching snippets:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchSnippetById = async (id: string): Promise<Snippet | null> => {
    try {
      const { data } = await axios.get(`${API_URL}/snippets/${id}`, {
        headers: getHeaders()
      })
      return data
    } catch (err) {
      console.error('Error fetching snippet:', err)
      return null
    }
  }

  useEffect(() => { fetchSnippets() }, [fetchSnippets])

  const saveSnippet = async (data: {
    title: string
    language: string
    code: string
    is_public?: boolean
    tags?: string[]
    workspace_id?: string | null
  }): Promise<Snippet | null> => {
    if (!user) return null

    // Create a temporary ID for the optimistic item
    const tempId = Math.random().toString(36).substring(7)
    const tempSnippet: Snippet = {
      id: tempId,
      ...data,
      is_public: data.is_public ?? false,
      tags: data.tags ?? [],
      user_id: user.id,
      workspace_id: data.workspace_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      run_count: 0,
      likes: 0
    }

    setSnippets(prev => [tempSnippet, ...prev])

    try {
      const { data: newSnippet } = await axios.post(`${API_URL}/snippets`, data, {
        headers: getHeaders()
      })
      // Replace temp snippet with real one
      setSnippets(prev => prev.map(s => s.id === tempId ? newSnippet : s))
      return newSnippet
    } catch (err) {
      console.error('Error saving snippet:', err)
      // Rollback
      setSnippets(prev => prev.filter(s => s.id !== tempId))
      return null
    }
  }

  const updateSnippet = async (id: string, data: Partial<Snippet>): Promise<Snippet | null> => {
    try {
      const { data: updatedSnippet } = await axios.patch(`${API_URL}/snippets/${id}`, data, {
        headers: getHeaders()
      })
      setSnippets(prev => prev.map(s => s.id === id ? updatedSnippet : s))
      return updatedSnippet
    } catch (err) {
      console.error('Error updating snippet:', err)
      return null
    }
  }

  const deleteSnippet = async (id: string): Promise<boolean> => {
    const originalSnippets = [...snippets]
    setSnippets(prev => prev.filter(s => s.id !== id))

    try {
      await axios.delete(`${API_URL}/snippets/${id}`, {
        headers: getHeaders()
      })
      return true
    } catch (err) {
      console.error('Error deleting snippet:', err)
      // Rollback
      setSnippets(originalSnippets)
      return false
    }
  }

  const incrementRunCount = async (id: string): Promise<{ ok: boolean; remainingRuns?: number; error?: string }> => {
    try {
      const { data } = await axios.post(`${API_URL}/snippets/${id}/run`, {}, {
        headers: getHeaders()
      })
      return { ok: true, remainingRuns: data?.remaining_runs }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Run limit reached'
      console.error('Error incrementing run count:', err)
      return { ok: false, error: message }
    }
  }

  const toggleLike = async (id: string): Promise<{ likes: number; isLiked: boolean } | null> => {
    if (!user) return null
    try {
      const { data } = await axios.post(`${API_URL}/snippets/${id}/like`, {}, {
        headers: getHeaders()
      })
      setSnippets(prev => prev.map(s => s.id === id ? { ...s, likes: data.likes } : s))
      return data
    } catch (err) {
      console.error('Failed to toggle like:', err)
      return null
    }
  }

  return { 
    snippets, 
    loading, 
    saveSnippet, 
    updateSnippet,
    deleteSnippet, 
    fetchSnippets, 
    fetchSnippetById, 
    incrementRunCount, 
    toggleLike 
  }
}

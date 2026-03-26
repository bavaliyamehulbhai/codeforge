import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import { useSnippets } from '@/hooks/useSnippets'
import { useAuth } from '@/lib/auth-context'
import { Trash2, ExternalLink, Code2, Search, Heart, Play } from 'lucide-react'
import { LANGUAGES } from '@/lib/languages'
import styles from './Snippets.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Snippets() {
  const { user } = useAuth()
  const location = useLocation()
  const { snippets, loading, deleteSnippet, fetchSnippets, toggleLike } = useSnippets()
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')
  const [tag, setTag] = useState('all')
  const [workspaceId, setWorkspaceId] = useState('all')
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [usage, setUsage] = useState({ compiler_runs: 0, voice_minutes: 0 })
  const [limits, setLimits] = useState({ compiler_runs: 0, voice_minutes: 0 })
  const token = localStorage.getItem('codeforge_token')
  const hasScheduledCancel = Boolean(user?.subscription?.cancel_at_period_end)

  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const workspaceParam = params.get('workspace_id')
    if (workspaceParam) {
      setWorkspaceId(workspaceParam)
    }
  }, [location.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSnippets({
        search,
        language: language === 'all' ? undefined : language,
        tag: tag === 'all' ? undefined : tag,
        workspace_id: workspaceId === 'all' ? undefined : workspaceId,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, language, tag, workspaceId, fetchSnippets])

  useEffect(() => {
    if (!user) return
    const fetchWorkspaces = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/workspaces`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        setWorkspaces(data)
      } catch (err) {
        console.error('Failed to fetch workspaces', err)
      }
    }
    fetchWorkspaces()
  }, [user, token])

  useEffect(() => {
    if (!user) return
    const fetchUsage = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/auth/usage`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        setUsage(data?.usage || { compiler_runs: 0, voice_minutes: 0 })
        setLimits(data?.limits || { compiler_runs: 0, voice_minutes: 0 })
      } catch (err) {
        // Ignore usage errors in snippets view.
      }
    }
    fetchUsage()
  }, [user, token])

  // Get unique tags for the filter
  const allTags = Array.from(new Set(snippets.flatMap(s => s.tags || []))).sort()
  const workspaceNameById = new Map(workspaces.map((ws) => [ws.id, ws.name]))

  if (!user) return <div className={styles.empty}>Please sign in to view your snippets.</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Snippets</h1>
        <p className={styles.subtitle}>{snippets.length} saved projects</p>
      </header>

      {limits.compiler_runs > 0 && usage.compiler_runs / limits.compiler_runs >= 0.8 && (
        <div className={styles.quotaBanner}>
          <div>
            <strong>Usage alert:</strong> You have used {usage.compiler_runs} of {limits.compiler_runs} compiler runs.
          </div>
          <Link to="/settings" className={styles.quotaCta}>Upgrade plan</Link>
        </div>
      )}

      {limits.voice_minutes > 0 && usage.voice_minutes / limits.voice_minutes >= 0.8 && (
        <div className={styles.quotaBanner}>
          <div>
            <strong>Usage alert:</strong> You have used {usage.voice_minutes} of {limits.voice_minutes} voice minutes.
          </div>
          <Link to="/settings" className={styles.quotaCta}>Upgrade plan</Link>
        </div>
      )}

      {hasScheduledCancel && (
        <div className={styles.cancelBanner}>
          <div>
            <strong>Cancellation scheduled:</strong> Access ends on {formatDate(user?.subscription?.current_period_end)}.
          </div>
          <Link to="/settings" className={styles.cancelCta}>Manage billing</Link>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search title or tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select 
            className={styles.filterSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select 
            className={styles.filterSelect}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            {allTags.map(t => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          >
            <option value="all">All Workspaces</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.clearFilters}
            onClick={() => {
              setSearch('')
              setLanguage('all')
              setTag('all')
              setWorkspaceId('all')
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading your snippets...</div>
      ) : snippets.length === 0 ? (
        <div className={styles.emptyState}>
          <Code2 size={48} />
          <h3>No snippets found</h3>
          <p>Try adjusting your search or filters.</p>
          <Link to="/compiler" className={styles.createBtn}>Create a snippet</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {snippets.map(snippet => (
            <div key={snippet.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.badgeRow}>
                  <span className={styles.langBadge}>{snippet.language}</span>
                  {snippet.workspace_id && workspaceNameById.get(snippet.workspace_id) && (
                    <span className={styles.workspaceBadge}>{workspaceNameById.get(snippet.workspace_id)}</span>
                  )}
                </div>
                <div className={styles.actions}>
                  <Link 
                    to="/compiler" 
                    state={{ snippet }} 
                    className={styles.iconBtn}
                    title="Open in Compiler"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button 
                    onClick={() => {
                      const confirmDelete = window.confirm('Delete this snippet? This cannot be undone.')
                      if (!confirmDelete) return
                      deleteSnippet(snippet.id)
                    }} 
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className={styles.snippetTitle}>{snippet.title}</h3>
              <div className={styles.tags}>
                {(snippet.tags || []).map(t => (
                  <span key={t} className={styles.tag}>#{t}</span>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.stats}>
                  <button 
                    onClick={() => toggleLike(snippet.id)}
                    className={styles.stat}
                    title="Likes"
                  >
                    <Heart 
                      size={13} 
                      className={snippet.likes > 0 ? styles.liked : ''} 
                      fill={snippet.likes > 0 ? "currentColor" : "none"} 
                    />
                    <span>{snippet.likes}</span>
                  </button>
                  <div className={styles.stat} title="Executions">
                    <Play size={13} fill="currentColor" />
                    <span>{snippet.run_count}</span>
                  </div>
                </div>
                <div className={styles.date}>
                  {new Date(snippet.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

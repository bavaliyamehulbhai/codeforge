import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnippets } from '@/hooks/useSnippets'
import { useAuth } from '@/lib/auth-context'
import { 
  Trash2, ExternalLink, Code2, Search, Heart, Play,
  LayoutGrid, List, Pin, CheckSquare, Square, X
} from 'lucide-react'
import clsx from 'clsx'
import { LANGUAGES } from '@/lib/languages'
import styles from './Snippets.module.css'

export default function Snippets() {
  const { user } = useAuth()
  const { snippets, loading, deleteSnippet, fetchSnippets, toggleLike } = useSnippets()
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('pinned_snippets') || '[]')
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSnippets({ search, language })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, language, fetchSnippets])

  useEffect(() => {
    localStorage.setItem('pinned_snippets', JSON.stringify(pinnedIds))
  }, [pinnedIds])

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleBatchDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} snippets?`)) {
      for (const id of selectedIds) {
        await deleteSnippet(id)
      }
      setSelectedIds([])
    }
  }

  const sortedSnippets = [...snippets].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id)
    const bPinned = pinnedIds.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return 0
  })

  if (!user) {
    return (
      <div className={styles.emptyAuth}>
        <Code2 size={48} />
        <h3>Sign in to access your snippets</h3>
        <p>Save, organize, and revisit your projects across devices.</p>
        <div className={styles.emptyActions}>
          <Link to="/auth" className={styles.primaryAction}>Sign In</Link>
          <Link to="/compiler" className={styles.secondaryAction}>Try the Compiler</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Snippets</h1>
        <p className={styles.subtitle}>{snippets.length} saved projects</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className={styles.filterSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="all">Languages</option>
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.controlsRight}>
          <div className={styles.viewToggle}>
            <button 
              className={clsx(styles.toggleBtn, viewMode === 'grid' && styles.activeToggle)}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={clsx(styles.toggleBtn, viewMode === 'list' && styles.activeToggle)}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.batchToolbar}>
          <div className={styles.batchInfo}>
            <CheckSquare size={18} />
            <span>{selectedIds.length} selected</span>
          </div>
          <div className={styles.batchActions}>
            <button onClick={() => setSelectedIds([])} className={styles.cancelBatch}>
              <X size={16} /> Cancel
            </button>
            <button onClick={handleBatchDelete} className={styles.deleteBatch}>
              <Trash2 size={16} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading your snippets...</div>
      ) : snippets.length === 0 ? (
        <div className={styles.emptyState}>
          <Code2 size={48} />
          <h3>No snippets yet</h3>
          <p>Start coding and save your first project to see it here.</p>
          <Link to="/compiler" className={styles.createBtn}>Create First Snippet</Link>
        </div>
      ) : (
        <div className={clsx(styles.content, styles[viewMode])}>
          {sortedSnippets.map(snippet => (
            <div 
              key={snippet.id} 
              className={clsx(
                styles.card, 
                pinnedIds.includes(snippet.id) && styles.pinned,
                selectedIds.includes(snippet.id) && styles.selected
              )}
              onClick={(e) => selectedIds.length > 0 && toggleSelect(snippet.id, e)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <button 
                    onClick={(e) => toggleSelect(snippet.id, e)}
                    className={clsx(styles.selectBtn, selectedIds.includes(snippet.id) && styles.selectedCheck)}
                  >
                    {selectedIds.includes(snippet.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span className={styles.langBadge}>{snippet.language}</span>
                </div>
                <div className={styles.actions}>
                  <button 
                    onClick={(e) => togglePin(snippet.id, e)} 
                    className={clsx(styles.pinBtn, pinnedIds.includes(snippet.id) && styles.activePin)}
                    title="Pin to Top"
                  >
                    <Pin size={16} />
                  </button>
                  <Link 
                    to={`/compiler?id=${snippet.id}`} 
                    className={styles.iconBtn}
                    title="Open in Compiler"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSnippet(snippet.id) }} 
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <h3 className={styles.snippetTitle}>{snippet.title}</h3>
                {viewMode === 'list' && (
                  <p className={styles.codeSnippet}>{snippet.code.slice(0, 100)}...</p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.stats}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(snippet.id) }}
                    className={styles.stat}
                    title="Likes"
                  >
                    <Heart size={13} className={snippet.likes > 0 ? styles.liked : ''} />
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

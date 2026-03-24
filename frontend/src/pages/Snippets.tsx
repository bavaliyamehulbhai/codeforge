import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnippets } from '@/hooks/useSnippets'
import { useAuth } from '@/lib/auth-context'
import { Trash2, ExternalLink, Code2, Search, Heart, Play } from 'lucide-react'
import { LANGUAGES } from '@/lib/languages'
import styles from './Snippets.module.css'

export default function Snippets() {
  const { user } = useAuth()
  const { snippets, loading, deleteSnippet, fetchSnippets, toggleLike } = useSnippets()
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSnippets({ search, language })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, language, fetchSnippets])

  if (!user) return <div className={styles.empty}>Please sign in to view your snippets.</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Snippets</h1>
        <p className={styles.subtitle}>{snippets.length} saved projects</p>
      </header>

      <div className={styles.controls}>
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
          <option value="all">All Languages</option>
          {LANGUAGES.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

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
        <div className={styles.grid}>
          {snippets.map(snippet => (
            <div key={snippet.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.langBadge}>{snippet.language}</span>
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
                    onClick={() => deleteSnippet(snippet.id)} 
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className={styles.snippetTitle}>{snippet.title}</h3>
              <div className={styles.cardFooter}>
                <div className={styles.stats}>
                  <button 
                    onClick={() => toggleLike(snippet.id)}
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

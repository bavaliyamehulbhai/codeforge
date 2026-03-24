import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Search, Globe, Heart,
  ArrowUpRight, Play, Library
} from 'lucide-react'
import { useSnippets } from '@/hooks/useSnippets'
import { Snippet } from '@/types'
import Skeleton from '@/components/Skeleton'
import styles from './Gallery.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Gallery() {
  const { toggleLike } = useSnippets()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')

  useEffect(() => {
    const fetchPublicFeed = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/snippets/feed/public`)
        setSnippets(data)
      } catch (err) {
        console.error('Failed to fetch feed')
      } finally {
        setLoading(false)
      }
    }
    fetchPublicFeed()
  }, [])

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
    const matchesLang = language === 'all' || s.language === language
    return matchesSearch && matchesLang
  })

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.badge}><Globe size={14} /> Global Feed</div>
          <h1>Public Gallery</h1>
          <p>Discover and fork amazing code snippets from the CodeForge community.</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search public snippets..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            className={styles.filter}
          >
            <option value="all">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="rust">Rust</option>
          </select>
        </div>
      </header>

      <div className={styles.grid}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className={styles.cardSkeleton}>
              <Skeleton height={200} />
            </div>
          ))
        ) : filteredSnippets.map(s => (
          <div key={s.id} className={`${styles.card} premium-glass`}>
            <div className={styles.cardContent}>
              <div className={styles.cardHead}>
                <span className={styles.langBadge}>{s.language}</span>
                <span className={styles.owner}>@{s.user_id.substring(0, 8)}</span>
              </div>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.preview}>
                {s.code.substring(0, 100)}...
              </p>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.footerLeft}>
                <button 
                  onClick={() => toggleLike(s.id).then((res: { likes: number; isLiked: boolean } | null) => {
                    if (res) setSnippets(prev => prev.map(sn => sn.id === s.id ? { ...sn, likes: res.likes } : sn))
                  })}
                  className={styles.likeBtn}
                >
                  <Heart size={14} className={s.likes > 0 ? styles.activeHeart : ''} />
                  <span>{s.likes}</span>
                </button>
                <Link to={`/share/${s.id}`} className={styles.viewBtn}>
                  View <ArrowUpRight size={14} />
                </Link>
              </div>
              <Link to="/compiler" state={{ snippet: s }} className={styles.forkBtn}>
                Fork <Play size={14} fill="currentColor" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredSnippets.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Library size={64} strokeWidth={1} />
            <div className={styles.emptyGlow} />
          </div>
          <h3>No snippets found</h3>
          <p>Try adjusting your search or filters to discover community creations.</p>
        </div>
      )}
    </div>
  )
}

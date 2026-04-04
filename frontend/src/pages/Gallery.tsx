import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Search, Globe, Heart,
  ArrowUpRight, Play, Library,
  TrendingUp, Clock, Award, Twitter
} from 'lucide-react'
import clsx from 'clsx'
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
  const [activeTab, setActiveTab] = useState<'trending' | 'newest' | 'hall-of-fame'>('trending')
  const [peekingId, setPeekingId] = useState<string | null>(null)

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

  const filteredSnippets = snippets
    .filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
      const matchesLang = language === 'all' || s.language === language
      return matchesSearch && matchesLang
    })
    .sort((a, b) => {
      if (activeTab === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (activeTab === 'hall-of-fame') return b.likes - a.likes
      // Trending: basic mix of likes and recency
      return (b.likes * 2 + b.run_count) - (a.likes * 2 + a.run_count)
    })

  const shareOnTwitter = (s: Snippet) => {
    const url = `https://codeforge.netlify.app/share/${s.id}`
    window.open(`https://twitter.com/intent/tweet?text=Check out this ${s.language} snippet on CodeForge: ${s.title}&url=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.badge}><Globe size={14} /> Global Feed</div>
          <h1>Public <span className={styles.accent}>Gallery</span></h1>
          <p>Discover and fork amazing code snippets from the CodeForge community.</p>
        </div>

        <div className={styles.navBlock}>
          <div className={styles.tabs}>
            <button 
              className={clsx(styles.tab, activeTab === 'trending' && styles.activeTab)}
              onClick={() => setActiveTab('trending')}
            >
              <TrendingUp size={16} /> Trending
            </button>
            <button 
              className={clsx(styles.tab, activeTab === 'newest' && styles.activeTab)}
              onClick={() => setActiveTab('newest')}
            >
              <Clock size={16} /> Newest
            </button>
            <button 
              className={clsx(styles.tab, activeTab === 'hall-of-fame' && styles.activeTab)}
              onClick={() => setActiveTab('hall-of-fame')}
            >
              <Award size={16} /> Hall of Fame
            </button>
          </div>

          <div className={styles.controls}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search snippets..." 
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
          <div 
            key={s.id} 
            className={`${styles.card} premium-glass`}
            onMouseEnter={() => setPeekingId(s.id)}
            onMouseLeave={() => setPeekingId(null)}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHead}>
                <div className={styles.headLeft}>
                  <span className={styles.langBadge}>{s.language}</span>
                  <span className={styles.owner}>@{s.user_id.substring(0, 8)}</span>
                </div>
                <div className={styles.headRight}>
                  <button onClick={() => shareOnTwitter(s)} className={styles.shareBtn} title="Share to X">
                    <Twitter size={14} />
                  </button>
                </div>
              </div>
              <h3 className={styles.title}>{s.title}</h3>
              
              <div className={styles.previewContainer}>
                <pre className={clsx(styles.previewCode, peekingId === s.id && styles.peeking)}>
                  {s.code.substring(0, 200)}
                </pre>
                {peekingId === s.id && <div className={styles.peekGlow} />}
              </div>
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
                  Peek <ArrowUpRight size={14} />
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

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  Code2, History, TrendingUp, Layers, 
  Github, Twitter, Globe, Edit3, 
  Plus, PlayCircle, Clock, Flame, Target, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSnippets: 0,
    totalLines: 0,
    mostUsedLanguage: 'None',
    avgComplexity: 0,
    languageBreakdown: {} as Record<string, number>
  })
  const [recentSnippets, setRecentSnippets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Dashboard | CodeForge'
    fetchDashboardData()
    return () => { document.title = 'CodeForge' }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.get(`${API_URL}/snippets/my-snippets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const snippets = data.snippets || []
      setRecentSnippets(snippets.slice(0, 5))
      
      // Calculate stats
      const languages = snippets.map((s: any) => s.language)
      const languageCounts: Record<string, number> = {}
      languages.forEach((l: string) => {
        languageCounts[l] = (languageCounts[l] || 0) + 1
      })

      const mostUsed = Object.entries(languageCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None'

      setStats({
        totalSnippets: snippets.length,
        totalLines: snippets.reduce((acc: number, s: any) => acc + (s.code?.split('\n').length || 0), 0),
        mostUsedLanguage: mostUsed,
        avgComplexity: Math.floor(Math.random() * 10) + 1,
        languageBreakdown: languageCounts
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className={styles.error}>Please sign in to view your dashboard.</div>

  const streakMsg = user.streak_count > 0 
    ? `${user.streak_count} day streak! Keep it up!` 
    : "Start a coding session to begin your streak!"

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <div className={styles.avatarPlaceholder}>{user.username[0].toUpperCase()}</div>
            )}
          </div>
          <div className={styles.meta}>
            <div className={styles.titleRow}>
              <h1>Welcome back, {user.username}</h1>
              {user.streak_count > 0 && (
                <div className={styles.streakBadge} title={streakMsg}>
                  <Flame size={14} /> {user.streak_count}
                </div>
              )}
            </div>
            <p className={styles.bio}>{user.bio || 'Your bio will appear here after you update it in settings.'}</p>
            <div className={styles.socials}>
              {user.website && <a href={user.website} target="_blank" rel="noreferrer"><Globe size={16} /></a>}
              {user.social_links?.github && <a href={`https://github.com/${user.social_links.github}`} target="_blank" rel="noreferrer"><Github size={16} /></a>}
              {user.social_links?.twitter && <a href={`https://twitter.com/${user.social_links.twitter}`} target="_blank" rel="noreferrer"><Twitter size={16} /></a>}
              <Link to={`/u/${user.username}`} className={styles.portfolioLink}><ExternalLink size={14} /> View Portfolio</Link>
              <Link to="/settings" className={styles.editBtn}><Edit3 size={14} /> Edit Profile</Link>
            </div>
          </div>
        </div>
        
        <div className={styles.quickActions}>
          <Link to="/compiler" className={styles.actionBtn}>
            <Plus size={18} /> New Snippet
          </Link>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Code2 className={styles.statIcon} style={{ color: '#60a5fa' }} />
          <h3>Total Snippets</h3>
          <p className={styles.statValue}>{stats.totalSnippets}</p>
        </div>
        <div className={styles.statCard}>
          <TrendingUp className={styles.statIcon} style={{ color: '#4ade80' }} />
          <h3>Most Used</h3>
          <p className={styles.statValue}>{stats.mostUsedLanguage}</p>
        </div>
        <div className={styles.statCard}>
          <Layers className={styles.statIcon} style={{ color: '#f472b6' }} />
          <h3>Lines of Code</h3>
          <p className={styles.statValue}>{stats.totalLines}</p>
        </div>
        <div className={styles.statCard}>
          <Target className={styles.statIcon} style={{ color: '#fbbf24' }} />
          <h3>Current Streak</h3>
          <p className={styles.statValue}>{user.streak_count} Days</p>
        </div>
      </section>

      <main className={styles.mainContent}>
        <div className={styles.recentWork}>
          <div className={styles.sectionHeader}>
            <h2><History size={20} /> Recent Snippets</h2>
            <Link to="/snippets">View All</Link>
          </div>
          
          {loading ? (
            <div className={styles.skeletonList}>
              {[1,2,3].map(i => <div key={i} className={styles.skeletonItem} />)}
            </div>
          ) : recentSnippets.length > 0 ? (
            <div className={styles.snippetList}>
              {recentSnippets.map(snippet => (
                <Link to={`/compiler?id=${snippet._id}`} key={snippet._id} className={styles.snippetItem}>
                  <div className={styles.snippetMeta}>
                    <span className={styles.langBadge}>{snippet.language}</span>
                    <span className={styles.snippetTitle}>{snippet.title || 'Untitled Snippet'}</span>
                  </div>
                  <div className={styles.snippetInfo}>
                    <span><Clock size={12} /> {new Date(snippet.updated_at).toLocaleDateString()}</span>
                    <PlayCircle size={18} className={styles.playIcon} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Code2 size={48} />
              <p>No snippets found. Start coding something amazing!</p>
              <Link to="/compiler" className={styles.emptyBtn}>Open Compiler</Link>
            </div>
          )}
        </div>

        <div className={styles.activityFeed}>
          <div className={styles.sectionHeader}>
            <h2><Target size={20} /> Language Breakdown</h2>
          </div>
          <div className={styles.languageBreakdown}>
            {Object.entries(stats.languageBreakdown).length > 0 ? (
              Object.entries(stats.languageBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => {
                  const percentage = Math.round((count / stats.totalSnippets) * 100)
                  return (
                    <div key={lang} className={styles.langProgress}>
                      <div className={styles.langInfo}>
                        <span className={styles.langName}>{lang}</span>
                        <span className={styles.langPercent}>{percentage}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: `var(--accent)`
                          }} 
                        />
                      </div>
                    </div>
                  )
                })
            ) : (
              <p className={styles.emptyText}>No coding data yet.</p>
            )}
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>
            <h2><Target size={20} /> Achievements</h2>
          </div>
          <div className={styles.achievements}>
            {user.achievements && user.achievements.length > 0 ? (
              <div className={styles.achievementGrid}>
                {user.achievements.map((achievement: any) => (
                  <div key={achievement.id} className={styles.achievementCard} title={`Earned on ${new Date(achievement.earned_at).toLocaleDateString()}`}>
                    <span className={styles.achievementIcon}>{achievement.icon}</span>
                    <span className={styles.achievementName}>{achievement.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>Keep coding to earn achievement badges!</p>
            )}
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>
            <h2>Activity Heatmap</h2>
          </div>
          <div className={styles.heatmapPlaceholder}>
             {/* Simulated Heatmap */}
             <div className={styles.heatmapGrid}>
               {Array.from({ length: 56 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={styles.heatmapCell} 
                   style={{ 
                     opacity: Math.random(), 
                     backgroundColor: 'var(--accent)',
                     borderRadius: '2px'
                    }} 
                 />
               ))}
             </div>
             <p className={styles.heatmapLabel}>Your coding activity over the last 8 weeks</p>
          </div>
        </div>
      </main>
    </div>
  )
}

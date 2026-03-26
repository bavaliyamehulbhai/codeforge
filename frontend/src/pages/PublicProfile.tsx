import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Github, Twitter, Globe, Code2, 
  ExternalLink, Clock, PlayCircle, Loader2,
  Linkedin, Flame
} from 'lucide-react'
import axios from 'axios'
import styles from './PublicProfile.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function PublicProfile() {
  const { username } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API_URL}/auth/profile/${username}`)
      setData(data)
      document.title = `${data.user.username} | CodeForge Portfolio`
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className={styles.loading}>
      <Loader2 className={styles.spin} size={48} />
      <p>Loading portfolio...</p>
    </div>
  )

  if (error) return (
    <div className={styles.error}>
      <h1>404</h1>
      <p>{error}</p>
      <Link to="/" className={styles.backBtn}>Back to Home</Link>
    </div>
  )

  const { user, snippets } = data

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <div className={styles.avatarPlaceholder}>{user.username[0].toUpperCase()}</div>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.usernameRow}>
              <h1>{user.username}</h1>
              {user.streak_count > 0 && (
                <div className={styles.streakBadge}>
                  <Flame size={14} /> {user.streak_count} Day Streak
                </div>
              )}
            </div>
            <p className={styles.bio}>{user.bio || 'This user is busy coding and hasn\'t written a bio yet.'}</p>
            <div className={styles.links}>
              {user.website && (
                <a href={user.website} target="_blank" rel="noreferrer" className={styles.link}>
                  <Globe size={16} /> Website
                </a>
              )}
              {user.social_links?.github && (
                <a href={`https://github.com/${user.social_links.github}`} target="_blank" rel="noreferrer" className={styles.link}>
                  <Github size={16} /> GitHub
                </a>
              )}
              {user.social_links?.twitter && (
                <a href={`https://twitter.com/${user.social_links.twitter}`} target="_blank" rel="noreferrer" className={styles.link}>
                  <Twitter size={16} /> Twitter
                </a>
              )}
              {user.social_links?.linkedin && (
                <a href={`https://linkedin.com/in/${user.social_links.linkedin}`} target="_blank" rel="noreferrer" className={styles.link}>
                  <Linkedin size={16} /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2><Code2 size={24} /> Public Snippets</h2>
          <span className={styles.count}>{snippets.length} snippets</span>
        </div>

        {snippets.length > 0 ? (
          <div className={styles.grid}>
            {snippets.map((snippet: any) => (
              <Link
                to="/compiler"
                state={{ snippet }}
                key={snippet.id}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.lang}>{snippet.language}</span>
                  <ExternalLink size={16} className={styles.linkIcon} />
                </div>
                <h3>{snippet.title || 'Untitled Snippet'}</h3>
                <p className={styles.preview}>{snippet.code.slice(0, 100)}...</p>
                <div className={styles.cardFooter}>
                  <span><Clock size={12} /> {new Date(snippet.created_at).toLocaleDateString()}</span>
                  <PlayCircle size={20} className={styles.play} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Code2 size={48} />
            <p>No public snippets yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

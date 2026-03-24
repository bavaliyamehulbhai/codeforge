import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Code2, LogOut, Code, Library, Globe } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Hide Navbar on Compiler page for a full-screen IDE experience
  if (location.pathname === '/compiler') return null

  return (
    <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.navInner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Code2 size={24} />
          </div>
          <span className={styles.logoText}>CodeForge</span>
        </Link>

        <div className={styles.links}>
          <Link to="/compiler" className={styles.link}>
            <Code size={18} />
            <span>Compiler</span>
          </Link>
          <Link to="/snippets" className={styles.link}>
            <Library size={18} />
            <span>My Snippets</span>
          </Link>
          <Link to="/gallery" className={styles.link}>
            <Globe size={18} />
            <span>Gallery</span>
          </Link>
        </div>

        <div className={styles.auth}>
          {user ? (
            <div className={styles.userProfile}>
              <Link to="/settings" className={styles.userBtn}>
                <span className={styles.username}>{user.username}</span>
                <Code size={14} className={styles.settingsIcon} />
              </Link>
              <button onClick={handleSignOut} className={styles.signOutBtn} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className={styles.loginBtn}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Code2, LogOut, Code, Library, Globe } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const firstMenuRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null)

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

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        hamburgerRef.current?.focus()
      }
      // Focus first item when opened
      if (e.key === 'Tab') return
    }
    document.addEventListener('keydown', onKey)
    // focus first menu item when opening
    setTimeout(() => {
      firstMenuRef.current?.focus()
    }, 0)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

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

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          className={styles.hamburger}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(v => !v)}
        >
          <span className={menuOpen ? styles.hamOpen : ''} />
        </button>

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

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)}>
          <div id="mobile-menu" className={styles.mobileMenu} role="menu" onClick={e => e.stopPropagation()}>
            <Link ref={firstMenuRef as any} to="/compiler" className={styles.mobileLink} role="menuitem" onClick={() => setMenuOpen(false)}>Compiler</Link>
            <Link to="/snippets" className={styles.mobileLink} role="menuitem" onClick={() => setMenuOpen(false)}>My Snippets</Link>
            <Link to="/gallery" className={styles.mobileLink} role="menuitem" onClick={() => setMenuOpen(false)}>Gallery</Link>
            {user ? (
              <button onClick={() => { setMenuOpen(false); handleSignOut() }} className={styles.mobileLink}>Sign Out</button>
            ) : (
              <Link to="/auth" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

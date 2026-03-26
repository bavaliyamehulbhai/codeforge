import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Code2, LogOut, Code, Library, Globe, Mic, MicOff, LayoutDashboard, Users } from 'lucide-react'
import { useGlobalCoderSpeak } from '@/lib/coder-speak-context'
import Tooltip from '@/components/Tooltip'
import VoiceWaveform from '@/components/VoiceWaveform'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const { isListening, toggleListening, isSupported } = useGlobalCoderSpeak()
  const voiceEnabled = user?.preferences?.voiceEnabled ?? true
  const billingStatus = user?.subscription?.cancel_at_period_end ? 'canceling' : user?.plan && user.plan !== 'free' ? 'active' : null
  const billingLabel = billingStatus === 'canceling' ? 'Ending Soon' : billingStatus === 'active' ? user?.plan?.toUpperCase() : null
  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  const billingTooltip = billingStatus === 'canceling'
    ? `Cancellation scheduled for ${formatDate(user?.subscription?.current_period_end)}`
    : billingStatus === 'active'
      ? `Renews on ${formatDate(user?.subscription?.current_period_end)}`
      : ''

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
          {user && (
            <>
              <Link to="/dashboard" className={styles.link}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/snippets" className={styles.link}>
                <Library size={18} />
                <span>My Snippets</span>
              </Link>
            </>
          )}
          <Link to="/compiler" className={styles.link}>
            <Code size={18} />
            <span>Compiler</span>
          </Link>
          <Link to="/gallery" className={styles.link}>
            <Globe size={18} />
            <span>Gallery</span>
          </Link>
          <Link to="/collaborate" className={styles.link}>
            <Users size={18} />
            <span>Join Fusion</span>
          </Link>
        </div>

        <div className={styles.auth}>
          {isSupported && user && (
            <Tooltip content={
              !voiceEnabled
                ? 'Voice control is disabled in settings'
                : isListening
                  ? 'Stop Voice Control'
                  : 'Start Voice Control (CoderSpeak)'
            }>
              <button 
                onClick={toggleListening}
                className={`${styles.micBtn} ${isListening ? styles.micActive : ''} ${!voiceEnabled ? styles.micDisabled : ''}`}
                disabled={!voiceEnabled}
                title="Global Voice Control"
              >
                {isListening ? <Mic size={18} className={styles.micIconActive} /> : <MicOff size={18} />}
              </button>
            </Tooltip>
          )}

          <VoiceWaveform isActive={isListening} />

          {user ? (
            <div className={styles.userProfile}>
              {billingLabel && (
                <Tooltip content={billingTooltip}>
                  <Link to="/settings" className={`${styles.planPill} ${billingStatus === 'canceling' ? styles.planPillWarning : ''}`}>
                    {billingLabel}
                  </Link>
                </Tooltip>
              )}
              <Link to="/settings" className={styles.userBtn}>
                <div className={styles.userAvatar}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} />
                  ) : (
                    <div className={styles.avatarInitial}>{user.username[0].toUpperCase()}</div>
                  )}
                </div>
                <span className={styles.username}>{user.username}</span>
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

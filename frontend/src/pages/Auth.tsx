import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Sparkles, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react'
import styles from './Auth.module.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password, username)

    if (!error) {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} premium-glass`}>
        <div className={styles.authGrid}>
          <div className={styles.infoPanel}>
            <div className={styles.brandMark}>
              <Sparkles className={styles.brandIcon} />
              <span className={styles.brandText}>CodeForge</span>
            </div>
            <h2>Build, run, and ship in one focused workspace.</h2>
            <p>Sign in to keep your snippets synced, settings saved, and history always within reach.</p>
            <ul className={styles.perks}>
              <li>Instant compile with live output</li>
              <li>Private snippets and share links</li>
              <li>Session restore and autosave</li>
            </ul>
          </div>

          <div className={styles.formPanel}>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <Sparkles className={styles.headerIcon} />
                <span className={styles.headerLabel}>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              </div>
              <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
              <p>{isLogin ? 'Continue your coding journey' : 'Join a community of 10,000+ developers'}</p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>
              {!isLogin && (
                <div className={styles.inputGroup}>
                  <UserIcon className={styles.icon} size={18} />
                  <input 
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                </div>
              )}
              <div className={styles.inputGroup}>
                <Mail className={styles.icon} size={18} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <Lock className={styles.icon} size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? <Loader2 className={styles.spin} /> : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <p className={styles.toggle}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

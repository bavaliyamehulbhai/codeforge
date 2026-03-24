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
        <header className={`${styles.header} premium-glass`}>
          <Sparkles className={styles.logo} />
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

        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        <div className={styles.socialGrid}>
          <button className={styles.socialBtn}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
            <span>Google</span>
          </button>
          <button className={styles.socialBtn}>
            <img src="https://www.svgrepo.com/show/475654/github-color.svg" alt="GitHub" style={{ filter: 'invert(1)' }} />
            <span>GitHub</span>
          </button>
        </div>

        <p className={styles.toggle}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}

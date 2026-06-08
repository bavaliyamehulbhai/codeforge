import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import axios from 'axios'
import { User, Mail, Lock, Save, Loader2, ShieldCheck } from 'lucide-react'
import styles from './Settings.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Account Settings | CodeForge'
    return () => { document.title = 'CodeForge' }
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.patch(`${API_URL}/auth/profile`, {
        username, email, password: password || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUser(data.user)
      toast('Profile updated successfully!', 'success')
      setPassword('')
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.emptyAuth}>
        <ShieldCheck className={styles.emptyIcon} size={52} />
        <h2>Sign in to manage your account</h2>
        <p>Update your profile, security settings, and preferences.</p>
        <div className={styles.emptyActions}>
          <a href="/auth" className={styles.primaryAction}>Sign In</a>
          <a href="/compiler" className={styles.secondaryAction}>Go to Compiler</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <ShieldCheck className={styles.icon} size={48} />
          <h1>Account Settings</h1>
          <p>Manage your profile and security preferences</p>
        </div>

        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><User size={14} /> Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>

          <div className={styles.inputGroup}>
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>

          <div className={styles.inputGroup}>
            <label><Lock size={14} /> New Password (leave blank to keep current)</label>
            <input 
              type="password" 
              placeholder="Min 8 characters"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? <Loader2 className={styles.spin} /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}

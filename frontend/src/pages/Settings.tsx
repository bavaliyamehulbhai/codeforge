import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import axios from 'axios'
import { 
  User, Mail, Lock, Save, Loader2, ShieldCheck, 
  Palette, Monitor, Layout, Globe, Github, Twitter, 
  Linkedin, AlignLeft, Type, MousePointer2, Mic 
} from 'lucide-react'
import styles from './Settings.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Tab = 'account' | 'profile' | 'preferences'

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(false)

  // Account State
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')

  // Profile State
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [github, setGithub] = useState(user?.social_links?.github || '')
  const [twitter, setTwitter] = useState(user?.social_links?.twitter || '')
  const [linkedin, setLinkedin] = useState(user?.social_links?.linkedin || '')

  const avatarPresets = [
    'Felix', 'Aneka', 'Milo', 'Max', 'Luna', 'Jasper', 'Bella', 'Oliver'
  ].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`)

  // Preferences State
  const [theme, setTheme] = useState(user?.preferences?.theme || 'vs-dark')
  const [fontSize, setFontSize] = useState(user?.preferences?.fontSize || 14)
  const [autoSave, setAutoSave] = useState(user?.preferences?.autoSave ?? true)
  const [tabSize, setTabSize] = useState(user?.preferences?.tabSize || 2)
  const [voiceEnabled, setVoiceEnabled] = useState(user?.preferences?.voiceEnabled ?? true)

  useEffect(() => {
    document.title = 'Settings | CodeForge'
    return () => { document.title = 'CodeForge' }
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('codeforge_token')
      const payload: any = {
        username,
        email,
        password: password || undefined,
        avatar_url: avatarUrl,
        bio,
        website,
        social_links: { github, twitter, linkedin },
        preferences: { theme, fontSize, autoSave, tabSize, voiceEnabled }
      }

      const { data } = await axios.patch(`${API_URL}/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUser(data.user)
      toast('Settings updated successfully!', 'success')
      setPassword('')
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className={styles.error}>Please sign in to access settings.</div>

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <ShieldCheck className={styles.icon} size={48} />
          <h1>Settings</h1>
          <p>Customize your CodeForge experience</p>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'account' ? styles.active : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <User size={16} /> Account
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Layout size={16} /> Profile
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Palette size={16} /> Preferences
          </button>
        </div>

        <form onSubmit={handleUpdate} className={styles.form}>
          {activeTab === 'account' && (
            <div className={styles.tabContent}>
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
                <label><Lock size={14} /> New Password</label>
                <input 
                  type="password" 
                  placeholder="Leave blank to keep current"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <div className={styles.inputGroup}>
                <label><User size={14} /> Profile Avatar</label>
                <div className={styles.avatarGrid}>
                  {avatarPresets.map(url => (
                    <button 
                      key={url}
                      type="button"
                      className={`${styles.avatarOption} ${avatarUrl === url ? styles.selectedAvatar : ''}`}
                      onClick={() => setAvatarUrl(url)}
                    >
                      <img src={url} alt="Avatar Option" />
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label><AlignLeft size={14} /> Bio</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Tell us about yourself..."
                  className={styles.textarea}
                  maxLength={200}
                />
                <span className={styles.charCount}>{bio.length}/200</span>
              </div>

              <div className={styles.inputGroup}>
                <label><Globe size={14} /> Website</label>
                <input 
                  type="url" 
                  value={website} 
                  onChange={e => setWebsite(e.target.value)} 
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className={styles.socialGrid}>
                <div className={styles.inputGroup}>
                  <label><Github size={14} /> GitHub</label>
                  <input 
                    type="text" 
                    value={github} 
                    onChange={e => setGithub(e.target.value)} 
                    placeholder="username"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label><Twitter size={14} /> Twitter</label>
                  <input 
                    type="text" 
                    value={twitter} 
                    onChange={e => setTwitter(e.target.value)} 
                    placeholder="username"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label><Linkedin size={14} /> LinkedIn</label>
                  <input 
                    type="text" 
                    value={linkedin} 
                    onChange={e => setLinkedin(e.target.value)} 
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.tabContent}>
              <div className={styles.inputGroup}>
                <label><Monitor size={14} /> Editor Theme</label>
                <select value={theme} onChange={e => setTheme(e.target.value)} className={styles.select}>
                  <option value="vs-dark">Visual Studio Dark</option>
                  <option value="light">Visual Studio Light</option>
                  <option value="hc-black">High Contrast Black</option>
                  <option value="oceanic-next">Oceanic Next</option>
                  <option value="monokai">Monokai</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label><Mic size={14} /> Voice Control (CoderSpeak)</label>
                <div className={styles.toggleRow}>
                  <span>Enable voice commands and CoderSpeak</span>
                  <button 
                    className={`${styles.toggleBtn} ${voiceEnabled ? styles.active : ''}`}
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>

              <div className={styles.preferenceGrid}>
                <div className={styles.inputGroup}>
                  <label><Type size={14} /> Font Size</label>
                  <input 
                    type="number" 
                    value={fontSize} 
                    onChange={e => setFontSize(Number(e.target.value))} 
                    min={10} max={32}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label><MousePointer2 size={14} /> Tab Size</label>
                  <input 
                    type="number" 
                    value={tabSize} 
                    onChange={e => setTabSize(Number(e.target.value))} 
                    min={2} max={8}
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="autoSave"
                  checked={autoSave} 
                  onChange={e => setAutoSave(e.target.checked)} 
                />
                <label htmlFor="autoSave">Enable Auto-Save</label>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? <Loader2 className={styles.spin} /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}

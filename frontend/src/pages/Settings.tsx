import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  User, Mail, Lock, Save, Loader2, ShieldCheck, 
  Palette, Monitor, Layout, Globe, Github, Twitter, 
  Linkedin, AlignLeft, Type, MousePointer2, Mic 
} from 'lucide-react'
import Tooltip from '@/components/Tooltip'
import styles from './Settings.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Tab = 'account' | 'profile' | 'preferences' | 'billing'

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(false)
  const [billingStatus, setBillingStatus] = useState<'success' | 'cancel' | null>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

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
  const [billingLoading, setBillingLoading] = useState(false)
  const [upcomingAmount, setUpcomingAmount] = useState<number | null>(null)
  const [upcomingCurrency, setUpcomingCurrency] = useState('usd')
  const [upcomingDate, setUpcomingDate] = useState<string | null>(null)
  const [upcomingError, setUpcomingError] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (user?.plan && user.plan !== 'free') return user.plan
    return 'pro'
  })
  const currentPlan = user?.plan || 'free'
  const isCurrentPlanSelected = currentPlan === selectedPlan
  const [planOptions, setPlanOptions] = useState<Array<{ id: string; name: string; price: string; features: string[]; limits?: { compiler_runs: number; voice_minutes: number } }>>([])
  const [planPriceLabel, setPlanPriceLabel] = useState<string | null>(null)
  const [planLoadError, setPlanLoadError] = useState(false)
  const canCheckout = planOptions.length > 0
  const [billingConfig, setBillingConfig] = useState<{
    configured: boolean
    missing_keys: string[]
    missing_price_ids: string[]
  } | null>(null)
  const [showPlanCompare, setShowPlanCompare] = useState(false)
  const [recommendedRef, setRecommendedRef] = useState<HTMLDivElement | null>(null)
  const billingConfigured = billingConfig?.configured !== false
  const missingKeysSummary = billingConfig?.missing_keys?.length
    ? billingConfig.missing_keys.join(', ')
    : ''

  useEffect(() => {
    document.title = 'Settings | CodeForge'
    return () => { document.title = 'CodeForge' }
  }, [])

  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatAmount = (amount: number | null, currency: string) => {
    if (amount === null) return 'N/A'
    const value = amount / 100
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value)
  }

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlanLoadError(false)
        const { data } = await axios.get(`${API_URL}/billing/plans`)
        if (!data?.plans) return

        const paidPlans = data.plans.filter((plan: any) => plan.id !== 'free')
        const nextPlans = paidPlans.map((plan: any) => {
          const runs = plan.limits?.compiler_runs ?? 0
          const voice = plan.limits?.voice_minutes ?? 0
          return {
            id: plan.id,
            name: plan.id.charAt(0).toUpperCase() + plan.id.slice(1),
            price: plan.price_label || 'Custom',
            features: [`${runs} runs/day`, `${voice} voice minutes`],
            limits: plan.limits
          }
        })

        if (nextPlans.length) setPlanOptions(nextPlans)
        const current = data.plans.find((plan: any) => plan.id === currentPlan)
        setPlanPriceLabel(current?.price_label || null)
      } catch (err) {
        setPlanLoadError(true)
        setPlanOptions([])
        setPlanPriceLabel(null)
      }
    }

    loadPlans()
  }, [])

  useEffect(() => {
    const loadBillingConfig = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/billing/status`)
        if (data) setBillingConfig(data)
      } catch (err) {
        setBillingConfig(null)
      }
    }

    loadBillingConfig()
  }, [])

  useEffect(() => {
    if (user?.plan && user.plan !== 'free') {
      setSelectedPlan(user.plan)
    }
  }, [user?.plan])

  useEffect(() => {
    if (planOptions.length && !planOptions.find((plan) => plan.id === selectedPlan)) {
      setSelectedPlan(planOptions[0].id)
    }
  }, [planOptions, selectedPlan])

  const recommendedPlanId = (() => {
    const usageRuns = user?.usage?.compiler_runs ?? 0
    const usageVoice = user?.usage?.voice_minutes ?? 0
    if (!usageRuns && !usageVoice) return null
    const candidates = planOptions
      .filter((plan) => plan.limits)
      .sort((a, b) => (a.limits?.compiler_runs ?? 0) - (b.limits?.compiler_runs ?? 0))
    const match = candidates.find((plan) => {
      const limits = plan.limits
      if (!limits) return false
      return limits.compiler_runs >= usageRuns && limits.voice_minutes >= usageVoice
    })
    return match?.id || null
  })()
  const recommendationNote = (() => {
    if (!recommendedPlanId) return ''
    const usageRuns = user?.usage?.compiler_runs ?? 0
    const usageVoice = user?.usage?.voice_minutes ?? 0
    return `Based on usage: ${usageRuns} runs and ${usageVoice} voice minutes.`
  })()
  const usageRuns = user?.usage?.compiler_runs ?? 0
  const usageVoice = user?.usage?.voice_minutes ?? 0
  const getUsageRatio = (plan: { limits?: { compiler_runs: number; voice_minutes: number } }) => {
    if (!plan.limits) return null
    const runLimit = plan.limits.compiler_runs || 0
    const voiceLimit = plan.limits.voice_minutes || 0
    const runRatio = runLimit > 0 ? usageRuns / runLimit : 0
    const voiceRatio = voiceLimit > 0 ? usageVoice / voiceLimit : 0
    return Math.max(runRatio, voiceRatio)
  }
  const renderUsageMeter = (plan: { limits?: { compiler_runs: number; voice_minutes: number } }) => {
    const ratio = getUsageRatio(plan)
    if (ratio === null) return null
    const clamped = Math.min(ratio, 1)
    const percent = Math.round(clamped * 100)
    const label = ratio > 1 ? 'Usage exceeds plan limits' : `Usage fit: ${percent}%`
    return (
      <div className={styles.planMeter}>
        <div className={styles.planMeterBar}>
          <div
            className={`${styles.planMeterFill} ${ratio > 1 ? styles.planMeterOver : ''}`}
            style={{ width: `${clamped * 100}%` }}
          />
        </div>
        <span className={styles.planMeterLabel}>{label}</span>
      </div>
    )
  }

  useEffect(() => {
    if (activeTab !== 'billing') return
    const loadUpcoming = async () => {
      try {
        setUpcomingError(false)
        const token = localStorage.getItem('codeforge_token')
        const { data } = await axios.get(`${API_URL}/billing/upcoming`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (data?.amount_due !== undefined) {
          setUpcomingAmount(data.amount_due)
          setUpcomingCurrency(data.currency || 'usd')
          setUpcomingDate(data.next_payment_attempt || data.period_end || null)
        } else {
          setUpcomingAmount(null)
          setUpcomingDate(null)
        }
      } catch (err) {
        setUpcomingError(true)
        setUpcomingAmount(null)
        setUpcomingDate(null)
      }
    }

    loadUpcoming()
  }, [activeTab])

  useEffect(() => {
    if (!showPlanCompare) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPlanCompare(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showPlanCompare])

  useEffect(() => {
    if (!showPlanCompare || !recommendedRef) return
    recommendedRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [showPlanCompare, recommendedRef])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('codeforge_token')
    if (!token) return
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(data.user)
    } catch (err) {
      // Ignore refresh errors and let normal session checks handle it.
    }
  }, [setUser])

  useEffect(() => {
    const billing = searchParams.get('billing')
    if (!billing) return

    setActiveTab('billing')
    if (billing === 'success') {
      setBillingStatus('success')
      toast('Subscription activated. Syncing your plan...', 'success')
      refreshUser()
    } else if (billing === 'cancel') {
      setBillingStatus('cancel')
      toast('Checkout canceled. No changes made.', 'info')
    }

    navigate('/settings', { replace: true })
  }, [navigate, refreshUser, searchParams, toast])

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

  const handleCheckout = async () => {
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    try {
      setBillingLoading(true)
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.post(`${API_URL}/billing/checkout`, { plan: selectedPlan }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (data?.url) window.location.href = data.url
      else toast('Billing not configured yet', 'info')
    } catch (err: any) {
      toast(err.response?.data?.error || 'Billing not configured', 'error')
    } finally {
      setBillingLoading(false)
    }
  }

  const handlePortal = async () => {
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    try {
      setBillingLoading(true)
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.get(`${API_URL}/billing/portal`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (data?.url) window.location.href = data.url
      else toast('Billing portal not configured', 'info')
    } catch (err: any) {
      toast(err.response?.data?.error || 'Billing portal not configured', 'error')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    const confirmCancel = window.confirm('Cancel your subscription at the end of the billing period?')
    if (!confirmCancel) return

    try {
      setBillingLoading(true)
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.post(`${API_URL}/billing/cancel`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (data?.cancel_at_period_end) {
        toast('Subscription will cancel at period end.', 'info')
      } else {
        toast('Subscription updated.', 'info')
      }
      refreshUser()
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to cancel subscription', 'error')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleResume = async () => {
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    try {
      setBillingLoading(true)
      const token = localStorage.getItem('codeforge_token')
      const { data } = await axios.post(`${API_URL}/billing/resume`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (data?.cancel_at_period_end === false) {
        toast('Subscription resumed.', 'success')
      } else {
        toast('Subscription updated.', 'info')
      }
      refreshUser()
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to resume subscription', 'error')
    } finally {
      setBillingLoading(false)
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
          {user && (
            <div className={styles.headerBadges}>
              <span className={styles.headerBadge}>{(user.plan || 'free').toUpperCase()}</span>
              <span className={styles.headerBadgeMuted}>{user.subscription?.status || 'inactive'}</span>
              {user.subscription?.cancel_at_period_end && (
                <span className={styles.headerBadgeWarning}>Ending Soon</span>
              )}
            </div>
          )}
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
          <button 
            className={`${styles.tabBtn} ${activeTab === 'billing' ? styles.active : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <ShieldCheck size={16} /> Billing
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

          {activeTab === 'billing' && (
            <div className={styles.tabContent}>
              <div className={styles.billingCard}>
                {billingConfig?.configured === false && (
                  <div className={styles.billingAlertWarning}>
                    Billing is not configured. Missing: {missingKeysSummary || 'Stripe keys'}.
                  </div>
                )}
                {planLoadError && (
                  <div className={styles.billingAlertWarning}>
                    Billing is not configured yet. Upgrade actions may be unavailable.
                  </div>
                )}
                {billingStatus && (
                  <div className={`${styles.billingAlert} ${billingStatus === 'success' ? styles.billingAlertSuccess : styles.billingAlertCancel}`}>
                    {billingStatus === 'success'
                      ? 'Thanks for upgrading! Your plan will refresh shortly.'
                      : 'Checkout canceled. You can try again anytime.'}
                  </div>
                )}
                {planOptions.length > 0 ? (
                  <div className={styles.planGrid}>
                    {planOptions.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        className={`${styles.planCard} ${selectedPlan === plan.id ? styles.planCardActive : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                        disabled={billingLoading}
                      >
                        <div className={styles.planHeader}>
                          <span className={styles.planName}>{plan.name}</span>
                          <span className={styles.planPrice}>{plan.price}</span>
                        </div>
                        {recommendedPlanId === plan.id && (
                          <Tooltip content={recommendationNote}>
                            <span className={styles.planBadgeRecommended}>Recommended</span>
                          </Tooltip>
                        )}
                        <ul className={styles.planFeatures}>
                          {plan.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                        {renderUsageMeter(plan)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.planEmpty}>
                    {planLoadError ? 'Plan details are unavailable until billing is configured.' : 'Loading plan details...'}
                  </p>
                )}
                <div className={styles.billingRow}>
                  <span>Current Plan</span>
                  <div className={styles.billingInline}>
                    <strong>{user.plan?.toUpperCase() || 'FREE'}</strong>
                    {planPriceLabel && <span className={styles.billingPrice}>{planPriceLabel}</span>}
                  </div>
                </div>
                <div className={styles.billingRow}>
                  <span>Status</span>
                  <strong>{user.subscription?.status || 'inactive'}</strong>
                </div>
                <div className={styles.billingRow}>
                  <span>Renews</span>
                  <strong>{formatDate(user.subscription?.current_period_end)}</strong>
                </div>
                <div className={styles.billingRow}>
                  <span>Next charge</span>
                  <strong>{formatAmount(upcomingAmount, upcomingCurrency)}</strong>
                </div>
                <div className={styles.billingRow}>
                  <span>Charge date</span>
                  <strong>{formatDate(upcomingDate)}</strong>
                </div>
                {upcomingError && (
                  <p className={styles.billingHint}>Upcoming invoice is unavailable until billing is configured.</p>
                )}
                {user.subscription?.cancel_at_period_end && (
                  <p className={styles.billingHint}>Cancellation scheduled for period end.</p>
                )}
                {isCurrentPlanSelected && currentPlan !== 'free' && (
                  <p className={styles.billingHint}>You are already on this plan.</p>
                )}
                <div className={styles.billingActions}>
                  <button
                    type="button"
                    className={styles.billingPrimary}
                    onClick={handleCheckout}
                    disabled={billingLoading || !canCheckout || !billingConfigured || (isCurrentPlanSelected && currentPlan !== 'free')}
                  >
                    {isCurrentPlanSelected && currentPlan !== 'free' ? 'Current Plan' : 'Upgrade Plan'}
                  </button>
                  <button
                    type="button"
                    className={styles.billingSecondary}
                    onClick={() => setShowPlanCompare(true)}
                    disabled={!planOptions.length}
                  >
                    Compare Plans
                  </button>
                  <button type="button" className={styles.billingSecondary} onClick={handlePortal} disabled={billingLoading || !billingConfigured}>
                    Manage Billing
                  </button>
                  {currentPlan !== 'free' && !user.subscription?.cancel_at_period_end && (
                    <button type="button" className={styles.billingDanger} onClick={handleCancel} disabled={billingLoading || !billingConfigured}>
                      Cancel Subscription
                    </button>
                  )}
                  {currentPlan !== 'free' && user.subscription?.cancel_at_period_end && (
                    <button type="button" className={styles.billingSecondary} onClick={handleResume} disabled={billingLoading || !billingConfigured}>
                      Resume Subscription
                    </button>
                  )}
                </div>
                {billingConfig?.configured === false && (
                  <p className={styles.billingNote}>Set the missing Stripe environment variables on the backend to enable billing.</p>
                )}
              </div>
              {showPlanCompare && (
                <div className={styles.modalOverlay} onClick={() => setShowPlanCompare(false)}>
                  <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <div>
                        <h3>Compare Plans</h3>
                        <p>Choose the plan that fits your workflow.</p>
                      </div>
                      <button type="button" className={styles.modalClose} onClick={() => setShowPlanCompare(false)}>×</button>
                    </div>
                    {planOptions.length > 0 ? (
                      <div className={styles.modalGrid}>
                        {planOptions.map((plan) => (
                          <div
                            key={plan.id}
                            className={styles.modalCard}
                            ref={plan.id === recommendedPlanId ? setRecommendedRef : undefined}
                          >
                            <div className={styles.modalPlanHeader}>
                              <span>{plan.name}</span>
                              <strong>{plan.price}</strong>
                            </div>
                            {plan.id === currentPlan && (
                              <span className={styles.modalBadge}>Current</span>
                            )}
                            {recommendedPlanId === plan.id && plan.id !== currentPlan && (
                              <Tooltip content={recommendationNote}>
                                <span className={styles.modalBadgeRecommended}>Recommended</span>
                              </Tooltip>
                            )}
                            <ul>
                              {plan.features.map((feature) => (
                                <li key={feature}>{feature}</li>
                              ))}
                            </ul>
                            {renderUsageMeter(plan)}
                            <button
                              type="button"
                              className={styles.modalSelect}
                              onClick={() => {
                                setSelectedPlan(plan.id)
                                if (plan.id === currentPlan) return
                                const confirmUpgrade = window.confirm(`Proceed to checkout for the ${plan.name} plan?`)
                                if (!confirmUpgrade) return
                                setShowPlanCompare(false)
                                handleCheckout()
                              }}
                              disabled={billingLoading || plan.id === currentPlan}
                            >
                              {plan.id === currentPlan ? 'Current plan' : 'Select & upgrade'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.planEmpty}>Plan details are unavailable.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || activeTab === 'billing'} className={styles.submitBtn}>
            {loading ? <Loader2 className={styles.spin} /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}

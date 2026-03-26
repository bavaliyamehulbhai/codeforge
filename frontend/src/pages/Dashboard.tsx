import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { 
  Code2, History, TrendingUp, Layers, 
  Github, Twitter, Globe, Edit3, 
  Plus, PlayCircle, Clock, Flame, Target, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Tooltip from '@/components/Tooltip'
import styles from './Dashboard.module.css'
import axios from 'axios'
import { UsageLimits } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalSnippets: 0,
    totalLines: 0,
    mostUsedLanguage: 'None',
    avgComplexity: 0,
    languageBreakdown: {} as Record<string, number>
  })
  const [recentSnippets, setRecentSnippets] = useState<any[]>([])
  const [heatmapDays, setHeatmapDays] = useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<'free' | 'pro' | 'team' | 'enterprise'>('free')
  const [usage, setUsage] = useState({ compiler_runs: 0, voice_minutes: 0 })
  const [limits, setLimits] = useState<UsageLimits>({ compiler_runs: 0, voice_minutes: 0 })
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [inviteWorkspace, setInviteWorkspace] = useState<any | null>(null)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isInviting, setIsInviting] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [workspaceQuery, setWorkspaceQuery] = useState('')
  const [upcomingAmount, setUpcomingAmount] = useState<number | null>(null)
  const [upcomingCurrency, setUpcomingCurrency] = useState('usd')
  const [upcomingDate, setUpcomingDate] = useState<string | null>(null)
  const [upcomingError, setUpcomingError] = useState(false)
  const [planMeta, setPlanMeta] = useState<Record<string, { limits: UsageLimits; price_label?: string }>>({})
  const [billingConfig, setBillingConfig] = useState<{
    configured: boolean
    missing_keys: string[]
    missing_price_ids: string[]
  } | null>(null)
  const billingConfigured = billingConfig?.configured !== false
  const missingKeysSummary = billingConfig?.missing_keys?.length
    ? billingConfig.missing_keys.join(', ')
    : ''

  useEffect(() => {
    document.title = 'Dashboard | CodeForge'
    fetchDashboardData()
    return () => { document.title = 'CodeForge' }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('codeforge_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const { data } = await axios.get(`${API_URL}/snippets/my-snippets`, {
        headers
      })

      const usageResponse = await axios.get(`${API_URL}/auth/usage`, { headers })
      const workspacesResponse = await axios.get(`${API_URL}/workspaces`, { headers })
      const upcomingResponse = await axios.get(`${API_URL}/billing/upcoming`, { headers }).catch(() => null)
      const plansResponse = await axios.get(`${API_URL}/billing/plans`).catch(() => null)
      const billingStatusResponse = await axios.get(`${API_URL}/billing/status`).catch(() => null)
      setPlan(usageResponse.data.plan || 'free')
      setUsage(usageResponse.data.usage || { compiler_runs: 0, voice_minutes: 0 })
      setLimits(usageResponse.data.limits || { compiler_runs: 0, voice_minutes: 0 })
      setWorkspaces(workspacesResponse.data || [])
      if (billingStatusResponse?.data) setBillingConfig(billingStatusResponse.data)
      if (plansResponse?.data?.plans) {
        const nextMeta: Record<string, { limits: UsageLimits; price_label?: string }> = {}
        plansResponse.data.plans.forEach((plan: any) => {
          if (plan?.id && plan?.limits) {
            nextMeta[plan.id] = { limits: plan.limits, price_label: plan.price_label }
          }
        })
        setPlanMeta(nextMeta)
      }
      if (upcomingResponse?.data?.amount_due !== undefined) {
        setUpcomingAmount(upcomingResponse.data.amount_due)
        setUpcomingCurrency(upcomingResponse.data.currency || 'usd')
        setUpcomingDate(upcomingResponse.data.next_payment_attempt || upcomingResponse.data.period_end || null)
        setUpcomingError(false)
      } else {
        setUpcomingAmount(null)
        setUpcomingDate(null)
        setUpcomingError(true)
      }
      
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

      const buildHeatmap = (items: any[]) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(today)
        start.setDate(start.getDate() - 55)

        const counts = new Map<string, number>()
        items.forEach((snippet: any) => {
          if (!snippet.updated_at) return
          const day = new Date(snippet.updated_at)
          if (Number.isNaN(day.getTime())) return
          day.setHours(0, 0, 0, 0)
          if (day < start || day > today) return
          const key = day.toISOString().slice(0, 10)
          counts.set(key, (counts.get(key) || 0) + 1)
        })

        const days: Array<{ date: string; count: number }> = []
        for (let i = 0; i < 56; i += 1) {
          const date = new Date(start)
          date.setDate(start.getDate() + i)
          const key = date.toISOString().slice(0, 10)
          days.push({ date: key, count: counts.get(key) || 0 })
        }
        return days
      }

      setHeatmapDays(buildHeatmap(snippets))
    } catch (err) {
      console.error('Failed to fetch dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    if (!user) return
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsResuming(true)
    try {
      await axios.post(`${API_URL}/billing/resume`, {}, { headers })
      toast('Subscription resumed.', 'success')
      await fetchDashboardData()
    } catch (err) {
      toast('Failed to resume subscription', 'error')
    } finally {
      setIsResuming(false)
    }
  }

  const handleCancel = async () => {
    if (!user) return
    if (!billingConfigured) {
      toast('Billing is not configured yet', 'info')
      return
    }
    const confirmCancel = window.confirm('Cancel your subscription at the end of the billing period?')
    if (!confirmCancel) return
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsCanceling(true)
    try {
      await axios.post(`${API_URL}/billing/cancel`, {}, { headers })
      toast('Cancellation scheduled for period end.', 'info')
      await fetchDashboardData()
    } catch (err) {
      toast('Failed to cancel subscription', 'error')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsCreatingWorkspace(true)
    try {
      const { data } = await axios.post(`${API_URL}/workspaces`, {
        name: newWorkspaceName.trim()
      }, { headers })
      setWorkspaces((prev) => [data, ...prev])
      setNewWorkspaceName('')
      setIsWorkspaceModalOpen(false)
      toast('Workspace created!', 'success')
    } catch (err) {
      toast('Failed to create workspace', 'error')
      console.error('Failed to create workspace', err)
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteWorkspace || !inviteUsername.trim()) return
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsInviting(true)
    try {
      const { data } = await axios.post(`${API_URL}/workspaces/${inviteWorkspace.id}/members`, {
        username: inviteUsername.trim(),
        role: inviteRole,
      }, { headers })
      setWorkspaces((prev) => prev.map(ws => ws.id === data.id ? data : ws))
      setInviteUsername('')
      setInviteRole('member')
      setInviteWorkspace(null)
      toast('Member invited!', 'success')
    } catch (err) {
      toast('Failed to invite member', 'error')
      console.error('Failed to invite member', err)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    const isSelf = memberId === user?.id
    const confirmText = isSelf
      ? 'Leave this workspace?'
      : 'Remove this member from the workspace?'
    if (!window.confirm(confirmText)) return
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsRemovingMember(true)
    try {
      const { data } = await axios.delete(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`, { headers })
      setWorkspaces((prev) => prev.map(ws => ws.id === data.id ? data : ws))
      if (inviteWorkspace?.id === data.id) {
        setInviteWorkspace(data)
      }
      toast('Member removed', 'success')
    } catch (err) {
      toast('Failed to remove member', 'error')
      console.error('Failed to remove member', err)
    } finally {
      setIsRemovingMember(false)
    }
  }

  const handleUpdateRole = async (workspaceId: string, memberId: string, role: string) => {
    if (!window.confirm(`Change role to ${role}?`)) return
    const token = localStorage.getItem('codeforge_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    setIsUpdatingRole(true)
    try {
      const { data } = await axios.patch(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`, { role }, { headers })
      setWorkspaces((prev) => prev.map(ws => ws.id === data.id ? data : ws))
      if (inviteWorkspace?.id === data.id) {
        setInviteWorkspace(data)
      }
      toast('Role updated', 'success')
    } catch (err) {
      toast('Failed to update role', 'error')
      console.error('Failed to update role', err)
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleCopyWorkspaceId = async (workspaceId: string) => {
    try {
      await navigator.clipboard.writeText(workspaceId)
      toast('Workspace ID copied', 'success')
    } catch (err) {
      toast('Failed to copy workspace ID', 'error')
    }
  }

  if (!user) return <div className={styles.error}>Please sign in to view your dashboard.</div>

  const streakMsg = user.streak_count > 0 
    ? `${user.streak_count} day streak! Keep it up!` 
    : "Start a coding session to begin your streak!"

  const runsLimit = limits.compiler_runs
  const runsUsed = usage.compiler_runs
  const runsUsageRatio = runsLimit > 0 ? runsUsed / runsLimit : 0
  const showRunsWarning = runsLimit > 0 && runsUsageRatio >= 0.8
  const voiceLimit = limits.voice_minutes
  const voiceUsed = usage.voice_minutes
  const voiceUsageRatio = voiceLimit > 0 ? voiceUsed / voiceLimit : 0
  const showVoiceWarning = voiceLimit > 0 && voiceUsageRatio >= 0.8
  const hasScheduledCancel = Boolean(user.subscription?.cancel_at_period_end)
  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const perkMap: Record<string, string[]> = {
    free: ['Community support', 'Limited runs'],
    pro: ['Private snippets', 'Priority queue'],
    team: ['Workspace roles', 'Team analytics'],
    enterprise: ['SAML SSO', 'Custom SLAs']
  }
  const planLimits = planMeta[plan]?.limits
  const perks = planLimits
    ? [`${planLimits.compiler_runs} runs/day`, `${planLimits.voice_minutes} voice minutes`]
    : (perkMap[plan] || perkMap.free)
  const planPrice = planMeta[plan]?.price_label
  const getUsageRatio = () => {
    if (!planLimits) return null
    const runLimit = planLimits.compiler_runs || 0
    const voiceLimit = planLimits.voice_minutes || 0
    const runRatio = runLimit > 0 ? runsUsed / runLimit : 0
    const voiceRatio = voiceLimit > 0 ? voiceUsed / voiceLimit : 0
    return Math.max(runRatio, voiceRatio)
  }
  const usageRatio = getUsageRatio()
  const usagePercent = usageRatio === null ? null : Math.min(usageRatio, 1)
  const usageDriver = (() => {
    if (!planLimits) return ''
    const runLimit = planLimits.compiler_runs || 0
    const voiceLimit = planLimits.voice_minutes || 0
    const runRatio = runLimit > 0 ? runsUsed / runLimit : 0
    const voiceRatio = voiceLimit > 0 ? voiceUsed / voiceLimit : 0
    return runRatio >= voiceRatio ? 'Runs' : 'Voice'
  })()
  const usageNote = planLimits
    ? `${usageDriver} is the limiting factor: ${runsUsed}/${planLimits.compiler_runs} runs, ${voiceUsed}/${planLimits.voice_minutes} voice minutes.`
    : ''
  const recommendedPlanId = (() => {
    const usageRuns = usage.compiler_runs
    const usageVoice = usage.voice_minutes
    const candidates = Object.entries(planMeta)
      .map(([id, meta]) => ({ id, limits: meta.limits }))
      .filter((entry) => entry.limits)
      .sort((a, b) => (a.limits?.compiler_runs ?? 0) - (b.limits?.compiler_runs ?? 0))
    const match = candidates.find((entry) => {
      const limits = entry.limits
      if (!limits) return false
      return limits.compiler_runs >= usageRuns && limits.voice_minutes >= usageVoice
    })
    return match?.id || null
  })()
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name?.toLowerCase().includes(workspaceQuery.trim().toLowerCase())
  )

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
              {user.plan && user.plan !== 'free' && (
                <span className={styles.planBadge}>{user.plan.toUpperCase()}</span>
              )}
              <span className={styles.statusBadge}>{user.subscription?.status || 'inactive'}</span>
              {user.subscription?.cancel_at_period_end && (
                <span className={styles.statusBadgeWarning}>Ending Soon</span>
              )}
              {user.streak_count > 0 && (
                <div className={styles.streakBadge} title={streakMsg}>
                  <Flame size={14} /> {user.streak_count}
                </div>
              )}
            </div>
            <p className={styles.bio}>{user.bio || 'Your bio will appear here after you update it in settings.'}</p>
            <div className={styles.lastActive}>Last active {formatDateTime(user.last_active)}</div>
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
          <button className={styles.actionBtnAlt} onClick={() => setIsWorkspaceModalOpen(true)}>
            <Plus size={18} /> New Workspace
          </button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Code2 className={styles.statIcon} style={{ color: '#60a5fa' }} />
          <h3>Total Snippets</h3>
          <p className={styles.statValue}>{stats.totalSnippets}</p>
        </div>
        <div className={styles.statCard}>
          <TrendingUp className={styles.statIcon} style={{ color: '#22c55e' }} />
          <h3>Plan</h3>
          <p className={styles.statValue}>{plan.toUpperCase()}</p>
        </div>
        <div className={styles.billingCard}>
          <div className={styles.billingHeader}>
            <TrendingUp className={styles.statIcon} style={{ color: '#34d399' }} />
            <div>
              <h3>Billing Summary</h3>
              <p className={styles.billingTitle}>{plan.toUpperCase()}</p>
              {planPrice && <span className={styles.billingPrice}>{planPrice}</span>}
            </div>
            {recommendedPlanId && recommendedPlanId !== plan && (
              <Tooltip content="Recommended based on current usage">
                <span className={styles.billingBadgeRecommended}>Recommended</span>
              </Tooltip>
            )}
          </div>
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Status</span>
            <span className={styles.billingValue}>{user.subscription?.status || 'inactive'}</span>
          </div>
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Renews</span>
            <span className={styles.billingValue}>{formatDate(user.subscription?.current_period_end)}</span>
          </div>
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Next charge</span>
            <span className={styles.billingValue}>{formatAmount(upcomingAmount, upcomingCurrency)}</span>
          </div>
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Charge date</span>
            <span className={styles.billingValue}>{formatDate(upcomingDate)}</span>
          </div>
          {upcomingError && (
            <p className={styles.billingHint}>Upcoming invoice is unavailable until billing is configured.</p>
          )}
          {billingConfig?.configured === false && (
            <p className={styles.billingHint}>Billing is not configured. Missing: {missingKeysSummary || 'Stripe keys'}.</p>
          )}
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Runs</span>
            <span className={styles.billingValue}>{usage.compiler_runs}/{limits.compiler_runs || '∞'}</span>
          </div>
          <div className={styles.billingRow}>
            <span className={styles.billingLabel}>Voice</span>
            <span className={styles.billingValue}>{usage.voice_minutes}/{limits.voice_minutes || '∞'}</span>
          </div>
          <div className={styles.billingPerks}>
            {perks.map((perk) => (
              <span key={perk} className={styles.billingPerk}>{perk}</span>
            ))}
          </div>
          {usagePercent !== null && (
            <Tooltip content={usageNote}>
              <div className={styles.billingMeter}>
                <div className={styles.billingMeterBar}>
                  <div
                    className={`${styles.billingMeterFill} ${usageRatio && usageRatio > 1 ? styles.billingMeterOver : usageRatio && usageRatio >= 0.8 ? styles.billingMeterWarn : ''}`}
                    style={{ width: `${usagePercent * 100}%` }}
                  />
                </div>
                <span className={styles.billingMeterLabel}>
                  {usageRatio && usageRatio > 1 ? 'Usage exceeds plan limits' : `Usage fit: ${Math.round(usagePercent * 100)}%`}
                </span>
              </div>
            </Tooltip>
          )}
          {user.subscription?.cancel_at_period_end ? (
            <button
              type="button"
              className={styles.billingLinkWarning}
              onClick={handleResume}
              disabled={isResuming || !billingConfigured}
            >
              {isResuming ? 'Resuming...' : 'Resume subscription'}
            </button>
          ) : (
            <Link to="/settings" className={styles.billingLink}>Manage billing</Link>
          )}
          {plan !== 'free' && !user.subscription?.cancel_at_period_end && (
            <button
              type="button"
              className={styles.billingLinkDanger}
              onClick={handleCancel}
              disabled={isCanceling || !billingConfigured}
            >
              {isCanceling ? 'Canceling...' : 'Cancel subscription'}
            </button>
          )}
          {plan === 'free' && (
            <Link to="/settings" className={styles.billingUpgrade}>Upgrade plan</Link>
          )}
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
        <div className={styles.statCard}>
          <Code2 className={styles.statIcon} style={{ color: '#38bdf8' }} />
          <h3>Runs Used</h3>
          <p className={styles.statValue}>
            {usage.compiler_runs}/{limits.compiler_runs || '∞'}
          </p>
        </div>
        <div className={styles.statCard}>
          <TrendingUp className={styles.statIcon} style={{ color: '#a855f7' }} />
          <h3>Voice Minutes</h3>
          <p className={styles.statValue}>
            {usage.voice_minutes}/{limits.voice_minutes || '∞'}
          </p>
        </div>
      </section>

      {hasScheduledCancel && (
        <div className={styles.cancelBanner}>
          <div>
            <strong>Cancellation scheduled:</strong> Access ends on {formatDate(user.subscription?.current_period_end)}.
          </div>
          <Link to="/settings" className={styles.cancelCta}>Manage billing</Link>
        </div>
      )}

      {showRunsWarning && (
        <div className={styles.quotaBanner}>
          <div>
            <strong>Usage alert:</strong> You have used {runsUsed} of {runsLimit} compiler runs.
          </div>
          <Link to="/settings" className={styles.quotaCta}>Upgrade plan</Link>
        </div>
      )}

      {showVoiceWarning && (
        <div className={styles.quotaBanner}>
          <div>
            <strong>Usage alert:</strong> You have used {voiceUsed} of {voiceLimit} voice minutes.
          </div>
          <Link to="/settings" className={styles.quotaCta}>Upgrade plan</Link>
        </div>
      )}

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
                <Link
                  to="/compiler"
                  state={{ snippet }}
                  key={snippet.id}
                  className={styles.snippetItem}
                >
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
               {(() => {
                 const days = heatmapDays.length
                   ? heatmapDays
                   : Array.from({ length: 56 }).map((_, index) => ({ date: `Day ${index + 1}`, count: 0 }))
                 const maxCount = Math.max(...days.map((d) => d.count), 1)

                 return days.map((day) => {
                   const intensity = day.count / maxCount
                 const opacity = day.count === 0 ? 0.12 : 0.25 + intensity * 0.75
                 return (
                   <div
                     key={day.date}
                     className={styles.heatmapCell}
                     title={`${day.count} snippets on ${day.date}`}
                     style={{
                       opacity,
                       backgroundColor: 'var(--accent)',
                       borderRadius: '2px'
                     }}
                   />
                 )
                 })
               })()}
             </div>
             <p className={styles.heatmapLabel}>Your coding activity over the last 8 weeks</p>
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>
            <h2><Target size={20} /> Workspaces</h2>
            <input
              className={styles.workspaceSearch}
              value={workspaceQuery}
              onChange={(event) => setWorkspaceQuery(event.target.value)}
              placeholder="Search workspaces"
            />
          </div>
          <div className={styles.workspaceList}>
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace) => {
                const member = workspace.members?.find((m: any) => m.user_id === user.id)
                return (
                <div key={workspace.id} className={styles.workspaceCard}>
                  <div className={styles.workspaceTitle}>{workspace.name}</div>
                  <div className={styles.workspaceMetaRow}>
                    <span className={styles.workspaceMeta}>{workspace.members.length} members</span>
                    <span className={styles.workspaceMeta}>Updated {new Date(workspace.updated_at).toLocaleDateString()}</span>
                  </div>
                  {member?.role && <span className={styles.workspaceRole}>{member.role}</span>}
                  <div className={styles.workspaceActions}>
                    <Link
                      to={`/snippets?workspace_id=${workspace.id}`}
                      className={styles.workspaceOpen}
                    >
                      Open
                    </Link>
                    <Link
                      to={`/compiler?workspace_id=${workspace.id}`}
                      className={styles.workspaceCode}
                    >
                      Code
                    </Link>
                    <button
                      type="button"
                      className={styles.workspaceCopy}
                      onClick={() => handleCopyWorkspaceId(workspace.id)}
                    >
                      Copy ID
                    </button>
                    <button
                      className={`${styles.workspaceInvite} ${member?.role === 'admin' || member?.role === 'owner' ? '' : styles.workspaceInviteDisabled}`}
                      onClick={() => setInviteWorkspace(workspace)}
                      disabled={!(member?.role === 'admin' || member?.role === 'owner')}
                    >
                      Invite
                    </button>
                  </div>
                </div>
                )
              })
            ) : (
              <p className={styles.emptyText}>No workspaces found.</p>
            )}
          </div>
        </div>
      </main>

      {isWorkspaceModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsWorkspaceModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Workspace</h3>
              <button className={styles.modalClose} onClick={() => setIsWorkspaceModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Workspace name</label>
              <input
                className={styles.modalInput}
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Team Alpha"
                maxLength={50}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalSecondary} onClick={() => setIsWorkspaceModalOpen(false)}>Cancel</button>
              <button className={styles.modalPrimary} onClick={handleCreateWorkspace} disabled={isCreatingWorkspace}>
                {isCreatingWorkspace ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteWorkspace && (
        <div className={styles.modalOverlay} onClick={() => setInviteWorkspace(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Invite Member</h3>
              <button className={styles.modalClose} onClick={() => setInviteWorkspace(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>Username</label>
              <input
                className={styles.modalInput}
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="username"
              />
              <label className={styles.modalLabel}>Role</label>
              <select
                className={styles.modalInput}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>

              <div className={styles.memberList}>
                <div className={styles.memberListHeader}>Members</div>
                {inviteWorkspace.members?.map((member: any) => {
                  const isSelf = member.user_id === user.id
                  const canRemove = member.role !== 'owner' && (isSelf || member.role !== 'owner')
                  return (
                    <div key={member.user_id} className={styles.memberRow}>
                      <div className={styles.memberIdentity}>
                        <div className={styles.memberAvatar}>
                          {member.user?.avatar_url ? (
                            <img src={member.user.avatar_url} alt={member.user?.username || 'Member'} />
                          ) : (
                            <span>{(member.user?.username || member.user_id)[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.memberMeta}>
                          <span className={styles.memberName}>{member.user?.username || member.user_id}</span>
                          {isSelf && <span className={styles.memberSelf}>You</span>}
                        </div>
                      </div>
                      {member.role === 'owner' ? (
                        <span className={styles.memberRole}>owner</span>
                      ) : (
                        <select
                          className={styles.memberRoleSelect}
                          value={member.role}
                          disabled={isUpdatingRole}
                          onChange={(e) => handleUpdateRole(inviteWorkspace.id, member.user_id, e.target.value)}
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                      <button
                        className={styles.memberRemove}
                        disabled={isRemovingMember || member.role === 'owner'}
                        onClick={() => handleRemoveMember(inviteWorkspace.id, member.user_id)}
                      >
                        {isSelf ? 'Leave' : 'Remove'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalSecondary} onClick={() => setInviteWorkspace(null)}>Cancel</button>
              <button className={styles.modalPrimary} onClick={handleInviteMember} disabled={isInviting}>
                {isInviting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSnippets } from '@/hooks/useSnippets'
import {
  Code2, Sparkles, Zap,
  Clock, Library, ChevronRight,
  TrendingUp, Activity, Settings,
  Cpu, Share2, ShieldCheck
} from 'lucide-react'
import { LANGUAGES } from '@/lib/languages'
import { TEMPLATES } from '@/lib/templates'
import Skeleton from '@/components/Skeleton'
import styles from './Home.module.css'

export default function Home() {
  const { user } = useAuth()
  const { snippets, loading: snippetsLoading } = useSnippets()
  const [quickForgeTitle, setQuickForgeTitle] = useState('')

  const recentSnippets = snippets.slice(0, 3)

  // Calculate Neural Streak (Consecutive days with snippets)
  const calculateStreak = () => {
    if (snippets.length === 0) return 0
    
    // Get unique dates in YYYY-MM-DD format, sorted descending
    const activeDates = Array.from(new Set(
      snippets.map(s => new Date(s.created_at).toISOString().split('T')[0])
    )).sort((a, b) => b.localeCompare(a))

    let streak = 0
    let today = new Date().toISOString().split('T')[0]
    let yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Start checking from the most recent active date
    if (activeDates[0] !== today && activeDates[0] !== yesterday) {
      return 0 // Streak broken if no activity today or yesterday
    }

    let currentDate = new Date(activeDates[0])
    for (let i = 0; i < activeDates.length; i++) {
      const activeDateStr = activeDates[i]
      const expectedDateStr = currentDate.toISOString().split('T')[0]

      if (activeDateStr === expectedDateStr) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const streak = calculateStreak()

  if (user) {
    return (
      <div className={styles.main}>
        <div className={styles['grid-overlay']} />
        <div className={styles['hud-lattice']} />
        <div className={styles['hud-frame']} />

        <section className={styles.dashboard}>
          <div className={styles.dashHeader}>
            <div className={styles.welcome}>
              <div className={styles.statusBadge}>
                <div className={styles.onlineDot} />
                Neural Forge Alpha: [CONNECTIVITY_STABLE]
              </div>
              <h1 className={styles.hudHeading}>Command <span className={styles.accent}>Center</span></h1>
              <div className={styles.quickForge}>
                <div className={styles.inputWrapper}>
                  <Code2 size={18} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="Initialize new forge project..." 
                    className={styles.forgeInput} 
                    value={quickForgeTitle}
                    onChange={(e) => setQuickForgeTitle(e.target.value)}
                  />
                </div>
                <Link 
                  to="/compiler" 
                  state={{ snippet: { title: quickForgeTitle || 'Untitled Forge' } }}
                  className={styles.quickForgeBtn}
                >
                  Forge <Zap size={14} fill="currentColor" />
                </Link>
              </div>
            </div>
            <div className={styles.quickActions}>
              <button className={styles.actionIconButton} title="Settings">
                <Settings size={18} />
              </button>
              <button className={styles.actionIconButton} title="Cloud Status">
                <Activity size={18} />
              </button>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.hudNode}>
              <div className={styles.nodeStatus} />
              <div className={styles.nodeScanner} />
              <div className={styles.nodeIcon}><Library size={20} /></div>
              <div className={styles.nodeBody}>
                <p className={styles.nodeLabel}>Global Vault</p>
                <p className={styles.nodeValue}>{snippets.length}</p>
              </div>
              <div className={styles.nodePulse} />
            </div>

            <div className={styles.hudNode}>
              <div className={styles.nodeStatus} />
              <div className={styles.nodeScanner} />
              <div className={styles.nodeIcon}><TrendingUp size={20} /></div>
              <div className={styles.nodeBody}>
                <p className={styles.nodeLabel}>Neural Streak</p>
                <p className={styles.nodeValue}>{streak}<span className={styles.nodeUnit}>d</span></p>
              </div>
              <div className={styles.nodeTrend}>
                <div className={styles.trendPeak} style={{ height: '60%' }} />
                <div className={styles.trendPeak} style={{ height: '80%' }} />
                <div className={styles.trendPeak} style={{ height: '40%' }} />
                <div className={styles.trendPeak} style={{ height: '90%' }} />
              </div>
            </div>

            <div className={styles.hudNode}>
              <div className={styles.nodeStatus} />
              <div className={styles.nodeScanner} />
              <div className={styles.nodeIcon}><Zap size={20} /></div>
              <div className={styles.nodeBody}>
                <p className={styles.nodeLabel}>Forge Credits</p>
                <p className={styles.nodeValue}>942.5</p>
              </div>
            </div>
          </div>

          <div className={styles.dashMain}>
            <div className={styles.recentSection}>
              <div className={styles.sectionHead}>
                <h2>Recent Forges</h2>
                <Link to="/snippets" className={styles.viewLink}>
                  View Vault <ChevronRight size={14} />
                </Link>
              </div>
              {/* Existing recent grid */}
              <div className={styles.recentGrid}>
                {snippetsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className={styles.miniCard}>
                      <Skeleton width={40} height={40} />
                      <div style={{ flex: 1 }}>
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="20%" height={12} style={{ marginTop: 8 }} />
                      </div>
                    </div>
                  ))
                ) : recentSnippets.length > 0 ? (
                  recentSnippets.map(s => (
                    <Link key={s.id} to={`/compiler?id=${s.id}`} className={`${styles.terminalEntry} premium-glass`}>
                      <div className={styles.terminalIcon}>
                        <Code2 size={18} />
                      </div>
                      <div className={styles.terminalBody}>
                        <div className={styles.terminalHeader}>
                          <h4>{s.title}</h4>
                          <span className={styles.termLang}>{s.language}</span>
                        </div>
                        <div className={styles.termSpecs}>
                          <span className={styles.spec}><Clock size={10} /> {new Date(s.created_at).toLocaleDateString()}</span>
                          <span className={styles.spec}>•</span>
                          <span className={styles.spec}>ID: {s.id.substring(0, 6)}</span>
                          <span className={styles.spec}>•</span>
                          <span className={styles.spec}>LATENCY: 12ms</span>
                        </div>
                      </div>
                      <ChevronRight className={styles.termArrow} size={16} />
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyRecent}>
                    <p>No snippets found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.sideCol}>
              <div className={styles.forgeEvents}>
                <h3>Forge Activity</h3>
                <div className={styles.eventList}>
                  {recentSnippets.length > 0 ? (
                    recentSnippets.map((s) => (
                      <div key={s.id} className={styles.eventItem}>
                        <div className={styles.eventDot} />
                        <div className={styles.eventInfo}>
                          <p>Forge optimization applied to <strong>{s.title}</strong></p>
                          <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyActivity}>
                      <p>No forge activity recorded.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.promoCard}>
                <div className={styles.promoIcon}><Sparkles size={24} /></div>
                <h4>Go Pro</h4>
                <p>Unlock unlimited cloud credits and priority forge queues.</p>
                <button className={styles.promoBtn}>Upgrade Now</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.main}>
      <div className={styles['grid-overlay']} />

      {/* Dynamic Background Orbs */}
      <div className={styles.orbs}>
        <div className={styles.orb} />
        <div className={styles.orb} />
        <div className={styles.orb} />
      </div>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.badge} ${styles.animateIn}`} style={{ '--delay': '0s' } as any}>
            <span className={styles.badgeDot} />
            Production Ready Environment
          </div>
          <h1 className={`${styles.heading} ${styles.animateIn}`} style={{ '--delay': '0.1s' } as any}>
            The Future of <br />
            <span className={styles.accent}>Neural Coding.</span>
          </h1>
          <p className={`${styles.subheading} ${styles.animateIn}`} style={{ '--delay': '0.2s' } as any}>
            Execute, debug, and ship with CodeForge. A high-performance cloud compiler for the next generation of developers.
          </p>
          <div className={`${styles.ctas} ${styles.animateIn}`} style={{ '--delay': '0.3s' } as any}>
            <Link to="/compiler" className={styles.primaryCta}>
              Start Coding Now <Zap size={18} fill="currentColor" />
            </Link>
            <Link to="/auth" className={styles.secondaryCta}>
              Join Community
            </Link>
          </div>
          <div className={`${styles.langPills} ${styles.animateIn}`} style={{ '--delay': '0.4s' } as any}>
            {LANGUAGES.slice(0, 5).map(l => (
              <span key={l.value} className={styles.pill}>{l.name}</span>
            ))}
            <span className={styles.pill}>+3 More</span>
          </div>
        </div>

        <div className={styles.previewContainer}>
          <div
            className={`${styles.codePreview} ${styles.animateIn}`}
            style={{ '--delay': '0.5s', '--rx': '0deg', '--ry': '0deg' } as any}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - rect.left) / rect.width
              const y = (e.clientY - rect.top) / rect.height
              e.currentTarget.style.setProperty('--rx', `${(y - 0.5) * 10}deg`)
              e.currentTarget.style.setProperty('--ry', `${(x - 0.5) * -10}deg`)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty('--rx', '0deg')
              e.currentTarget.style.setProperty('--ry', '0deg')
            }}
          >
            <div className={styles.windowBar}>
              <div className={styles.dots}>
                <span /> <span /> <span />
              </div>
              <div className={styles.windowTitle}>algorithm.py</div>
            </div>
            <div className={styles.code}>
              <div className={styles.lineGlow} />
              <span className="kw">def</span> <span className="fn">forge_future</span>(code):{"\n"}
              {"  "}optimized = <span className="fn">compile</span>(code){"\n"}
              {"  "}<span className="kw">return</span> <span className="str">f"✨ Optimized {"{optimized}"}"</span>{"\n"}{"\n"}
              print(<span className="fn">forge_future</span>(<span className="str">"CodeForge"</span>))
            </div>
            <div className={styles.outputBar}>
              <span className={styles.outputLabel}>Terminal</span>
              <p className={styles.outputCode}><span className={styles.dash}>$</span> ✨ Optimized CodeForge</p>
            </div>
          </div>
          <div className={styles.glowBlob} />
        </div>
      </section>

      <section className={styles.capabilities}>
        <div className={styles.capHeader}>
          <span className={styles.capEyebrow}>Signal Core</span>
          <h2>Build, run, and ship from a single canvas</h2>
          <p>Zero setup. Instant compile. Share-ready outputs in seconds.</p>
        </div>
        <div className={styles.capGrid}>
          <div className={styles.capCard}>
            <div className={styles.capIcon}><Cpu size={20} /></div>
            <h3 className={styles.capTitle}>Realtime Cloud Compile</h3>
            <p className={styles.capText}>Run code in isolated containers with low-latency feedback and live metrics.</p>
          </div>
          <div className={styles.capCard}>
            <div className={styles.capIcon}><Share2 size={20} /></div>
            <h3 className={styles.capTitle}>Shareable Snippets</h3>
            <p className={styles.capText}>Publish or fork in one click. Every run can become a public artifact.</p>
          </div>
          <div className={styles.capCard}>
            <div className={styles.capIcon}><ShieldCheck size={20} /></div>
            <h3 className={styles.capTitle}>Safe Execution</h3>
            <p className={styles.capText}>Resource limits, sanitization, and isolated sandboxes keep code secure.</p>
          </div>
        </div>
        <div className={styles.signalStrip}>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Latency</span>
            <span className={styles.signalValue}>24ms</span>
          </div>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Languages</span>
            <span className={styles.signalValue}>8+</span>
          </div>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Uptime</span>
            <span className={styles.signalValue}>99.98%</span>
          </div>
        </div>
      </section>

      <section className={styles.templates}>
        <div className={styles.templatesInner}>
          <div className={`${styles.sectionHeader} ${styles.animateIn}`} style={{ '--delay': '0.6s' } as any}>
            <Sparkles className={styles.sparkleIcon} />
            <h2 className={styles.sectionTitle}>Ready-to-Use <span className={styles.accent}>Blueprints.</span></h2>
            <p className={styles.sectionSubtitle}>
              Don't start from scratch. Use our curated collection of industry-standard templates to kickstart your project in seconds.
            </p>
          </div>

          <div className={styles.templateGrid}>
            {TEMPLATES.map((t, i) => (
              <div
                key={t.id}
                className={`${styles.templateCard} premium-glass ${styles.animateIn}`}
                style={{ '--delay': `${0.7 + i * 0.1}s` } as any}
              >
                <span className={styles.templateCategory}>{t.category}</span>
                <h3 className={styles.templateTitle}>{t.title}</h3>
                <p className={styles.templateDesc}>{t.description}</p>
                <div className={styles.templateMeta}>
                  <span className={styles.templateLang}>{t.language}</span>
                  <Link
                    to="/compiler"
                    state={{ snippet: { code: t.code, language: t.language, title: t.title } }}
                    className={styles.launchBtn}
                  >
                    Use Blueprint <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Code2 size={20} />
              </div>
              <span className={styles.logoText}>CodeForge</span>
            </div>
            <p className={styles.brandDesc}>
              The next generation of cloud compilation. Built for speed, scaled for developers.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Platform</h4>
              <Link to="/compiler">Compiler</Link>
              <Link to="/snippets">Explore</Link>
              <Link to="/gallery">Showcase</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Community</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 CodeForge. All rights reserved.</p>
          <div className={styles.socials}>
            {/* Social icons could go here */}
          </div>
        </div>
      </footer>
    </div>
  )
}

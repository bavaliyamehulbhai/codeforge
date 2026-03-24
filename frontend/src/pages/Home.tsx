import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSnippets } from '@/hooks/useSnippets'
import { 
  Code2, Sparkles, Play, Zap, 
  ArrowRight, Clock, Library, Plus, ChevronRight
} from 'lucide-react'
import { LANGUAGES } from '@/lib/languages'
import { TEMPLATES } from '@/lib/templates'
import Skeleton from '@/components/Skeleton'
import styles from './Home.module.css'

export default function Home() {
  const { user } = useAuth()
  const { snippets, loading: snippetsLoading } = useSnippets()

  const recentSnippets = snippets.slice(0, 3)

  if (user) {
    return (
      <div className={styles.main}>
        <div className={styles['grid-overlay']} />
        
        <section className={styles.dashboard}>
          <div className={styles.dashHeader}>
            <div className={styles.welcome}>
              <h1>Welcome back, <span className={styles.accent}>{user.username}</span></h1>
              <p>Your workspace is ready. What are we building today?</p>
            </div>
            <Link to="/compiler" className={styles.createBtn}>
              <Plus size={20} />
              <span>New Snippet</span>
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} premium-glass`}>
              <Library className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Total Projects</p>
                <p className={styles.statValue}>{snippets.length}</p>
              </div>
            </div>
            <div className={`${styles.statCard} premium-glass`}>
              <Play className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Executions</p>
                <p className={styles.statValue}>142</p>
              </div>
            </div>
            <div className={`${styles.statCard} premium-glass`}>
              <Clock className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Time Spent</p>
                <p className={styles.statValue}>12.4h</p>
              </div>
            </div>
          </div>

          <div className={styles.dashMain}>
            <div className={styles.recentSection}>
              <div className={styles.sectionHead}>
                <h2>Recent Snippets</h2>
                <Link to="/snippets" className={styles.viewLink}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

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
                    <Link key={s.id} to={`/compiler?id=${s.id}`} className={`${styles.miniCard} premium-glass`}>
                      <Code2 className={styles.miniIcon} size={24} />
                      <div className={styles.miniInfo}>
                        <h4>{s.title}</h4>
                        <span>{s.language} • {new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyRecent}>
                    <p>No snippets yet. Start coding to see them here!</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.templateSection}>
              <h2>Top Templates</h2>
              <div className={styles.templateGridDash}>
                {TEMPLATES.slice(0, 4).map(t => (
                  <Link 
                    key={t.id} 
                    to="/compiler" 
                    state={{ snippet: { code: t.code, language: t.language, title: t.title } }}
                    className={styles.dashTemplate}
                  >
                    <span>{t.title}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
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
      
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.badge} ${styles.animateIn}`} style={{ '--delay': '0s' } as any}>
            <span className={styles.badgeDot} />
            Production Ready Environment
          </div>
          <h1 className={`${styles.heading} ${styles.animateIn}`} style={{ '--delay': '0.1s' } as any}>
            The Future of <br/>
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
    </div>
  )
}

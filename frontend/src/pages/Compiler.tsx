import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import clsx from 'clsx'
import { 
  Play, Save, Terminal as TerminalIcon, Loader2, 
  Globe, Cpu, Clock, Trash2, Copy, AlignLeft, ChevronDown,
  Maximize2, Minimize2, Code2, Sparkles, History,
  Headphones, BookTemplate, Settings as SettingsIcon,
  Flame, Timer, MessageSquare, Send, Keyboard
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { useSnippets } from '@/hooks/useSnippets'
import { useCompiler } from '@/hooks/useCompiler'
import { oneDark } from '@codemirror/theme-one-dark'
import { LANGUAGES } from '@/lib/languages'
import * as htmlToImage from 'html-to-image'
import LanguagePicker from '@/components/LanguagePicker'
import Tooltip from '@/components/Tooltip'
import { formatCode } from '@/lib/formatter'
import { EditorView } from '@codemirror/view'
import { useFocusAudio } from '@/hooks/useFocusAudio'
import { useAPMTracker } from '@/hooks/useAPMTracker'
import { BOILERPLATES } from '@/lib/boilerplates'
import { AdSlot } from '@/components/AdSlot'
import styles from './Compiler.module.css'

export default function Compiler() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { saveSnippet, fetchSnippetById } = useSnippets()
  const { 
    code, setCode, stdin, setStdin, language, setLanguage, output, isRunning, runCode,
    fontSize, updateFontSize, theme, updateTheme, setOutput 
  } = useCompiler()
  const location = useLocation()
  const [title, setTitle] = useState('Untitled Snippet')
  const [snippetId, setSnippetId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showStdin, setShowStdin] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<any[]>([])
  
  // Show language picker unless user arrived from a saved snippet
  const [hasPickedLanguage, setHasPickedLanguage] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isForging, setIsForging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  
  // Advanced Features State
  const [codeHistory, setCodeHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const { isPlaying: isFocusAudioPlaying, toggleAudio: toggleFocusAudio } = useFocusAudio()
  const [showSettings, setShowSettings] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  
  // Phase 4 Gamification State
  const apm = useAPMTracker()
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes
  const [isPomodoroActive, setIsPomodoroActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'insights' | 'duck' | 'history'>('insights')
  const [duckMessages, setDuckMessages] = useState<{sender: 'user'|'duck', text: string}[]>([
    { sender: 'duck', text: "Quack! Tell me what's broken and I'll help you debug it." }
  ])
  const [chatInput, setChatInput] = useState('')

  // Pomodoro Effect
  useEffect(() => {
    let interval: any;
    if (isPomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1)
      }, 1000)
    } else if (isPomodoroActive && pomodoroTime === 0) {
      setIsPomodoroActive(false)
      toast('Deep Work Session Complete!', 'success')
      setPomodoroTime(25 * 60)
    }
    return () => clearInterval(interval)
  }, [isPomodoroActive, pomodoroTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Rubber Duck Chat Logic
  const handleDuckSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newMsgs = [...duckMessages, { sender: 'user', text: chatInput }] as any
    setDuckMessages(newMsgs)
    setChatInput('')

    setTimeout(() => {
      const lowerInput = chatInput.toLowerCase()
      let duckReply = "Interesting... what happens if you break it down into smaller pieces?"
      
      if (lowerInput.includes('error') || lowerInput.includes('fail')) {
        duckReply = "What does the error message say exactly? Which line is throwing it?"
      } else if (lowerInput.includes('null') || lowerInput.includes('undefined')) {
        duckReply = "Where was that variable supposed to be initialized? Check the references."
      } else if (lowerInput.includes('loop')) {
        duckReply = "Are you sure your exit condition is ever met? Let's trace the loop scope."
      } else if (lowerInput.includes('async') || lowerInput.includes('promise')) {
        duckReply = "Missing an await? Or maybe a forgotten .catch() block?"
      } else if (lowerInput.includes('react') || lowerInput.includes('state')) {
        duckReply = "Is the component re-rendering unexpectedly? Check the dependency array."
      }
      
      setDuckMessages(prev => [...prev, { sender: 'duck', text: `Quack! ${duckReply}` }])
    }, 600)
  }
  
  // Real-time HUD Metrics
  const [latency, setLatency] = useState(24)
  const [cpuUsage, setCpuUsage] = useState(12)

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(18, Math.min(42, prev + (Math.random() > 0.5 ? 1 : -1))))
      setCpuUsage(prev => Math.max(8, Math.min(24, prev + (Math.random() > 0.5 ? 2 : -2))))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, language])

  // Record Code History for Time-Travel
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!code.trim()) return;
      setCodeHistory(prev => {
        const lastRec = prev[prev.length - 1];
        if (code !== lastRec) {
          const newHistory = prev.slice(0, historyIndex === -1 ? prev.length : historyIndex + 1);
          newHistory.push(code);
          if (newHistory.length > 25) newHistory.shift(); // Keep last 25 states
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        }
        return prev;
      });
    }, 800); // Debounce
    return () => clearTimeout(timer);
  }, [code, historyIndex]);

  const handleTimeTravel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    setHistoryIndex(newIdx);
    if (codeHistory[newIdx] !== undefined) {
      setCode(codeHistory[newIdx]);
    }
  };

  const handleFormat = () => {
    const formatted = formatCode(code, language);
    if (formatted !== code) {
      setCode(formatted);
      toast('Code nicely formatted!', 'success');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const id = searchParams.get('id')

    if (location.state?.snippet) {
      const { snippet } = location.state
      setCode(snippet.code)
      setLanguage(snippet.language)
      setTitle(snippet.title || 'Untitled Snippet')
      setSnippetId(snippet.id)
      setHasPickedLanguage(true)
    } else if (id) {
      // Deep link or refresh - fetch the snippet
      const loadSnippet = async () => {
        setIsScanning(true)
        const s = await fetchSnippetById(id)
        if (s) {
          setCode(s.code)
          setLanguage(s.language)
          setTitle(s.title)
          setSnippetId(s.id)
          setHasPickedLanguage(true)
          toast('Syncing codebase...', 'success')
        } else {
          toast('Failed to load snippet', 'error')
        }
        setIsScanning(false)
      }
      loadSnippet()
    }
  }, [location.state, location.search, setCode, setLanguage])

  const getExtensions = () => {
    switch (language) {
      case 'javascript': return [javascript({ jsx: true })]
      case 'python': return [python()]
      case 'cpp': return [cpp()]
      case 'c': return [cpp()] // C uses the cpp extension
      case 'java': return [java()]
      case 'rust': return [rust()]
      case 'go': return [go()]
      default: return [javascript()]
    }
  }

  const handleRun = async () => {
    const lang = LANGUAGES.find(l => l.value === language)
    if (lang) {
      toast(`Compiling ${lang.name}...`, 'info')
      const result = await runCode(lang.id)
      // Save to history
      if (result) {
        setExecutionHistory(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          language: lang.name,
          status: (result as any).status?.description || 'Done',
          output: (result as any).stdout || (result as any).stderr || 'No output'
        }, ...prev].slice(0, 10))
      }
    }
  }

  const handleSave = async () => {
    if (!user) return toast('Please sign in to save snippets', 'error')
    setIsSaving(true)
    try {
      const savedSnippet = await saveSnippet({ title, language, code, is_public: true })
      if (savedSnippet) {
        setSnippetId(savedSnippet.id)
        toast('Snippet saved to cloud!', 'success')
      }
    } catch (err) {
      toast('Failed to save snippet', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    if (!snippetId) return toast('Please save the snippet first to share', 'info')
    const shareUrl = `${window.location.origin}/share/${snippetId}`
    navigator.clipboard.writeText(shareUrl)
    toast('Share link copied to clipboard!', 'success')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Copied to clipboard!', 'success')
  }

  const clearConsole = () => {
    setOutput(null)
    toast('Console cleared', 'info')
  }

  const handleForge = () => {
    setIsScanning(true)
    toast('Scanning Neural Structure...', 'info')
    
    setTimeout(() => {
      setIsScanning(false)
      setIsForging(true)
      toast('Forging & Optimizing...', 'success')
      
      const formatted = formatCode(code, language)
      if (formatted === code) {
        setIsForging(false)
        toast('Code is already optimal.', 'info')
        return
      }
      
      // Animated AI Typing Effect
      setCode('')
      const lines = formatted.split('\n')
      let currentLine = 0
      let currentText = ''

      const interval = setInterval(() => {
        if (currentLine >= lines.length) {
          clearInterval(interval)
          setIsForging(false)
          toast('Code Forged Successfully!', 'success')
          return
        }
        currentText += (currentLine > 0 ? '\n' : '') + lines[currentLine]
        setCode(currentText)
        currentLine++
      }, 30) // Rapid typing effect
    }, 1500) // Scanning duration
  }

  const getInsights = () => {
    const lines = code.split('\n').length
    const loops = (code.match(/for|while/g) || []).length
    const ifs = (code.match(/if/g) || []).length
    
    return {
      complexity: loops > 1 ? 'O(n²)' : loops > 0 ? 'O(n)' : 'O(1)',
      health: lines > 50 ? 'Medium' : 'Optimal',
      logicDensity: (ifs + loops) / lines || 0
    }
  }

  // Auto-save to LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code && code.trim().length > 0) {
        localStorage.setItem('codeforge_autosave', JSON.stringify({ code, language, title }))
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [code, language, title])

  // Load auto-save if available
  useEffect(() => {
    const saved = localStorage.getItem('codeforge_autosave')
    if (saved && !location.state?.snippet) {
      const { code: c, language: l, title: t } = JSON.parse(saved)
      if (confirm('Restore unsaved work from your last session?')) {
        setCode(c)
        setLanguage(l)
        setTitle(t)
        setHasPickedLanguage(true)
      }
      localStorage.removeItem('codeforge_autosave')
    }
  }, [])

  const handleLanguagePick = (lang: string, defaultCode: string) => {
    setLanguage(lang)
    setCode(defaultCode)
    setHasPickedLanguage(true)
  }

  const captureSnapshot = async () => {
    const node = document.getElementById('snapshot-preview')
    if (!node) return
    
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#050505'
      })
      const link = document.createElement('a')
      link.download = `codeforge-${title.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
      toast('Neural Snapshot captured!', 'success')
      setShowSnapshotModal(false)
    } catch (err) {
      toast('Failed to capture snapshot', 'error')
    }
  }

  const currentLang = LANGUAGES.find(l => l.value === language)

  return (
    <div className={styles.container}>
      {/* Language Picker Overlay */}
      {!hasPickedLanguage && (
        <LanguagePicker
          onSelect={handleLanguagePick}
          onSkip={() => setHasPickedLanguage(true)}
        />
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Code2 size={20} />
            </div>
            <span className={styles.logoText}>CodeForge</span>
          </Link>
          <div className={styles.headerDivider} />
          <div className={styles.titleWrapper}>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={styles.titleInput}
              placeholder="Enter snippet title..."
            />
            <span className={styles.titleUnderline} />
          </div>
          <div className={styles.controls}>
            {/* Language selector — shows icon + name */}
            <div className={styles.langSelector}>
              {currentLang && (
                <img
                  src={currentLang.logo}
                  alt={currentLang.name}
                  className={styles.langIcon}
                  style={{ filter: language === 'rust' ? 'invert(1) brightness(0.8)' : undefined }}
                />
              )}
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className={styles.select}
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
            
            <div className={styles.divider} />
            
            <div className={styles.pomodoroContainer}>
              <button 
                onClick={() => setIsPomodoroActive(!isPomodoroActive)} 
                className={clsx(styles.pomodoroBtn, isPomodoroActive && styles.pomodoroActive)}
                title="Deep Work Pomodoro"
              >
                <Timer size={14} className={styles.pomodoroIcon} />
                <span className={styles.pomodoroTime}>{formatTime(pomodoroTime)}</span>
              </button>
            </div>
            
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tooltip content="Keyboard Shortcuts">
            <button onClick={() => setShowShortcuts(true)} className={styles.miniBtn}>
              <Keyboard size={18} />
            </button>
          </Tooltip>
          <div className={styles.libraryContainer}>
            <Tooltip content="Boilerplate Library">
              <button onClick={() => setShowLibrary(!showLibrary)} className={clsx(styles.miniBtn, showLibrary && styles.activeMiniBtn)}>
                <BookTemplate size={18} />
              </button>
            </Tooltip>
            {showLibrary && (
              <div className={styles.libraryDropdown}>
                <div className={styles.libraryHeader}>Standard Library</div>
                {BOILERPLATES[language]?.length > 0 ? (
                  BOILERPLATES[language].map((bp, idx) => (
                    <button 
                      key={idx} 
                      className={styles.libraryItem}
                      onClick={() => {
                        setCode(bp.code)
                        setShowLibrary(false)
                        toast(`${bp.name} injected!`, 'success')
                      }}
                    >
                      {bp.name}
                    </button>
                  ))
                ) : (
                  <div className={styles.emptyLibrary}>No boilerplates for {language}</div>
                )}
              </div>
            )}
          </div>
          <Tooltip content="Focus Flow Audio">
            <button 
              onClick={toggleFocusAudio} 
              className={clsx(styles.miniBtn, isFocusAudioPlaying && styles.activePulseBtn)} 
            >
              <Headphones size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Editor Settings">
            <button onClick={() => setShowSettings(true)} className={styles.miniBtn}>
              <SettingsIcon size={18} />
            </button>
          </Tooltip>
          
          <div className={styles.divider} />
          
          <Tooltip content={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}>
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)} 
              className={clsx(styles.miniBtn, isFocusMode && styles.activeMiniBtn)} 
            >
              {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </Tooltip>
          <Tooltip content="Neural Forge (Optimize)">
            <button 
              onClick={handleForge} 
              disabled={isForging}
              className={clsx(styles.forgeBtn, isForging && styles.forging)} 
            >
              <Sparkles size={18} />
              <span className={styles.btnText}>Forge</span>
            </button>
          </Tooltip>
          
          <div className={styles.divider} />
          
          <Tooltip content="Auto-Format Code">
            <button onClick={handleFormat} className={styles.miniBtn}>
              <AlignLeft size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Neuro-Assistant">
            <button 
              onClick={() => setIsAssistantOpen(!isAssistantOpen)} 
              className={clsx(styles.miniBtn, isAssistantOpen && styles.activeMiniBtn)}
            >
              <Cpu size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Neural Snapshot">
            <button onClick={() => setShowSnapshotModal(true)} className={styles.miniBtn}>
              <Copy size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Share Snippet">
            <button onClick={handleShare} className={styles.shareBtn}>
              <Globe size={18} />
            </button>
          </Tooltip>
          <button onClick={handleRun} disabled={isRunning} className={styles.runBtn}>
            {isRunning ? <Loader2 className={styles.spin} size={18} /> : <Play size={18} />}
            <span className={styles.btnText}>Run</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} className={styles.saveBtn}>
            {isSaving ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
            <span className={styles.btnText}>Save</span>
          </button>
        </div>
      </header>

      <main className={clsx(styles.main, isFocusMode && styles.focusMode)}>
        <div className={clsx(styles.editorPane, apm > 80 && styles.overclock, isPomodoroActive && styles.deepWorkMode)}>
          <CodeMirror
            value={code}
            height="100%"
            theme={theme === 'one-dark' ? oneDark : vscodeDark}
            extensions={[...getExtensions(), wordWrap ? EditorView.lineWrapping : []]}
            onChange={(val) => setCode(val)}
            className={styles.editor}
            style={{ fontSize: `${fontSize}px` }}
          />
          {isScanning && (
            <div className={styles.scanningOverlay}>
              <div className={styles.scanLine} />
              <div className={styles.scanText}>
                <Cpu className={styles.spin} size={32} />
                <p>Neural Scan in Progress...</p>
              </div>
            </div>
          )}
          {isRunning && (
            <div className={styles.editorOverlay}>
              <div className={styles.loaderLine} />
              <div className={styles.loaderContent}>
                <Loader2 className={styles.spin} size={32} />
                <p>Executing on Cloud...</p>
              </div>
            </div>
          )}
          
          <div className={styles.statusBar}>
            <div className={styles.statusItem}>
              <div className={clsx(styles.apmMetric, apm > 80 && styles.apmHigh)} title="Actions Per Minute">
                <Flame size={14} className={apm > 80 ? styles.flameIcon : ''} style={{ color: apm > 80 ? '#ff4500' : 'var(--text-secondary)' }} />
                <span style={{ color: apm > 80 ? '#ff4500' : 'var(--text-secondary)' }}>APM: {apm}</span>
              </div>
            </div>
            <div className={styles.statusSpacer} />
            <div className={styles.statusItem}>
              <Globe size={13} />
              <span>REGION: GLOBAL-NODE-01</span>
            </div>
            <div className={styles.statusItem}>
              <Clock size={13} />
              <span>LATENCY: {latency}ms</span>
            </div>
            <div className={styles.statusItem}>
              <Cpu size={13} />
              <span>CPU: {cpuUsage}%</span>
            </div>
            <div className={styles.statusSpacer} />
            {currentLang && (
              <div className={styles.statusItem}>
                <img
                  src={currentLang.logo}
                  alt={currentLang.name}
                  style={{ width: 12, height: 12, objectFit: 'contain', filter: language === 'rust' ? 'invert(1)' : undefined }}
                />
                <span style={{ color: currentLang.color }}>{currentLang.name.toUpperCase()}</span>
              </div>
            )}
            <div className={styles.statusItem}>
              <div className={styles.statusDot} />
              <span>SYSTEM: OPTIMIZED</span>
            </div>
            <div className={styles.statusItem}>
              <span>UTF-8</span>
            </div>
          </div>
        </div>

        {isAssistantOpen && (
          <aside className={styles.assistantPanel}>
            <div className={styles.assistantHeader}>
              <Cpu size={20} className={styles.assistantIcon} />
              <h3>Neuro-Assistant</h3>
              <button onClick={() => setIsAssistantOpen(false)} className={styles.closeBtn}>×</button>
            </div>

            <div className={styles.assistantTabs}>
              <button 
                className={clsx(styles.tabBtn, activeTab === 'insights' && styles.activeTab)}
                onClick={() => setActiveTab('insights')}
              >
                Insights
              </button>
              <button 
                className={clsx(styles.tabBtn, activeTab === 'history' && styles.activeTab)}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
              <button 
                className={clsx(styles.tabBtn, activeTab === 'duck' && styles.activeTab)}
                onClick={() => setActiveTab('duck')}
              >
                Duck
              </button>
              <div className={styles.tabIndicator} style={{ 
                left: activeTab === 'insights' ? '0' : activeTab === 'history' ? '33.3%' : '66.6%',
                width: '33.3%'
              }} />
            </div>
            
            <div className={styles.assistantContent}>
              <div className={styles.adSidebar}>
                <AdSlot id="adsterra-sidebar" />
              </div>
              {activeTab === 'insights' && (
                <>
                  <div className={styles.insightCard}>
                    <span className={styles.insightLabel}>Complexity</span>
                    <span className={styles.insightValue}>{getInsights().complexity}</span>
                    <div className={styles.insightBar}><div style={{ width: getInsights().complexity === 'O(1)' ? '30%' : '80%' }} /></div>
                  </div>
                  <div className={styles.insightCard}>
                    <span className={styles.insightLabel}>System Health</span>
                    <span className={styles.insightValue}>{getInsights().health}</span>
                  </div>

                  <div className={styles.insightCard}>
                    <span className={styles.insightLabel}>Neural Time-Travel</span>
                    <div className={styles.historyControl}>
                      <History size={16} className={styles.historyIcon} />
                      <input 
                        type="range" 
                        min={0} 
                        max={Math.max(0, codeHistory.length - 1)} 
                        value={historyIndex} 
                        onChange={handleTimeTravel}
                        className={styles.historySlider}
                        disabled={codeHistory.length <= 1}
                      />
                      <span className={styles.historyMetrics}>
                        {codeHistory.length > 0 ? historyIndex + 1 : 0} / {codeHistory.length}
                      </span>
                    </div>
                  </div>

                  <div className={styles.neuroTips}>
                    <h4>Neuro-Tips</h4>
                    <ul>
                      {language === 'javascript' && (
                        <>
                          <li>Use optional chaining for safer access.</li>
                          <li>Prefer `const` over `let` for immutability.</li>
                        </>
                      )}
                      {language === 'python' && (
                        <>
                          <li>Use list comprehensions for speed.</li>
                          <li>Keep functions small and focused.</li>
                        </>
                      )}
                      <li>Monitor memory usage in real-time HUD.</li>
                    </ul>
                  </div>

                  <div className={styles.assistantFooter}>
                    <div className={styles.aiGlow} />
                    <p>Neural engine analysis complete.</p>
                  </div>
                </>
              )}
              
              {activeTab === 'history' && (
                <div className={styles.historyTab}>
                  <h4>Neural Exec History</h4>
                  {executionHistory.length > 0 ? (
                    <div className={styles.historyList}>
                      {executionHistory.map((h, i) => (
                        <div key={i} className={styles.historyItem}>
                          <div className={styles.historyItemHead}>
                            <span className={styles.historyTime}>{h.timestamp}</span>
                            <span className={clsx(styles.historyStatus, h.status === 'Accepted' ? styles.statusOk : styles.statusErr)}>
                              {h.status}
                            </span>
                          </div>
                          <p className={styles.historyLang}>{h.language}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyHistory}>No code executed in this session.</div>
                  )}
                </div>
              )}

              {activeTab === 'duck' && (
                <div className={styles.duckContainer}>
                  <div className={styles.chatLog}>
                    {duckMessages.map((msg, i) => (
                      <div key={i} className={clsx(styles.chatMsg, msg.sender === 'duck' ? styles.duckMsg : styles.userMsg)}>
                        {msg.sender === 'duck' && <MessageSquare size={14} className={styles.duckIcon} />}
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleDuckSubmit} className={styles.chatForm}>
                    <input 
                      type="text" 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="Explain the bug..." 
                      className={styles.chatInput}
                    />
                    <button type="submit" disabled={!chatInput.trim()} className={styles.chatSubmitBtn}>
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </aside>
        )}

        <div className={styles.outputPane}>
          <div className={styles.outputHeader}>
            <div className={styles.headerTitle}>
              <TerminalIcon size={16} />
              <span>Console Output</span>
            </div>
            <div className={styles.outputActions}>
              <button 
                onClick={() => setShowStdin(!showStdin)} 
                className={clsx(styles.actionBtn, showStdin && styles.activeActionBtn)}
                title="Custom Input (stdin)"
              >
                <Keyboard size={14} />
              </button>
              <button onClick={() => copyToClipboard(output?.stdout || '')} disabled={!output} className={styles.actionBtn} title="Copy Output">
                <Copy size={14} />
              </button>
              <button onClick={clearConsole} disabled={!output} className={styles.actionBtn} title="Clear Console">
                <Trash2 className={styles.trash} size={14} />
              </button>
            </div>
            {output && (
              <div className={styles.outputMetrics}>
                {output.time && (
                  <div className={styles.metric}>
                    <Clock size={12} /> {output.time}s
                  </div>
                )}
                {output.memory && (
                  <div className={styles.metric}>
                    <Cpu size={12} /> {Math.round(output.memory / 1024)}MB
                  </div>
                )}
              </div>
            )}
          </div>
          
          {showStdin && (
            <div className={styles.stdinArea}>
              <div className={styles.stdinHeader}>
                <span>Standard Input (stdin)</span>
                <button onClick={() => setStdin('')} className={styles.clearStdin}>Clear</button>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input here..."
                className={styles.stdinInput}
              />
            </div>
          )}

          <div className={styles.outputContent}>
            {output ? (
              <div className={styles.result}>
                {output.stdout && (
                  <div className={styles.stdout}>
                    {output.stdout.split('\n').map((line, i) => {
                      const lineClass = clsx({
                        [styles.lineError]: line.toLowerCase().includes('error') || line.toLowerCase().includes('fail'),
                        [styles.lineSuccess]: line.includes('✔') || line.toLowerCase().includes('success') || line.includes('Done in'),
                        [styles.lineInfo]: line.includes('ℹ') || line.toLowerCase().includes('info'),
                      })
                      return <div key={i} className={lineClass}>{line || '\u00A0'}</div>
                    })}
                  </div>
                )}
                {output.stderr && <pre className={styles.stderr}>{output.stderr}</pre>}
                {output.compile_output && <pre className={styles.compileErr}>{output.compile_output}</pre>}
                {output.message && <pre className={styles.message}>{output.message}</pre>}
              </div>
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.placeholderTerminal}>
                  <div className={styles.terminalDots}>
                    <span style={{ background: '#ff5f56' }} />
                    <span style={{ background: '#ffbd2e' }} />
                    <span style={{ background: '#27c93f' }} />
                  </div>
                  <TerminalIcon className={styles.placeholderIcon} size={40} />
                  <p>Ready for execution</p>
                  <span>Press <kbd className={styles.kbd}>Ctrl+Enter</kbd> or click <strong>Run</strong></span>
                  <div className={styles.cursor} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.adContainer}>
            <div className={styles.adHeader}>
              <Sparkles size={12} />
              <span>Sponsor Slot</span>
            </div>
            <AdSlot id="adsterra-banner" className={styles.adPlaceholder} />
          </div>
        </div>
      </main>

      {/* Neural Snapshot Modal */}
      {showSnapshotModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSnapshotModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Neural Snapshot</h3>
              <button onClick={() => setShowSnapshotModal(false)}>×</button>
            </div>
            
            <div className={styles.snapshotPreviewContainer}>
              <div id="snapshot-preview" className={styles.snapshotPreviewWindow}>
                <div className={styles.snapshotHeader}>
                  <div className={styles.dotGroup}>
                    <span style={{ background: '#ff5f56' }} />
                    <span style={{ background: '#ffbd2e' }} />
                    <span style={{ background: '#27c93f' }} />
                  </div>
                  <div className={styles.snapshotTitle}>{title}</div>
                  <div className={styles.snapshotBranding}>CodeForge</div>
                </div>
                <pre className={styles.snapshotCode}>
                  <code>{code}</code>
                </pre>
                <div className={styles.snapshotFooter}>
                  <span>{currentLang?.name}</span>
                  <div className={styles.neuralLink}>NEURAL-LINK: ACTIVE</div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <p>Capture a high-fidelity image of your code for sharing.</p>
              <button onClick={captureSnapshot} className={styles.captureBtn}>
                <Copy size={18} /> Download PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {showSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Editor Settings</h3>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className={styles.settingsGrid}>
              <div className={styles.settingGroup}>
                <label>Theme</label>
                <select value={theme} onChange={(e) => updateTheme(e.target.value)} className={styles.select}>
                  <option value="vscode-dark">VS Code Dark</option>
                  <option value="one-dark">One Dark</option>
                </select>
              </div>
              <div className={styles.settingGroup}>
                <label>Font Size</label>
                <select value={fontSize} onChange={(e) => updateFontSize(Number(e.target.value))} className={styles.select}>
                  {[12, 14, 16, 18, 20].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              <div className={styles.settingGroup}>
                <label>Word Wrap</label>
                <label className={styles.toggleSwitch}>
                  <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowSettings(false)} className={styles.saveBtn}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Helper Modal */}
      {showShortcuts && (
        <div className={styles.modalOverlay} onClick={() => setShowShortcuts(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>CodeForge Helper & Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            
            <div className={styles.shortcutsGrid}>
              <div className={styles.shortcutRow}>
                <span>Run Code</span>
                <kbd className={styles.shortcutKbd}>Ctrl + Enter</kbd>
              </div>
              <div className={styles.shortcutRow}>
                <span>Auto-Format</span>
                <span>Click the <AlignLeft size={14} style={{verticalAlign: 'middle', display: 'inline-block'}} /> icon</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Exit Zen Mode</span>
                <kbd className={styles.shortcutKbd}>Esc</kbd>
              </div>
              
              <hr className={styles.shortcutDivider} />
              <h4 className={styles.shortcutSubheading}>Advanced Features</h4>
              
              <div className={styles.featureNote}>
                <strong>🔥 APM Overclock:</strong> Type rapidly. If your Actions Per Minute exceeds 80, the compiler will enter Overclock text-flow mode!
              </div>
              <div className={styles.featureNote}>
                <strong>🍅 Pomodoro:</strong> Click the deep-work Timer icon. The app will gracefully dim borders to help you focus for 25 minutes.
              </div>
              <div className={styles.featureNote}>
                <strong>🦆 Rubber Duck:</strong> Explain your bugs to the duck chat inside the Neuro-Assistant tab. Formulating the problem usually solves it!
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowShortcuts(false)} className={styles.saveBtn}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { rust } from '@codemirror/lang-rust'
import { useSnippets } from '@/hooks/useSnippets'
import { User, Calendar, ExternalLink, Loader2 } from 'lucide-react'
import { Snippet } from '@/types'
import styles from './ShareView.module.css'

export default function ShareView() {
  const { id } = useParams<{ id: string }>()
  const { fetchSnippetById } = useSnippets()
  const [snippet, setSnippet] = useState<Snippet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchSnippetById(id).then(data => {
        setSnippet(data)
        setLoading(false)
        if (data) document.title = `${data.title} | CodeForge`
      })
    }
    return () => { document.title = 'CodeForge' }
  }, [id, fetchSnippetById])

  const getExtensions = () => {
    switch (snippet?.language) {
      case 'javascript': return [javascript()]
      case 'python': return [python()]
      case 'cpp': return [cpp()]
      case 'java': return [java()]
      case 'rust': return [rust()]
      default: return [javascript()]
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spin} size={48} />
        <p>Loading Shared Snippet...</p>
      </div>
    )
  }

  if (!snippet) {
    return (
      <div className={styles.error}>
        <h2>Snippet Not Found</h2>
        <p>This snippet might be private or could have been deleted.</p>
        <Link to="/" className={styles.homeBtn}>Back to Home</Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.info}>
            <h1 className={styles.title}>{snippet.title}</h1>
            <div className={styles.meta}>
              <span className={styles.metaItem}><User size={14} /> {snippet.user_id}</span>
              <span className={styles.metaItem}><Calendar size={14} /> {new Date(snippet.created_at).toLocaleDateString()}</span>
              <span className={styles.langBadge}>{snippet.language}</span>
            </div>
          </div>
          <Link to="/compiler" state={{ snippet }} className={styles.forkBtn}>
            <ExternalLink size={18} />
            Try in Compiler
          </Link>
        </header>

        <div className={styles.editorWrapper}>
          <CodeMirror
            value={snippet.code}
            height="100%"
            theme={vscodeDark}
            extensions={getExtensions()}
            readOnly={true}
            editable={false}
            className={styles.editor}
          />
        </div>
      </div>
    </div>
  )
}

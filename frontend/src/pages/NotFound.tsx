import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Snippet Not Found</h1>
        <p className={styles.description}>
          The code you're looking for has been purged from the matrix or never existed. 
          Let's get you back to safety.
        </p>
        
        <div className={styles.actions}>
          <Link to="/" className={styles.homeBtn}>
            <Home size={18} /> Back to Dashboard
          </Link>
          <Link to="/gallery" className={styles.galleryBtn}>
            <Search size={18} /> Explore Gallery
          </Link>
        </div>

        <div className={styles.terminal_decor}>
          <div className={styles.decor_header}>
            <div className={styles.dots}><span/><span/><span/></div>
            <span>system_error.log</span>
          </div>
          <div className={styles.decor_content}>
            <p className={styles.line}>[ERROR] Route not defined</p>
            <p className={styles.line}>[ERROR] Memory leak detected in /null</p>
            <p className={styles.line}>[INFO] Redirecting to stable state...</p>
            <p className={styles.cursor}>_</p>
          </div>
        </div>
      </div>
    </div>
  )
}

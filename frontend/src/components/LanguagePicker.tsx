import { useState } from 'react'
import { Zap, X } from 'lucide-react'
import { LANGUAGES } from '@/lib/languages'
import styles from './LanguagePicker.module.css'

interface LanguagePickerProps {
  onSelect: (language: string, defaultCode: string) => void
  onSkip: () => void
}

export default function LanguagePicker({ onSelect, onSkip }: LanguagePickerProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div className={styles.overlay}>
      {/* Ambient background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.content}>
        {/* Skip button */}
        <button className={styles.skipBtn} onClick={onSkip} aria-label="Skip language picker">
          <X size={18} />
          Skip
        </button>

        <div className={styles.header}>
          <div className={styles.badge}>
            <Zap size={13} />
            CodeForge Compiler
          </div>
          <h1 className={styles.title}>
            Choose Your <span className={styles.gradient}>Language</span>
          </h1>
          <p className={styles.subtitle}>
            Select a language to get started — we'll load a starter template &amp; configure the editor for you.
          </p>
        </div>

        <div className={styles.grid}>
          {LANGUAGES.map((lang, index) => (
            <button
              key={lang.value}
              className={styles.card}
              style={{
                '--lang-color': lang.color,
                '--delay': `${index * 60}ms`,
              } as React.CSSProperties}
              onClick={() => onSelect(lang.value, lang.defaultCode)}
              onMouseEnter={() => setHoveredId(lang.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {(lang.value === 'javascript' || lang.value === 'python') && (
                <div className={styles.popularBadge}>Popular</div>
              )}
              <div className={styles.iconWrap}
                style={{
                  boxShadow: hoveredId === lang.id
                    ? `0 0 36px ${lang.color}55, 0 0 12px ${lang.color}33`
                    : 'none'
                }}
              >
                <img
                  src={lang.logo}
                  alt={lang.name}
                  className={styles.icon}
                  style={{ filter: lang.value === 'rust' ? 'invert(1)' : undefined }}
                />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.langName}>{lang.name}</span>
                <span className={styles.tagline}>{lang.tagline}</span>
              </div>
              {/* Glow ring on hover */}
              <div className={styles.glowRing} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

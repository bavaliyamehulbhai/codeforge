import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, Terminal, ArrowRight } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import styles from './JoinCollaboration.module.css'

export default function JoinCollaboration() {
  const [roomId, setRoomId] = useState('')
  const [recentRooms, setRecentRooms] = useState<string[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const stored = localStorage.getItem('codeforge_recent_rooms')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setRecentRooms(parsed)
      } catch (err) {
        // Ignore invalid storage data.
      }
    }
  }, [])

  const saveRecentRoom = (id: string) => {
    const next = [id, ...recentRooms.filter((room) => room !== id)].slice(0, 5)
    setRecentRooms(next)
    localStorage.setItem('codeforge_recent_rooms', JSON.stringify(next))
  }

  const normalizeRoomId = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''

    try {
      if (trimmed.includes('://')) {
        const url = new URL(trimmed)
        const param = url.searchParams.get('room')
        if (param) return param.trim()
      }
    } catch (err) {
      // Ignore invalid URLs and fall back to raw input.
    }

    const roomMatch = trimmed.match(/(?:\?|&)room=([^&#]+)/i)
    if (roomMatch?.[1]) return decodeURIComponent(roomMatch[1]).trim()

    return trimmed
  }

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault()
    const normalized = normalizeRoomId(roomId)
    if (!normalized) {
      toast('Please enter a valid Room ID', 'error')
      return
    }
    setRoomId(normalized)
    saveRecentRoom(normalized)
    navigate(`/compiler?room=${normalized}`)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setRoomId(normalizeRoomId(text))
      else toast('Clipboard is empty', 'info')
    } catch (err) {
      toast('Failed to read clipboard', 'error')
    }
  }

  const handleCreate = () => {
    const newId = Math.random().toString(36).substring(2, 9)
    saveRecentRoom(newId)
    navigate(`/compiler?room=${newId}`)
  }

  const handleCopyRoom = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      toast('Room ID copied', 'success')
    } catch (err) {
      toast('Failed to copy room ID', 'error')
    }
  }

  const handleClearRecent = () => {
    setRecentRooms([])
    localStorage.removeItem('codeforge_recent_rooms')
    toast('Recent rooms cleared', 'info')
  }

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Users size={32} className={styles.icon} />
          </div>
          <h1 className={styles.glassText}>Fusion Workspace</h1>
          <p className={styles.subtitle}>Collaborate with developers across the globe in real-time.</p>
        </div>

        <form onSubmit={handleJoin} className={styles.form}>
          <div className={styles.inputGroup}>
            <Terminal size={18} className={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Enter Room ID..." 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={styles.input}
            />
            <button type="button" className={styles.pasteBtn} onClick={handlePaste}>
              Paste
            </button>
          </div>
          
          <button type="submit" className={styles.joinBtn}>
            <span>Join Session</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button onClick={handleCreate} className={styles.createBtn}>
          <Zap size={18} />
          <span>Forge New Space</span>
        </button>

        {recentRooms.length > 0 && (
          <div className={styles.recentRooms}>
            <div className={styles.recentHeaderRow}>
              <div className={styles.recentHeader}>Recent Rooms</div>
              <button type="button" className={styles.recentClear} onClick={handleClearRecent}>
                Clear
              </button>
            </div>
            <div className={styles.recentList}>
              {recentRooms.map((room) => (
                <div
                  key={room}
                  className={styles.recentItem}
                >
                  <span className={styles.recentCode}>{room}</span>
                  <div className={styles.recentActions}>
                    <button
                      type="button"
                      className={styles.recentJoinBtn}
                      onClick={() => navigate(`/compiler?room=${room}`)}
                    >
                      Join
                    </button>
                    <button
                      type="button"
                      className={styles.recentCopyBtn}
                      onClick={() => handleCopyRoom(room)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <p>Real-time CRDT synchronization powered by CodeForge Fusion Engine.</p>
        </div>
      </div>
    </div>
  )
}

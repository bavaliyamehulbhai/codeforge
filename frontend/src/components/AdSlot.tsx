import React, { useEffect } from 'react'

interface AdSlotProps {
  id: string
  className?: string
}

export const AdSlot: React.FC<AdSlotProps> = ({ id, className }) => {
  useEffect(() => {
    // Adsterra or other ad logic would go here
    try {
      if ((window as any).atOptions) {
        // logic to re-trigger ad if needed
      }
    } catch (e) {
      console.error('Ad failed to load:', e)
    }
  }, [id])

  return (
    <div className={className} style={{ minHeight: '90px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div id={id} />
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Advertisement</span>
    </div>
  )
}

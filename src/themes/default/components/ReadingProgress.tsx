'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrollTop = window.scrollY
      const docHeight = el.scrollHeight - el.clientHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '3px', background: 'transparent', pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #a78bfa))',
        transition: 'width 0.1s linear',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  )
}

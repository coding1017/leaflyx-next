'use client'
import { useEffect, useState } from 'react'

export default function AnnouncementBar() {
  const KEY = 'leaflyx_announce_dismissed_v3'
  const [show, setShow] = useState<boolean | null>(null) // null until mounted

  useEffect(() => {
    try {
      const dismissed = typeof window !== 'undefined' && localStorage.getItem(KEY) === '1'
      setShow(!dismissed)
    } catch {
      setShow(true)
    }
  }, [])

  if (show === null || show === false) return null

  return (
    <div className="bg-[var(--brand-green)]/50 border-t border-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-neutral-200 flex items-center justify-center gap-3">
        <span>🚚 Free shipping on orders over $75 • COAs published for every batch</span>
        <button
          className="btn-outline px-2 py-0.5 text-xs"
          onClick={() => {
            try { localStorage.setItem(KEY, '1') } catch {}
            setShow(false)
          }}
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  )
}


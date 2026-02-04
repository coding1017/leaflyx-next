'use client'

import { useEffect, useState } from 'react'

/** Show every visit. Set to false if you want 30-day remember later. */
const ALWAYS_SHOW = true

function isAccepted(): boolean {
  if (ALWAYS_SHOW) return false
  if (typeof window === 'undefined') return false
  try {
    const ok = localStorage.getItem('leaflyx_age_ok') === 'true'
    const exp = Number(localStorage.getItem('leaflyx_age_exp') || 0)
    return ok && Date.now() < exp
  } catch {
    return false
  }
}

export default function AgeGate() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOpen(!isAccepted())
  }, [])

  // lock scroll while open
  useEffect(() => {
    if (!mounted) return
    const el = document.documentElement
    if (open) el.classList.add('overflow-hidden')
    else el.classList.remove('overflow-hidden')
    return () => el.classList.remove('overflow-hidden')
  }, [open, mounted])

  const onAccept = () => {
    if (!ALWAYS_SHOW) {
      const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30
      try {
        localStorage.setItem('leaflyx_age_ok', 'true')
        localStorage.setItem('leaflyx_age_exp', String(Date.now() + THIRTY_DAYS))
      } catch {}
      document.cookie = `leaflyx_age_ok=1; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`
    }
    setOpen(false)
  }

  const onDecline = () => {
    window.location.href = 'https://www.google.com'
  }

  if (!mounted || !open) return null

  return (
    <div
      className="fixed inset-0 z-[100]"
      aria-modal="true"
      role="dialog"
      aria-labelledby="age-title"
    >
      {/* Background image — use contain so it’s NOT zoomed in */}
      {/* Background image — fill the viewport, no bars */}
<div
  className="absolute inset-0 bg-center bg-cover"
  style={{
    backgroundImage: `url('/agegate_bg.png')`,
    // optional: nudge the image vertically to keep your logo visible
    backgroundPosition: 'center 42%',
  }}
/>

      {/* Slight dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Modal card (centered with breathing room) */}
      <div className="relative z-[101] min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-neutral-700 bg-[#0b1512]/90 p-10 shadow-2xl backdrop-blur-md">
          <h2
            id="age-title"
            className="text-[28px] sm:text-[34px] leading-tight font-semibold text-neutral-100 text-center"
          >
            Are you 21+?
          </h2>

          <p className="mt-3 text-center text-sm sm:text-[15px] text-neutral-300 max-w-md mx-auto">
            This website contains information on adult-use cannabis and is only intended
            to be viewed by legally qualified cannabis users.
          </p>

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button onClick={onDecline} className="btn-outline w-1/2 py-2">
              I’m under 21
            </button>
            <button onClick={onAccept} className="btn w-1/2 py-2">
              I am 21+
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

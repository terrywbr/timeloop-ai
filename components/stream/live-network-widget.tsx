'use client'

import { useEffect, useState } from 'react'
import {
  fluctuateViewerCount,
  LIVE_NETWORK_ROOMS,
  parseViewerBase,
  readLiveNetworkHiddenFromWindow,
  type LiveNetworkRoom,
} from '@/lib/live-network'

const TICK_MS = 4200

function LiveNetworkRow({ room }: { room: LiveNetworkRoom }) {
  const base = parseViewerBase(room.viewers)
  const [viewers, setViewers] = useState(base)

  useEffect(() => {
    setViewers(base)
  }, [base])

  useEffect(() => {
    if (base <= 0) return undefined
    const id = window.setInterval(() => {
      setViewers((prev) => fluctuateViewerCount(prev, base))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [base])

  return (
    <li
      className="group rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-2 transition-colors hover:border-white/12 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-white/95">
            <span className="mr-1.5">{room.icon}</span>
            {room.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-snug text-white/55">
            <span className="mr-1">{room.country_flag}</span>
            {room.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
          </span>
          <span className="text-[10px] font-medium tabular-nums text-white/70">
            {viewers} viewers
          </span>
        </div>
      </div>
    </li>
  )
}

type LiveNetworkWidgetProps = {
  /** When false, component renders nothing (e.g. URL `hidenetwork=1`). */
  visible?: boolean
}

export default function LiveNetworkWidget({ visible = true }: LiveNetworkWidgetProps) {
  const [hiddenByUrl, setHiddenByUrl] = useState(false)

  useEffect(() => {
    setHiddenByUrl(readLiveNetworkHiddenFromWindow())
  }, [])

  if (!visible || hiddenByUrl) return null

  return (
    <aside
      className="pointer-events-none absolute left-4 top-4 z-30 w-[min(92vw,15.5rem)] sm:left-5 sm:top-5"
      aria-label="Live Network"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-3">
        <header className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400/60 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 animate-breathe shadow-[0_0_10px_rgba(251,146,60,0.9)]" />
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
            🔥 LIVE NETWORK
          </h2>
        </header>

        <ul className="space-y-1.5">
          {LIVE_NETWORK_ROOMS.map((room) => (
            <LiveNetworkRow key={room.id} room={room} />
          ))}
        </ul>
      </div>
    </aside>
  )
}

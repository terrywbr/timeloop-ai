'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchLiveNetworkBoard,
  fluctuateViewerCount,
  getSeedLiveNetworkRooms,
  LIVE_NETWORK_POLL_MS,
  readLiveNetworkHiddenFromWindow,
  type LiveNetworkDataSource,
  type LiveNetworkRoomRow,
} from '@/lib/live-network'

const SEED_TICK_MS = 4200

function LiveNetworkRow({
  room,
  dataSource,
}: {
  room: LiveNetworkRoomRow
  dataSource: LiveNetworkDataSource
}) {
  const base = room.viewerCount
  const [viewers, setViewers] = useState(base)

  useEffect(() => {
    setViewers(base)
  }, [base])

  useEffect(() => {
    const isSeedRow = room.isSeed ?? dataSource === 'seed'
    if (!isSeedRow || base <= 0) return undefined
    const id = window.setInterval(() => {
      setViewers((prev) => fluctuateViewerCount(prev, base))
    }, SEED_TICK_MS)
    return () => window.clearInterval(id)
  }, [base, dataSource, room.isSeed])

  const isSeedRow = room.isSeed ?? dataSource === 'seed'
  const displayCount = isSeedRow ? viewers : base

  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight text-white/95 max-md:landscape:text-[10px]">
          <span className="mr-1.5 max-md:landscape:mr-0.5">{room.icon}</span>
          {room.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-snug text-white/55 max-md:landscape:mt-0 max-md:landscape:text-[8px] max-md:landscape:text-white/45">
          <span className="mr-1 max-md:landscape:mr-0.5">{room.country_flag}</span>
          {room.subtitle}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5 max-md:landscape:gap-0.5 max-md:landscape:pt-0">
        <span className="relative flex h-2 w-2 max-md:landscape:h-1.5 max-md:landscape:w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] max-md:landscape:h-1.5 max-md:landscape:w-1.5" />
        </span>
        <span className="text-[10px] font-medium tabular-nums text-white/70 max-md:landscape:text-[8px] max-md:landscape:text-white/55">
          <span className="max-md:landscape:hidden">{displayCount} viewers</span>
          <span className="hidden max-md:landscape:inline">{displayCount}</span>
        </span>
      </div>
    </>
  )

  if (room.streamUrl && !room.isSeed) {
    return (
      <li className="group rounded-lg border border-white/5 bg-white/[0.04] transition-colors hover:border-white/12 hover:bg-white/[0.07] max-md:landscape:rounded-md max-md:landscape:border-white/[0.04] max-md:landscape:bg-white/[0.02]">
        <a
          href={room.streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-2 px-2.5 py-2 max-md:landscape:gap-1 max-md:landscape:px-1.5 max-md:landscape:py-1"
        >
          {inner}
        </a>
      </li>
    )
  }

  return (
    <li className="group rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-2 transition-colors hover:border-white/12 hover:bg-white/[0.07] max-md:landscape:rounded-md max-md:landscape:border-white/[0.04] max-md:landscape:bg-white/[0.02] max-md:landscape:px-1.5 max-md:landscape:py-1">
      <div className="flex items-start justify-between gap-2 max-md:landscape:gap-1">{inner}</div>
    </li>
  )
}

type LiveNetworkWidgetProps = {
  /** When false, component renders nothing (e.g. URL `hidenetwork=1`). */
  visible?: boolean
}

export default function LiveNetworkWidget({ visible = true }: LiveNetworkWidgetProps) {
  const [hiddenByUrl, setHiddenByUrl] = useState(false)
  const [dataSource, setDataSource] = useState<LiveNetworkDataSource>('seed')
  const [rooms, setRooms] = useState<LiveNetworkRoomRow[]>(() => getSeedLiveNetworkRooms())

  const refresh = useCallback(async () => {
    try {
      const payload = await fetchLiveNetworkBoard()
      if (payload.success && payload.rooms?.length) {
        setDataSource(payload.dataSource ?? 'seed')
        setRooms(payload.rooms)
        return
      }
    } catch {
      // Fall through to client seed snapshot.
    }
    setDataSource('seed')
    setRooms(getSeedLiveNetworkRooms())
  }, [])

  useEffect(() => {
    setHiddenByUrl(readLiveNetworkHiddenFromWindow())
  }, [])

  useEffect(() => {
    if (!visible || hiddenByUrl) return undefined
    void refresh()
    const id = window.setInterval(() => void refresh(), LIVE_NETWORK_POLL_MS)
    return () => window.clearInterval(id)
  }, [hiddenByUrl, refresh, visible])

  if (!visible || hiddenByUrl) return null

  return (
    <aside
      className="pointer-events-none absolute left-4 top-4 z-30 w-[min(92vw,15.5rem)] sm:left-5 sm:top-5 max-md:landscape:left-2 max-md:landscape:top-2 max-md:landscape:w-[8.75rem]"
      aria-label="Live Network"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-3 max-md:landscape:rounded-lg max-md:landscape:border-white/[0.05] max-md:landscape:bg-black/15 max-md:landscape:p-1.5 max-md:landscape:shadow-[0_4px_12px_rgba(0,0,0,0.2)] max-md:landscape:backdrop-blur-[2px]">
        <header className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2 max-md:landscape:mb-1 max-md:landscape:gap-1 max-md:landscape:border-white/[0.06] max-md:landscape:pb-1">
          <span className="relative flex h-2.5 w-2.5 max-md:landscape:h-1.5 max-md:landscape:w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400/60 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 animate-breathe shadow-[0_0_10px_rgba(251,146,60,0.9)] max-md:landscape:h-1.5 max-md:landscape:w-1.5" />
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 max-md:landscape:text-[8px] max-md:landscape:tracking-[0.1em] max-md:landscape:text-white/75">
            🔥 LIVE NETWORK
          </h2>
        </header>

        <ul className="pointer-events-auto space-y-1.5 max-md:landscape:space-y-0.5">
          {rooms.map((room) => (
            <LiveNetworkRow key={room.id} dataSource={dataSource} room={room} />
          ))}
        </ul>
      </div>
    </aside>
  )
}

'use client'

import { useState } from 'react'
import { Radio, CheckCircle2, Circle, Copy } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { buildStreamModeUrl } from '@/lib/stream-mode'
import { loadCurrentStation } from '@/lib/radio-station'

type StreamerLivePanelProps = {
  rotationCount: number
  musicLabel: string
  imagesReady: boolean
  musicReady: boolean
  ready: boolean
  launchedToday: boolean
  onLaunch: () => void
}

export default function StreamerLivePanel({
  rotationCount,
  musicLabel,
  imagesReady,
  musicReady,
  ready,
  launchedToday,
  onLaunch,
}: StreamerLivePanelProps) {
  const { t } = useLanguage()
  const st = t.streamerOverlay
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    const url = buildStreamModeUrl('/', {
      stationUuid: loadCurrentStation()?.stationuuid ?? null,
    })
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(st.copyStreamUrl, url)
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-accent/25 bg-accent/5 p-3">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold text-accent">{st.oneClickLiveTitle}</span>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">{st.oneClickLiveHint}</p>
      <p className="text-[10px] leading-relaxed text-muted-foreground/80">
        {st.oneClickLiveStreamHint}
      </p>
      <p className="text-[10px] leading-relaxed text-muted-foreground/80">{st.oneClickLiveObsHint}</p>

      <div className="space-y-1.5">
        <StatusRow
          ready={imagesReady}
          label={st.oneClickLiveStatusImages.replace('{count}', String(rotationCount))}
        />
        <StatusRow
          ready={musicReady}
          label={st.oneClickLiveStatusMusic.replace('{name}', musicLabel)}
        />
      </div>

      {ready ? (
        <p className="text-[10px] font-medium text-accent">{st.oneClickLiveStatusReady}</p>
      ) : null}

      {launchedToday ? (
        <p className="text-[10px] text-muted-foreground">{st.oneClickLiveLaunchedToday}</p>
      ) : null}

      <button
        type="button"
        onClick={onLaunch}
        disabled={!ready}
        className="hover-flowing-glow flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-3 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Radio className="h-4 w-4" />
        {st.oneClickLiveButton}
      </button>

      <button
        type="button"
        onClick={() => void handleCopyUrl()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-foreground/10 bg-secondary/40 px-3 py-1.5 text-[10px] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
      >
        <Copy className="h-3 w-3" />
        {copied ? st.copyStreamUrlDone : st.copyStreamUrl}
      </button>
    </div>
  )
}

function StatusRow({ ready, label }: { ready: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      {ready ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      )}
      <span className={ready ? 'text-foreground/85' : 'text-muted-foreground'}>{label}</span>
    </div>
  )
}

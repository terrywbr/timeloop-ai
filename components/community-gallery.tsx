'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Headphones,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem } from '@/lib/scene-gallery-data'
import type { MusicChannelKey } from '@/lib/music-channels'
import { translations } from '@/lib/translations'
import type { ComponentType } from 'react'

interface CommunityGalleryProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** 點「進入此時空」：切背景 + 聯動電台（與手機抽屜共用邏輯） */
  onEnterScene?: (item: SceneGalleryItem) => void
}

const stationHintIcon: Partial<Record<MusicChannelKey, ComponentType<{ className?: string }>>> = {
  lofiChill: Headphones,
  synthNight: Radio,
  ambientForest: Sparkles,
}

export default function CommunityGallery({
  isExpanded,
  onExpandedChange,
  onEnterScene,
}: CommunityGalleryProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAdExpanded, setIsAdExpanded] = useState(false)
  const { t } = useLanguage()

  const startCollapseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onExpandedChange(false)
    }, 3000)
  }, [onExpandedChange])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onExpandedChange(true)
  }

  const handleMouseLeave = () => {
    startCollapseTimer()
  }

  const handleTouchStart = () => {
    if (!isExpanded) {
      onExpandedChange(true)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={panelRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className={`fixed right-0 top-0 z-50 hidden h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:block ${
        isExpanded ? 'w-[50vw]' : 'w-[40px]'
      }`}
    >
      <div
        className={`glass absolute inset-0 border-l border-foreground/10 transition-all duration-500 ${
          isExpanded ? 'bg-popover/70' : 'bg-popover/30'
        }`}
      />

      {!isExpanded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ChevronLeft className="h-5 w-5 animate-pulse text-foreground/50" />
        </div>
      )}

      <div
        className={`no-scrollbar relative flex h-full flex-col overflow-y-auto transition-opacity duration-300 ${
          isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="sticky top-0 z-10 glass border-b border-foreground/10 bg-popover/80 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">{t.gallery.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
          {SCENE_DATA.map((item, index) => (
            <SceneGalleryCard
              key={item.id}
              item={item}
              index={index}
              t={t}
              onEnterScene={onEnterScene}
            />
          ))}
        </div>

        <div className="sticky bottom-0 z-10 p-2">
          <div className="glass overflow-hidden rounded-xl border border-foreground/10 bg-popover/50">
            <button
              onClick={() => setIsAdExpanded(!isAdExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground/60 transition-all hover:bg-foreground/5"
            >
              <span>Sponsored</span>
              {isAdExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                isAdExpanded ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex h-[120px] items-center justify-center border-t border-foreground/5 px-3 pb-3">
                <span className="text-xs text-muted-foreground/40">Sponsored Content</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SceneGalleryCardProps {
  item: SceneGalleryItem
  index: number
  t: (typeof translations)['en']
  onEnterScene?: (item: SceneGalleryItem) => void
}

function SceneGalleryCard({ item, index, t, onEnterScene }: SceneGalleryCardProps) {
  const sponsorSlot = item.type === '贊助'
  const typeLabel = item.type === 'NFT' ? t.gallery.typeNft : t.gallery.typeSponsor

  const inner = (
    <button
      type="button"
      onClick={() => onEnterScene?.(item)}
      className="group flex w-full flex-col gap-1 text-left"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md ring-1 ring-foreground/10">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          loading="lazy"
        />

        <div className="pointer-events-none absolute left-1 top-1 flex items-center gap-1">
          <span className="rounded bg-black/65 px-1 py-px text-[8px] font-mono text-white/90">
            #{item.id}
          </span>
          <span
            className={`rounded px-1 py-px text-[8px] font-medium ${
              item.type === '贊助'
                ? 'bg-amber-500/90 text-black'
                : 'bg-accent/90 text-accent-foreground'
            }`}
          >
            {typeLabel}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />

        <div className="absolute inset-0 flex items-center justify-center p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="pointer-events-none rounded-lg border border-white/25 bg-background/55 px-2.5 py-1.5 text-[10px] font-medium text-foreground shadow-lg backdrop-blur-md transition group-hover:bg-background/70">
            {t.gallery.enterScene}
          </span>
        </div>
      </div>

      <div className="min-w-0 px-0.5">
        <p className="truncate text-[10px] font-semibold leading-tight text-foreground">{item.title}</p>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5" title={t.music.title}>
            {item.stationHints.map((key) => {
              const Icon = stationHintIcon[key] ?? Headphones
              return (
                <span
                  key={key}
                  className="flex h-4 w-4 items-center justify-center rounded-sm bg-secondary/80 text-muted-foreground ring-1 ring-foreground/10"
                  title={t.music.channels[key]}
                >
                  <Icon className="h-2.5 w-2.5" />
                </span>
              )
            })}
          </div>
          {item.type === 'NFT' ? (
            <span className="shrink-0 text-[9px] font-medium text-accent">{item.price} ETH</span>
          ) : (
            <span className="shrink-0 text-[9px] text-muted-foreground">{item.price}</span>
          )}
        </div>
      </div>
    </button>
  )

  if (sponsorSlot) {
    return (
      <div
        className={[
          'rounded-xl p-[2px]',
          'bg-gradient-to-br from-amber-100/95 via-zinc-200/90 to-amber-900/70',
          'shadow-[0_0_22px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.2)]',
          'dark:from-amber-200/40 dark:via-zinc-400/35 dark:to-amber-950/80',
          'dark:shadow-[0_0_26px_rgba(251,191,36,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]',
        ].join(' ')}
      >
        <div className="rounded-[10px] bg-popover/95 p-1 dark:bg-popover/90">{inner}</div>
      </div>
    )
  }

  return inner
}

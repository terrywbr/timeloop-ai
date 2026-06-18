'use client'

import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ImageIcon, CheckSquare, Square } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem } from '@/lib/scene-gallery-data'
import { getCommunityStrings } from '@/lib/community-i18n'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'

const ROTATION_MAX = 20

interface CommunityGalleryProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onEnterOfficialScene?: (item: SceneGalleryItem) => void
  myWorlds: PublicGeneratedWorld[]
  onEnterMyWorld: (world: PublicGeneratedWorld) => void
  canToggleRotation: boolean
  isWorldInRotation: (world: PublicGeneratedWorld) => boolean
  onToggleWorldRotation: (world: PublicGeneratedWorld) => void | Promise<void>
}

export default function CommunityGallery({
  isExpanded,
  onExpandedChange,
  onEnterOfficialScene,
  myWorlds,
  onEnterMyWorld,
  canToggleRotation,
  isWorldInRotation,
  onToggleWorldRotation,
}: CommunityGalleryProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [tab, setTab] = useState<'official' | 'my'>('my')
  const { t, language } = useLanguage()
  const ct = getCommunityStrings(language)

  const orderedMyWorlds = useMemo(
    () =>
      [...myWorlds].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [myWorlds],
  )
  const selectedRotationCount = useMemo(
    () => orderedMyWorlds.filter((world) => isWorldInRotation(world)).length,
    [orderedMyWorlds, isWorldInRotation],
  )

  const startCollapseTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onExpandedChange(false), 3000)
  }, [onExpandedChange])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        onExpandedChange(true)
      }}
      onMouseLeave={startCollapseTimer}
      onTouchStart={() => {
        if (!isExpanded) onExpandedChange(true)
      }}
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
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">{t.gallery.title}</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setTab('official')}
              className={`rounded-md px-2 py-0.5 text-[11px] transition ${
                tab === 'official'
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:bg-foreground/5'
              }`}
            >
              {ct.tabOfficial}
            </button>
            <button
              type="button"
              onClick={() => setTab('my')}
              className={`rounded-md px-2 py-0.5 text-[11px] transition ${
                tab === 'my'
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:bg-foreground/5'
              }`}
            >
              {ct.tabMine}
            </button>
          </div>
        </div>

        {tab === 'official' ? (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
            {SCENE_DATA.map((item) => (
              <OfficialSceneCard
                key={item.id}
                item={item}
                enterLabel={t.gallery.enterScene}
                onEnterScene={onEnterOfficialScene}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <p className="text-xs font-medium text-accent">{ct.myImagesTitle}</p>
            <p className="text-xs text-muted-foreground">
              {ct.rotationStats
                .replace('{selected}', String(selectedRotationCount))
                .replace('{max}', String(ROTATION_MAX))}
            </p>
            {orderedMyWorlds.length === 0 ? (
              <p className="text-xs text-muted-foreground">{ct.noMyImages}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {orderedMyWorlds.map((world) => {
                  const selected = isWorldInRotation(world)
                  return (
                    <div key={world.id} className="overflow-hidden rounded-lg border border-foreground/10">
                      <button
                        type="button"
                        onClick={() => onEnterMyWorld(world)}
                        className="group relative block aspect-video w-full text-left"
                        title={world.title}
                      >
                        <img
                          src={world.backgroundImage}
                          alt={world.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1">
                          <p className="truncate text-[11px] text-white">{world.title}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => void onToggleWorldRotation(world)}
                        disabled={!canToggleRotation}
                        className={`flex w-full items-center justify-between px-3 py-2 text-xs transition ${
                          canToggleRotation
                            ? 'bg-foreground/5 hover:bg-foreground/10'
                            : 'cursor-not-allowed bg-foreground/5 opacity-60'
                        }`}
                        title={canToggleRotation ? undefined : ct.rotationStreamerOnly}
                      >
                        <span>{selected ? ct.rotationSelected : ct.rotationSelect}</span>
                        {selected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OfficialSceneCard({
  item,
  enterLabel,
  onEnterScene,
}: {
  item: SceneGalleryItem
  enterLabel: string
  onEnterScene?: (item: SceneGalleryItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onEnterScene?.(item)}
      className="group relative aspect-video w-full overflow-hidden rounded-md ring-1 ring-foreground/10 text-left"
    >
      <img
        src={item.thumbnail}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-hover:bg-black/25">
        <span className="rounded-lg border border-white/25 bg-background/55 px-2 py-1 text-[10px] font-medium">
          {enterLabel}
        </span>
      </div>
    </button>
  )
}

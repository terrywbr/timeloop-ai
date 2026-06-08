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
import type { GalleryWorld } from '@/lib/community/types'
import { getCommunityStrings } from '@/lib/community-i18n'
import { useCommunityGallery } from '@/hooks/use-community-gallery'
import { submitWorldReport } from '@/lib/api-client'
import { GalleryWorldCard } from '@/components/community/gallery-world-card'
import { GalleryMysteryGrid } from '@/components/community/gallery-mystery-grid'
import { GALLERY_GRID_SLOT_COUNT } from '@/lib/community/gallery-grid'
import type { ComponentType } from 'react'

interface CommunityGalleryProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  accessToken: string | null
  onRequireAuth: () => void | Promise<boolean>
  onEnterOfficialScene?: (item: SceneGalleryItem) => void
  onEnterWorld?: (world: GalleryWorld) => void
  coFocusEnabled: boolean
  onCoFocusEnabledChange: (enabled: boolean) => void
  presenceCount: number
}

const stationHintIcon: Partial<Record<MusicChannelKey, ComponentType<{ className?: string }>>> = {
  lofiChill: Headphones,
  synthNight: Radio,
  ambientForest: Sparkles,
}

export default function CommunityGallery({
  isExpanded,
  onExpandedChange,
  accessToken,
  onRequireAuth,
  onEnterOfficialScene,
  onEnterWorld,
  coFocusEnabled,
  onCoFocusEnabledChange,
  presenceCount,
}: CommunityGalleryProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAdExpanded, setIsAdExpanded] = useState(false)
  const { t, language } = useLanguage()
  const ct = getCommunityStrings(language)
  const gallery = useCommunityGallery(accessToken)

  const startCollapseTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onExpandedChange(false), 3000)
  }, [onExpandedChange])

  const handleShare = useCallback((world: GalleryWorld) => {
    const url = `${window.location.origin}/world/${world.id}`
    void navigator.clipboard.writeText(url).then(() => {
      window.alert(ct.shareCopied)
    })
  }, [ct.shareCopied])

  const handleReport = useCallback(
    async (world: GalleryWorld) => {
      const ok = await onRequireAuth()
      if (!ok || !accessToken) {
        window.alert(ct.loginToInteract)
        return
      }
      const reason = window.prompt(ct.reportPrompt)
      if (!reason?.trim()) return
      try {
        await submitWorldReport(accessToken, world.id, reason.trim())
        window.alert(ct.reportThanks)
      } catch (e) {
        window.alert(e instanceof Error ? e.message : 'Report failed')
      }
    },
    [accessToken, ct, onRequireAuth],
  )

  const handleLike = useCallback(
    async (world: GalleryWorld) => {
      if (!accessToken) {
        window.alert(ct.loginToInteract)
        return
      }
      await gallery.handleLike(world)
    },
    [accessToken, ct.loginToInteract, gallery],
  )

  const handleSave = useCallback(
    async (world: GalleryWorld) => {
      if (!accessToken) {
        window.alert(ct.loginToInteract)
        return
      }
      await gallery.handleSave(world)
    },
    [accessToken, ct.loginToInteract, gallery],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const uniqueTabs = [
    { key: 'newest', label: ct.tabNewest, galleryTab: 'community' as const, sort: 'newest' as const },
    { key: 'featured', label: ct.tabFeatured, galleryTab: 'community' as const, sort: 'featured' as const },
    { key: 'following', label: ct.tabFollowing, galleryTab: 'community' as const, sort: 'following' as const },
    { key: 'official', label: ct.tabOfficial, galleryTab: 'official' as const, sort: null },
  ]

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
            {uniqueTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  gallery.setGalleryTab(tab.galleryTab)
                  if (tab.sort) gallery.setSort(tab.sort)
                }}
                className={`rounded-md px-2 py-0.5 text-[10px] transition ${
                  gallery.galleryTab === tab.galleryTab &&
                  (tab.sort === null || gallery.sort === tab.sort)
                    ? 'bg-accent/20 text-accent'
                    : 'text-muted-foreground hover:bg-foreground/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {coFocusEnabled && presenceCount > 0 ? (
            <p className="mt-2 text-[10px] text-muted-foreground">
              {ct.coFocusCount.replace('{count}', String(presenceCount))}
            </p>
          ) : null}
          <label className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={coFocusEnabled}
              onChange={(e) => onCoFocusEnabledChange(e.target.checked)}
              className="rounded border-foreground/20"
            />
            {coFocusEnabled ? ct.coFocusLeave : ct.coFocusJoin}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
          {gallery.galleryTab === 'official'
            ? SCENE_DATA.map((item) => (
                <OfficialSceneCard
                  key={item.id}
                  item={item}
                  enterLabel={t.gallery.enterScene}
                  onEnterScene={onEnterOfficialScene}
                />
              ))
            : (
              <>
                <GalleryMysteryGrid
                  worlds={gallery.worlds.slice(0, GALLERY_GRID_SLOT_COUNT)}
                  ct={ct}
                  enterLabel={t.gallery.enterScene}
                  aspectClass="aspect-video"
                  onEnter={(world) => onEnterWorld?.(world)}
                  onLike={handleLike}
                  onSave={handleSave}
                  onShare={handleShare}
                  onReport={handleReport}
                />
                {gallery.worlds.slice(GALLERY_GRID_SLOT_COUNT).map((world) => (
                  <GalleryWorldCard
                    key={world.id}
                    world={world}
                    ct={ct}
                    enterLabel={t.gallery.enterScene}
                    onEnter={() => onEnterWorld?.(world)}
                    onLike={handleLike}
                    onSave={handleSave}
                    onShare={handleShare}
                    onReport={handleReport}
                    gridCell
                    aspectClass="aspect-video"
                  />
                ))}
              </>
            )}
        </div>

        {gallery.galleryTab === 'community' && gallery.hasMore ? (
          <div className="px-4 pb-4">
            <button
              type="button"
              disabled={gallery.loading}
              onClick={() => gallery.loadMore()}
              className="w-full rounded-lg border border-foreground/10 py-2 text-xs text-muted-foreground hover:bg-foreground/5"
            >
              {gallery.loading ? '…' : 'More'}
            </button>
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10 p-2">
          <div className="glass overflow-hidden rounded-xl border border-foreground/10 bg-popover/50">
            <button
              onClick={() => setIsAdExpanded(!isAdExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground/60 transition-all hover:bg-foreground/5"
            >
              <span>Sponsored</span>
              {isAdExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
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

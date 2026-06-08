'use client'

import { useCallback } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import type { GalleryWorld } from '@/lib/community/types'
import { getCommunityStrings } from '@/lib/community-i18n'
import { useCommunityGallery } from '@/hooks/use-community-gallery'
import { submitWorldReport } from '@/lib/api-client'
import { GalleryWorldCard } from '@/components/community/gallery-world-card'
import { GalleryMysteryGrid } from '@/components/community/gallery-mystery-grid'
import { GALLERY_GRID_SLOT_COUNT } from '@/lib/community/gallery-grid'

export interface MobileGalleryContentProps {
  onClose: () => void
  accessToken: string | null
  onRequireAuth: () => void | Promise<boolean>
  onEnterOfficialScene: (item: GallerySceneItem) => void
  onEnterWorld: (world: GalleryWorld) => void
  coFocusEnabled: boolean
  onCoFocusEnabledChange: (enabled: boolean) => void
  presenceCount: number
}

export default function MobileGalleryContent({
  onClose,
  accessToken,
  onRequireAuth,
  onEnterOfficialScene,
  onEnterWorld,
  coFocusEnabled,
  onCoFocusEnabledChange,
  presenceCount,
}: MobileGalleryContentProps) {
  const { t, language } = useLanguage()
  const ct = getCommunityStrings(language)
  const gallery = useCommunityGallery(accessToken)

  const handleEnter = useCallback(
    (world: GalleryWorld) => {
      onEnterWorld(world)
      onClose()
    },
    [onClose, onEnterWorld],
  )

  const handleShare = useCallback(
    (world: GalleryWorld) => {
      const url = `${window.location.origin}/world/${world.id}`
      void navigator.clipboard.writeText(url).then(() => window.alert(ct.shareCopied))
    },
    [ct.shareCopied],
  )

  const handleReport = useCallback(
    async (world: GalleryWorld) => {
      const ok = await onRequireAuth()
      if (!ok || !accessToken) return
      const reason = window.prompt(ct.reportPrompt)
      if (!reason?.trim()) return
      await submitWorldReport(accessToken, world.id, reason.trim())
      window.alert(ct.reportThanks)
    },
    [accessToken, ct, onRequireAuth],
  )

  const tabButtons = [
    { key: 'newest', label: ct.tabNewest, galleryTab: 'community' as const, sort: 'newest' as const },
    { key: 'featured', label: ct.tabFeatured, galleryTab: 'community' as const, sort: 'featured' as const },
    { key: 'following', label: ct.tabFollowing, galleryTab: 'community' as const, sort: 'following' as const },
    { key: 'official', label: ct.tabOfficial, galleryTab: 'official' as const, sort: null },
  ]

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <ImageIcon className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.gallery.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 hover:bg-secondary/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {tabButtons.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              gallery.setGalleryTab(tab.galleryTab)
              if (tab.sort) gallery.setSort(tab.sort)
            }}
            className={`rounded-md px-2 py-1 text-[10px] ${
              gallery.galleryTab === tab.galleryTab &&
              (tab.sort === null || gallery.sort === tab.sort)
                ? 'bg-accent/20 text-accent'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={coFocusEnabled}
          onChange={(e) => onCoFocusEnabledChange(e.target.checked)}
        />
        {coFocusEnabled
          ? ct.coFocusCount.replace('{count}', String(presenceCount))
          : ct.coFocusJoin}
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {gallery.galleryTab === 'official'
          ? SCENE_DATA.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onEnterOfficialScene(item)
                  onClose()
                }}
                className="relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/10"
              >
                <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))
          : (
            <>
              <GalleryMysteryGrid
                worlds={gallery.worlds.slice(0, GALLERY_GRID_SLOT_COUNT)}
                ct={ct}
                enterLabel={t.gallery.enterScene}
                aspectClass="aspect-square"
                compact
                onEnter={handleEnter}
                onLike={async (w) => {
                  if (!accessToken) {
                    window.alert(ct.loginToInteract)
                    return
                  }
                  await gallery.handleLike(w)
                }}
                onSave={async (w) => {
                  if (!accessToken) {
                    window.alert(ct.loginToInteract)
                    return
                  }
                  await gallery.handleSave(w)
                }}
                onShare={handleShare}
                onReport={handleReport}
              />
              {gallery.worlds.slice(GALLERY_GRID_SLOT_COUNT).map((world) => (
                <GalleryWorldCard
                  key={world.id}
                  world={world}
                  ct={ct}
                  enterLabel={t.gallery.enterScene}
                  onEnter={handleEnter}
                  onLike={async (w) => {
                    if (!accessToken) {
                      window.alert(ct.loginToInteract)
                      return
                    }
                    await gallery.handleLike(w)
                  }}
                  onSave={async (w) => {
                    if (!accessToken) {
                      window.alert(ct.loginToInteract)
                      return
                    }
                    await gallery.handleSave(w)
                  }}
                  onShare={handleShare}
                  onReport={handleReport}
                  compact
                  gridCell
                  aspectClass="aspect-square"
                />
              ))}
            </>
          )}
      </div>
    </div>
  )
}

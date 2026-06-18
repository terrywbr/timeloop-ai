'use client'

import { useMemo, useState } from 'react'
import { ImageIcon, X, CheckSquare, Square } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import { getCommunityStrings } from '@/lib/community-i18n'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'

const ROTATION_MAX = 20

export interface MobileGalleryContentProps {
  onClose: () => void
  onEnterOfficialScene: (item: GallerySceneItem) => void
  myWorlds: PublicGeneratedWorld[]
  onEnterMyWorld: (world: PublicGeneratedWorld) => void
  canToggleRotation: boolean
  isWorldInRotation: (world: PublicGeneratedWorld) => boolean
  onToggleWorldRotation: (world: PublicGeneratedWorld) => void | Promise<void>
}

export default function MobileGalleryContent({
  onClose,
  onEnterOfficialScene,
  myWorlds,
  onEnterMyWorld,
  canToggleRotation,
  isWorldInRotation,
  onToggleWorldRotation,
}: MobileGalleryContentProps) {
  const { t, language } = useLanguage()
  const ct = getCommunityStrings(language)
  const [tab, setTab] = useState<'official' | 'my'>('my')
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
        <button
          type="button"
          onClick={() => setTab('official')}
          className={`rounded-md px-2 py-1 text-[10px] ${
            tab === 'official' ? 'bg-accent/20 text-accent' : 'text-muted-foreground'
          }`}
        >
          {ct.tabOfficial}
        </button>
        <button
          type="button"
          onClick={() => setTab('my')}
          className={`rounded-md px-2 py-1 text-[10px] ${
            tab === 'my' ? 'bg-accent/20 text-accent' : 'text-muted-foreground'
          }`}
        >
          {ct.tabMine}
        </button>
      </div>

      {tab === 'official' ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCENE_DATA.map((item) => (
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
            ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-accent">{ct.myImagesTitle}</p>
          <p className="text-xs text-muted-foreground">
            {ct.rotationStats
              .replace('{selected}', String(selectedRotationCount))
              .replace('{max}', String(ROTATION_MAX))}
          </p>
          {orderedMyWorlds.length === 0 ? (
            <p className="text-xs text-muted-foreground">{ct.noMyImages}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {orderedMyWorlds.map((world) => {
                const selected = isWorldInRotation(world)
                return (
                  <div key={world.id} className="overflow-hidden rounded-lg border border-foreground/10">
                    <button
                      type="button"
                      onClick={() => {
                        onEnterMyWorld(world)
                        onClose()
                      }}
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
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs ${
                        canToggleRotation ? 'bg-foreground/5' : 'cursor-not-allowed bg-foreground/5 opacity-60'
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
  )
}

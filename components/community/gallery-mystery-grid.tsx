'use client'

import type { ReactNode } from 'react'
import type { GalleryWorld } from '@/lib/community/types'
import type { CommunityStrings } from '@/lib/community-i18n'
import { GALLERY_GRID_SLOT_COUNT } from '@/lib/community/gallery-grid'
import { GalleryWorldCard } from '@/components/community/gallery-world-card'

type GalleryMysteryGridProps = {
  worlds: GalleryWorld[]
  ct: CommunityStrings
  enterLabel: string
  aspectClass?: 'aspect-video' | 'aspect-square'
  compact?: boolean
  onEnter: (world: GalleryWorld) => void
  onLike?: (world: GalleryWorld) => void
  onSave?: (world: GalleryWorld) => void
  onShare?: (world: GalleryWorld) => void
  onReport?: (world: GalleryWorld) => void
}

export function GalleryMysteryPlaceholder({
  aspectClass = 'aspect-video',
  index,
}: {
  aspectClass?: 'aspect-video' | 'aspect-square'
  index: number
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-md ring-1 ring-foreground/10 bg-foreground/[0.03] ${aspectClass}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-foreground/[0.04]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="select-none text-3xl font-light leading-none text-transparent md:text-4xl"
          style={{
            WebkitTextStroke: '1.5px rgba(255,255,255,0.22)',
            animationDelay: `${(index % 7) * 120}ms`,
          }}
        >
          ?
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(255,255,255,0.015)_6px,rgba(255,255,255,0.015)_7px)]" />
    </div>
  )
}

function GridCell({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>
}

export function GalleryMysteryGrid({
  worlds,
  ct,
  enterLabel,
  aspectClass = 'aspect-video',
  compact = false,
  onEnter,
  onLike,
  onSave,
  onShare,
  onReport,
}: GalleryMysteryGridProps) {
  const slots = Array.from({ length: GALLERY_GRID_SLOT_COUNT }, (_, index) => worlds[index] ?? null)

  return (
    <>
      {slots.map((world, index) => (
        <GridCell key={world?.id ?? `mystery-${index}`}>
          {world ? (
            <GalleryWorldCard
              world={world}
              ct={ct}
              enterLabel={enterLabel}
              onEnter={onEnter}
              onLike={onLike}
              onSave={onSave}
              onShare={onShare}
              onReport={onReport}
              compact={compact}
              gridCell
              aspectClass={aspectClass}
            />
          ) : (
            <GalleryMysteryPlaceholder aspectClass={aspectClass} index={index} />
          )}
        </GridCell>
      ))}
    </>
  )
}

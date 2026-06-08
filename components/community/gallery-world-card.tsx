'use client'

import Link from 'next/link'
import { Heart, Bookmark, Share2, Flag, Users } from 'lucide-react'
import type { GalleryWorld } from '@/lib/community/types'
import type { CommunityStrings } from '@/lib/community-i18n'

type GalleryWorldCardProps = {
  world: GalleryWorld
  ct: CommunityStrings
  enterLabel: string
  onEnter: (world: GalleryWorld) => void
  onLike?: (world: GalleryWorld) => void
  onSave?: (world: GalleryWorld) => void
  onShare?: (world: GalleryWorld) => void
  onReport?: (world: GalleryWorld) => void
  compact?: boolean
  /** Uniform grid tile — image only, like official gallery cells */
  gridCell?: boolean
  aspectClass?: 'aspect-video' | 'aspect-square'
}

export function GalleryWorldCard({
  world,
  ct,
  enterLabel,
  onEnter,
  onLike,
  onSave,
  onShare,
  onReport,
  compact,
  gridCell = false,
  aspectClass = 'aspect-video',
}: GalleryWorldCardProps) {
  const imageTile = (
    <button
      type="button"
      onClick={() => onEnter(world)}
      className={`group relative w-full overflow-hidden rounded-md ring-1 ring-foreground/10 text-left ${aspectClass}`}
    >
      <img
        src={world.backgroundImage}
        alt={world.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
        <span className="rounded-lg border border-white/25 bg-background/55 px-2 py-1 text-[10px] font-medium opacity-0 transition group-hover:opacity-100">
          {enterLabel}
        </span>
      </div>
      {world.isFeatured ? (
        <span className="absolute left-1 top-1 rounded bg-accent/90 px-1 py-px text-[8px] font-medium text-accent-foreground">
          ★
        </span>
      ) : null}
    </button>
  )

  if (gridCell) {
    return imageTile
  }

  return (
    <div className="flex flex-col gap-1">
      {imageTile}

      <div className="min-w-0 px-0.5">
        <p className="truncate text-xs font-medium text-foreground">{world.title}</p>
        <div className="flex items-center justify-between gap-1">
          {world.creatorName ? (
            <Link
              href={`/u/${world.userId}`}
              className="truncate text-[10px] text-muted-foreground hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              {world.creatorName}
            </Link>
          ) : (
            <span className="text-[10px] text-muted-foreground">{ct.creatorPage}</span>
          )}
          <span className="shrink-0 text-[9px] text-muted-foreground">
            {world.viewCount} {ct.views}
          </span>
        </div>

        {!compact ? (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              title={ct.likes}
              onClick={() => onLike?.(world)}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                world.isLiked ? 'text-red-400' : 'text-muted-foreground hover:bg-foreground/10'
              }`}
            >
              <Heart className={`h-3 w-3 ${world.isLiked ? 'fill-current' : ''}`} />
            </button>
            <span className="text-[9px] text-muted-foreground">{world.likeCount}</span>
            <button
              type="button"
              onClick={() => onSave?.(world)}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                world.isSaved ? 'text-accent' : 'text-muted-foreground hover:bg-foreground/10'
              }`}
            >
              <Bookmark className={`h-3 w-3 ${world.isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onShare?.(world)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10"
            >
              <Share2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onReport?.(world)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10"
            >
              <Flag className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CoFocusBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null
  return (
    <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-popover/60 px-2 py-0.5 text-[10px] text-muted-foreground">
      <Users className="h-3 w-3 text-accent" />
      <span>{label.replace('{count}', String(count))}</span>
    </div>
  )
}

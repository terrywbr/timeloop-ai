'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GalleryWorld, PublicWorldsSort } from '@/lib/community/types'
import {
  fetchPublicWorlds,
  toggleWorldLike,
  toggleWorldSave,
} from '@/lib/api-client'

export function useCommunityGallery(accessToken: string | null, refreshKey = 0) {
  const [sort, setSort] = useState<PublicWorldsSort>('newest')
  const [galleryTab, setGalleryTab] = useState<'community' | 'official'>('community')
  const [worlds, setWorlds] = useState<GalleryWorld[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadWorlds = useCallback(
    async (reset = false) => {
      if (galleryTab === 'official') return
      setLoading(true)
      try {
        const { worlds: fetched, nextCursor: cursor } = await fetchPublicWorlds({
          sort,
          cursor: reset ? null : nextCursor,
          accessToken,
        })
        setWorlds((prev) => (reset ? fetched : [...prev, ...fetched]))
        setNextCursor(cursor)
      } finally {
        setLoading(false)
      }
    },
    [accessToken, galleryTab, nextCursor, sort],
  )

  useEffect(() => {
    if (galleryTab !== 'community') return
    setWorlds([])
    setNextCursor(null)
    void (async () => {
      setLoading(true)
      try {
        const { worlds: fetched, nextCursor: cursor } = await fetchPublicWorlds({
          sort,
          accessToken,
        })
        setWorlds(fetched)
        setNextCursor(cursor)
      } finally {
        setLoading(false)
      }
    })()
  }, [accessToken, galleryTab, sort, refreshKey])

  const handleLike = useCallback(
    async (world: GalleryWorld) => {
      if (!accessToken) return false
      const nextLiked = !world.isLiked
      setWorlds((list) =>
        list.map((w) =>
          w.id === world.id
            ? {
                ...w,
                isLiked: nextLiked,
                likeCount: Math.max(0, w.likeCount + (nextLiked ? 1 : -1)),
              }
            : w,
        ),
      )
      try {
        await toggleWorldLike(accessToken, world.id, nextLiked)
        return true
      } catch {
        setWorlds((list) =>
          list.map((w) => (w.id === world.id ? world : w)),
        )
        return false
      }
    },
    [accessToken],
  )

  const handleSave = useCallback(
    async (world: GalleryWorld) => {
      if (!accessToken) return false
      const nextSaved = !world.isSaved
      setWorlds((list) =>
        list.map((w) => (w.id === world.id ? { ...w, isSaved: nextSaved } : w)),
      )
      try {
        await toggleWorldSave(accessToken, world.id, nextSaved)
        return true
      } catch {
        setWorlds((list) =>
          list.map((w) => (w.id === world.id ? world : w)),
        )
        return false
      }
    },
    [accessToken],
  )

  return {
    sort,
    setSort,
    galleryTab,
    setGalleryTab,
    worlds,
    loading,
    loadMore: () => void loadWorlds(false),
    hasMore: Boolean(nextCursor),
    handleLike,
    handleSave,
  }
}

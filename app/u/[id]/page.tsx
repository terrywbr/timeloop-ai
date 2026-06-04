'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LanguageProvider, useLanguage } from '@/lib/language-context'
import { getCommunityStrings } from '@/lib/community-i18n'
import {
  fetchCreatorProfile,
  toggleFollowUser,
} from '@/lib/api-client'
import type { CreatorProfile } from '@/lib/community/types'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { GalleryWorldCard } from '@/components/community/gallery-world-card'

function CreatorPageInner() {
  const params = useParams()
  const userId = typeof params.id === 'string' ? params.id : ''
  const { language, t } = useLanguage()
  const ct = getCommunityStrings(language)
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient()
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data.session?.access_token ?? null)
      })
    } catch {
      setAccessToken(null)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    void (async () => {
      setLoading(true)
      const data = await fetchCreatorProfile(userId, accessToken)
      setProfile(data)
      setLoading(false)
    })()
  }, [accessToken, userId])

  const handleFollow = async () => {
    if (!accessToken || !profile) return
    const next = !profile.isFollowing
    await toggleFollowUser(accessToken, userId, next)
    setProfile({ ...profile, isFollowing: next })
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-8 text-zinc-400">Loading…</div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-zinc-950 p-8 text-zinc-400">Creator not found.</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/" className="text-sm text-accent hover:underline">
          ← {t.title}
        </Link>

        <header className="mt-6 flex items-center gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full ring-2 ring-accent/30"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-xl">
              {(profile.displayName ?? '?')[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{profile.displayName ?? ct.creatorPage}</h1>
            <p className="text-sm text-zinc-400">
              {profile.publicWorldCount} worlds · {profile.totalLikes} {ct.likes}
            </p>
            {accessToken ? (
              <button
                type="button"
                onClick={() => void handleFollow()}
                className="mt-2 rounded-lg border border-zinc-700 px-3 py-1 text-xs hover:border-accent"
              >
                {profile.isFollowing ? ct.unfollow : ct.follow}
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.worlds.map((world) => (
            <GalleryWorldCard
              key={world.id}
              world={world}
              ct={ct}
              enterLabel={t.gallery.enterScene}
              onEnter={() => {
                window.location.href = `/?world=${world.id}`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CreatorPage() {
  return (
    <LanguageProvider>
      <CreatorPageInner />
    </LanguageProvider>
  )
}

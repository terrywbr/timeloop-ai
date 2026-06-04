'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function WorldSharePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''

  useEffect(() => {
    if (!id) {
      router.replace('/')
      return
    }
    router.replace(`/?world=${encodeURIComponent(id)}`)
  }, [id, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
      Entering timeline…
    </div>
  )
}

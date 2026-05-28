'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in with Google…')

  useEffect(() => {
    let mounted = true

    const finishSignIn = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorDescription = params.get('error_description')

        if (errorDescription) {
          if (mounted) setMessage(decodeURIComponent(errorDescription))
          return
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            if (mounted) setMessage(error.message)
            return
          }
        } else {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            if (mounted) setMessage(error.message)
            return
          }
          if (!data.session) {
            if (mounted) setMessage('Sign-in could not be completed. Please try again.')
            return
          }
        }

        router.replace('/')
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : 'Sign-in failed'
        if (mounted) setMessage(text)
      }
    }

    void finishSignIn()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06070c] px-4 text-center text-sm text-foreground/80">
      <div className="glass max-w-sm rounded-2xl border border-foreground/10 bg-popover/80 px-6 py-8 shadow-[0_0_32px_rgba(80,180,255,0.15)]">
        <p>{message}</p>
      </div>
    </main>
  )
}

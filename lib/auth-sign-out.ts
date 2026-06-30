import type { SupabaseClient } from '@supabase/supabase-js'
import { resetSupabaseBrowserClient } from '@/lib/supabase-client'

const TIMELoop_PREFIX = 'timeloop'

/** Clear app session keys; Supabase auth tokens are removed by signOut(). */
export function clearTimeloopClientStorage() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.clear()
  } catch {
    // Ignore private mode / security errors.
  }

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(TIMELoop_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore storage errors.
  }
}

export async function signOutAndRedirect(supabase: SupabaseClient, redirectTo = '/') {
  const { error } = await supabase.auth.signOut()
  if (error) throw error

  clearTimeloopClientStorage()
  resetSupabaseBrowserClient()

  window.location.href = redirectTo
}

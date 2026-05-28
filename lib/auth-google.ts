import type { SupabaseClient } from '@supabase/supabase-js'

export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') return '/auth/callback'
  return `${window.location.origin}/auth/callback`
}

export async function signInWithGoogle(supabase: SupabaseClient) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  })
}

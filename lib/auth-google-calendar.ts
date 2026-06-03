import { getAuthCallbackUrl } from '@/lib/auth-google'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function signInWithGoogleCalendar(supabase: SupabaseClient) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
      scopes: 'https://www.googleapis.com/auth/calendar.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}

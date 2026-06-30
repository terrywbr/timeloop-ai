import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { resolveLiveNetworkPayload } from '@/lib/live-network-server'

export const runtime = 'nodejs'

/** Public Live Network board — seed placeholders until streamers go live. */
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient()
    const payload = await resolveLiveNetworkPayload(supabase)
    return NextResponse.json({ success: true, ...payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown live network error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

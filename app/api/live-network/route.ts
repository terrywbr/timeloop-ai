import { NextResponse } from 'next/server'
import { getSeedLiveNetworkRooms } from '@/lib/live-network-seed'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { resolveLiveNetworkPayload } from '@/lib/live-network-server'

export const runtime = 'nodejs'

function seedFallbackPayload() {
  return {
    success: true as const,
    dataSource: 'seed' as const,
    updatedAt: new Date().toISOString(),
    rooms: getSeedLiveNetworkRooms(),
  }
}

/** Public Live Network board — seed placeholders until streamers go live. */
export async function GET() {
  try {
    let supabase = null
    try {
      supabase = createSupabaseAdminClient()
    } catch (error) {
      console.warn('[api/live-network] Supabase unavailable, returning seed board', error)
      return NextResponse.json(seedFallbackPayload())
    }

    const payload = await resolveLiveNetworkPayload(supabase)
    return NextResponse.json({ success: true, ...payload })
  } catch (error) {
    console.warn('[api/live-network] board failed, returning seed board', error)
    return NextResponse.json(seedFallbackPayload())
  }
}

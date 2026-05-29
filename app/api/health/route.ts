import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const runTests = url.searchParams.get('test') === '1'

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  const togetherKey = readEnv('TOGETHER_API_KEY')

  const report: Record<string, unknown> = {
    ok: true,
    env: {
      together: Boolean(togetherKey),
      replicate: Boolean(readEnv('REPLICATE_API_TOKEN')),
      supabaseService: Boolean(supabaseServiceKey),
      supabaseUrl: Boolean(supabaseUrl),
      supabaseAnon: Boolean(readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
      togetherKeyLength: togetherKey?.length ?? 0,
      supabaseServiceKeyLength: supabaseServiceKey?.length ?? 0,
      supabaseServicePrefix: supabaseServiceKey?.slice(0, 10) ?? '',
    },
  }

  if (runTests) {
    const tests: Record<string, unknown> = {}

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseRes = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      })
      tests.supabaseRestStatus = supabaseRes.status
      tests.supabaseRestOk = supabaseRes.ok
    }

    if (togetherKey) {
      const togetherRes = await fetch('https://api.together.xyz/v1/models', {
        headers: { Authorization: `Bearer ${togetherKey}` },
      })
      tests.togetherStatus = togetherRes.status
      tests.togetherOk = togetherRes.ok
    }

    report.tests = tests
  }

  return NextResponse.json(report)
}

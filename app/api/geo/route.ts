import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const country =
    req.headers.get('cf-ipcountry') ??
    req.headers.get('CF-IPCountry') ??
    'XX'

  const normalized = country.toUpperCase()
  const suggestCn = normalized === 'CN'

  return NextResponse.json({
    success: true,
    country: normalized,
    suggestCn,
  })
}

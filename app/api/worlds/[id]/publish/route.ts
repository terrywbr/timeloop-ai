import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, context: RouteContext) {
  void req
  void context
  return NextResponse.json(
    { success: false, error: 'Publish feature has been retired. All generated worlds are private.' },
    { status: 410 },
  )
}

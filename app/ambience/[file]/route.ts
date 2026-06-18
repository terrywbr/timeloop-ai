const LEGACY_AMBIENCE_REDIRECTS: Record<string, string> = {
  'neon-rain.mp3': '/ambience/neon-rain.wav',
  'cosmic-low-hum.mp3': '/ambience/cosmic-low-hum.wav',
  'deep-ocean-drone.mp3': '/ambience/deep-ocean-drone.wav',
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const redirectTo = LEGACY_AMBIENCE_REDIRECTS[file]
  if (!redirectTo) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: redirectTo,
    },
  })
}

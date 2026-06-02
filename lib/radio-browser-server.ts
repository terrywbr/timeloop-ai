const RADIO_BROWSER_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
]

const USER_AGENT = 'TimeLoopAI/1.0 (https://app.timeloopai.net)'

export type RadioBrowserStation = {
  stationuuid: string
  name: string
  url: string
  url_resolved: string
  tags: string
  country: string
  lastcheckok: number
  votes: number
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

async function fetchFromRadioBrowser(path: string): Promise<Response> {
  let lastError: unknown
  for (const base of RADIO_BROWSER_SERVERS) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 0 },
      })
      if (response.ok) return response
    } catch (error) {
      lastError = error
    }
  }
  throw lastError ?? new Error('Radio Browser unavailable')
}

export async function searchStationsByTag(tag: string, limit = 50): Promise<RadioBrowserStation[]> {
  const response = await fetchFromRadioBrowser(
    `/json/stations/search?tag=${encodeURIComponent(tag)}&codec=MP3&hidebroken=true&limit=${limit}&order=votes&reverse=true`,
  )
  const data = (await response.json()) as RadioBrowserStation[]
  return Array.isArray(data) ? data : []
}

export async function fetchRandomStationByTags(
  tags: string[],
  excludeUuids: string[] = [],
): Promise<RadioBrowserStation | null> {
  const exclude = new Set(excludeUuids)
  const shuffledTags = [...tags].sort(() => Math.random() - 0.5)

  for (const tag of shuffledTags) {
    const stations = await searchStationsByTag(tag, 50)
    const viable = stations.filter(
      (s) =>
        s.lastcheckok === 1 &&
        s.url_resolved &&
        s.url_resolved.startsWith('http') &&
        !exclude.has(s.stationuuid),
    )
    const picked = pickRandom(viable)
    if (picked) return picked
  }

  return null
}

export async function reportStationClick(stationuuid: string): Promise<void> {
  try {
    await fetchFromRadioBrowser(
      `/json/url/${stationuuid}?base=${encodeURIComponent('https://app.timeloopai.net')}`,
    )
  } catch {
    // Non-critical
  }
}

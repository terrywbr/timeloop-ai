export type MusicMoodId =
  | 'neon-tokyo'
  | 'deep-night'
  | 'deep-space'
  | 'galactic-tavern'
  | 'galactic-classical'
  | 'retro-earth'

export type MoodDefaultStation = {
  stationuuid: string
  name: string
  urlResolved: string
}

export type MusicMoodConfig = {
  id: MusicMoodId
  tags: string[]
  defaultStation: MoodDefaultStation
}

/** Curated stable defaults (SomaFM / verified streams). Radio Browser UUIDs where known. */
export const MUSIC_MOODS: MusicMoodConfig[] = [
  {
    id: 'neon-tokyo',
    tags: ['synthwave', 'cyberpunk', 'electronic'],
    defaultStation: {
      stationuuid: 'default-neon-tokyo',
      name: 'Synphaera Radio',
      urlResolved: 'https://ice1.somafm.com/synphaera-128-mp3',
    },
  },
  {
    id: 'deep-night',
    tags: ['lofi', 'chillhop', 'chill'],
    defaultStation: {
      stationuuid: 'default-deep-night',
      name: 'Groove Salad',
      urlResolved: 'https://ice1.somafm.com/groovesalad-256-mp3',
    },
  },
  {
    id: 'deep-space',
    tags: ['ambient', 'drone', 'space'],
    defaultStation: {
      stationuuid: 'default-deep-space',
      name: 'Drone Zone',
      urlResolved: 'https://ice1.somafm.com/dronezone-128-mp3',
    },
  },
  {
    id: 'galactic-tavern',
    tags: ['jazz', 'blues'],
    defaultStation: {
      stationuuid: 'default-galactic-tavern',
      name: 'Secret Agent',
      urlResolved: 'https://ice1.somafm.com/secretagent-128-mp3',
    },
  },
  {
    id: 'galactic-classical',
    tags: ['classical', 'piano'],
    defaultStation: {
      stationuuid: 'default-galactic-classical',
      name: 'Lush',
      urlResolved: 'https://ice1.somafm.com/lush-128-mp3',
    },
  },
  {
    id: 'retro-earth',
    tags: ['80s', '90s', 'retro'],
    defaultStation: {
      stationuuid: 'default-retro-earth',
      name: 'PopTron',
      urlResolved: 'https://ice1.somafm.com/poptron-128-mp3',
    },
  },
]

export const MUSIC_MOOD_IDS = MUSIC_MOODS.map((m) => m.id)

export const MUSIC_MOOD_BY_ID = Object.fromEntries(
  MUSIC_MOODS.map((m) => [m.id, m]),
) as Record<MusicMoodId, MusicMoodConfig>

export function isMusicMoodId(value: string): value is MusicMoodId {
  return MUSIC_MOOD_IDS.includes(value as MusicMoodId)
}

export function getTagsForMoods(moodIds: MusicMoodId[]): string[] {
  const tags = new Set<string>()
  for (const id of moodIds) {
    for (const tag of MUSIC_MOOD_BY_ID[id]?.tags ?? []) {
      tags.add(tag)
    }
  }
  return [...tags]
}

export function pickRandomMood(moodIds: MusicMoodId[]): MusicMoodId {
  return moodIds[Math.floor(Math.random() * moodIds.length)] ?? 'deep-night'
}

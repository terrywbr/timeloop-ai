import type { MusicMoodId } from './music-moods'

export { AMBIENT_WORLDS } from './ambient-worlds'
export type { AmbientWorldConfig, AmbientWorldId } from './ambient-worlds'

export const WORLD_MUSIC_MOODS: Record<import('./ambient-worlds').AmbientWorldId, MusicMoodId> = {
  cyberpunk: 'neon-tokyo',
  'cosmic-dust': 'deep-space',
  'deep-ocean': 'deep-night',
}

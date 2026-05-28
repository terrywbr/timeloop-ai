import type { MusicChannelKey } from './music-channels'

export { AMBIENT_WORLDS } from './ambient-worlds'
export type { AmbientWorldConfig, AmbientWorldId } from './ambient-worlds'

export const WORLD_MUSIC_CHANNELS: Record<import('./ambient-worlds').AmbientWorldId, MusicChannelKey> = {
  cyberpunk: 'synthNight',
  'cosmic-dust': 'ambientForest',
  'deep-ocean': 'lofiChill',
}

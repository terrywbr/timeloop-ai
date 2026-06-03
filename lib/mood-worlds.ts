import type { MusicMoodId } from '@/lib/music-moods'
import { AMBIENT_WORLDS } from '@/lib/ambient-worlds'

export type MoodWorldConfig = {
  id: MusicMoodId
  backgroundImage: string
  depthMap: string
  particlePreset: string
  shaderPreset: string
  ambienceAudio: string
}

const cyberpunk = AMBIENT_WORLDS.find((w) => w.id === 'cyberpunk')!
const cosmic = AMBIENT_WORLDS.find((w) => w.id === 'cosmic-dust')!
const deepOcean = AMBIENT_WORLDS.find((w) => w.id === 'deep-ocean')!

/** Phase 2a: reuse 3 legacy asset sets + distinct particles per mood. */
export const MOOD_WORLDS: Record<MusicMoodId, MoodWorldConfig> = {
  'neon-tokyo': {
    id: 'neon-tokyo',
    backgroundImage: cyberpunk.backgroundImage,
    depthMap: cyberpunk.depthMap,
    particlePreset: 'rain-neon-dust',
    shaderPreset: cyberpunk.shaderPreset,
    ambienceAudio: 'mood-neon-tokyo-ambience',
  },
  'deep-night': {
    id: 'deep-night',
    backgroundImage: cosmic.backgroundImage,
    depthMap: cosmic.depthMap,
    particlePreset: 'cosmic-dust',
    shaderPreset: cosmic.shaderPreset,
    ambienceAudio: 'mood-deep-night-ambience',
  },
  'deep-space': {
    id: 'deep-space',
    backgroundImage: deepOcean.backgroundImage || cosmic.backgroundImage,
    depthMap: deepOcean.depthMap || cosmic.depthMap,
    particlePreset: 'underwater-mist',
    shaderPreset: deepOcean.shaderPreset,
    ambienceAudio: 'mood-deep-space-ambience',
  },
  'galactic-tavern': {
    id: 'galactic-tavern',
    backgroundImage: cyberpunk.backgroundImage,
    depthMap: cyberpunk.depthMap,
    particlePreset: 'jazz-golden-dust',
    shaderPreset: 'blade-runner-bloom',
    ambienceAudio: 'mood-galactic-tavern-ambience',
  },
  'galactic-classical': {
    id: 'galactic-classical',
    backgroundImage: cosmic.backgroundImage,
    depthMap: cosmic.depthMap,
    particlePreset: 'nordic-snow-dust',
    shaderPreset: cosmic.shaderPreset,
    ambienceAudio: 'mood-galactic-classical-ambience',
  },
  'retro-earth': {
    id: 'retro-earth',
    backgroundImage: cosmic.backgroundImage,
    depthMap: cosmic.depthMap,
    particlePreset: 'campfire-embers',
    shaderPreset: cosmic.shaderPreset,
    ambienceAudio: 'mood-retro-earth-ambience',
  },
}

export function getMoodWorld(moodId: MusicMoodId): MoodWorldConfig {
  return MOOD_WORLDS[moodId]
}

export function resolveMoodWorldLayer(moodId: MusicMoodId) {
  const world = getMoodWorld(moodId)
  return {
    key: `mood:${moodId}:${world.particlePreset}`,
    backgroundImage: world.backgroundImage,
    depthMap: world.depthMap,
    particlePreset: world.particlePreset,
    shaderPreset: world.shaderPreset,
    ambienceAudio: world.ambienceAudio,
    isActive: true,
  }
}

import { AMBIENT_WORLDS } from '@/lib/worlds'

const SCENE_TO_PARTICLE_PRESET: Record<string, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'cosmic-dust',
  space: 'cosmic-dust',
  ocean: 'underwater-mist',
  city: 'cyberpunk',
  desert: 'cosmic-dust',
}

const SCENE_TO_WORLD_ID: Record<string, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'cosmic-dust',
  space: 'cosmic-dust',
  ocean: 'deep-ocean',
  city: 'cyberpunk',
  desert: 'deep-ocean',
}

export function resolvePresetWorld(worldId: string, sceneKey?: string) {
  const presetById = AMBIENT_WORLDS.find((world) => world.id === worldId)
  if (presetById) return presetById

  const mappedWorldId = sceneKey ? SCENE_TO_WORLD_ID[sceneKey] : undefined
  if (mappedWorldId) {
    const presetByScene = AMBIENT_WORLDS.find((world) => world.id === mappedWorldId)
    if (presetByScene) return presetByScene
  }

  return AMBIENT_WORLDS[0]
}

export function resolveParticlePreset(sceneKey: string | undefined, fallback: string) {
  if (!sceneKey) return fallback
  return SCENE_TO_PARTICLE_PRESET[sceneKey] ?? sceneKey ?? fallback
}

import { AMBIENT_WORLDS } from '@/lib/worlds'

export type VisualEffectSceneKey = 'cyberpunk' | 'nature' | 'space' | 'ocean' | 'city' | 'desert'

export const VISUAL_EFFECT_SCENE_KEYS: VisualEffectSceneKey[] = [
  'cyberpunk',
  'nature',
  'space',
  'ocean',
  'city',
  'desert',
]

const SCENE_TO_PARTICLE_PRESET: Record<VisualEffectSceneKey, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'nature-leaves',
  space: 'cosmic-dust',
  ocean: 'underwater-mist',
  city: 'city-light-streaks',
  desert: 'desert-sand-mist',
}

const SCENE_TO_WORLD_ID: Record<VisualEffectSceneKey, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'cosmic-dust',
  space: 'cosmic-dust',
  ocean: 'deep-ocean',
  city: 'cyberpunk',
  desert: 'deep-ocean',
}

export function isVisualEffectSceneKey(value: string): value is VisualEffectSceneKey {
  return VISUAL_EFFECT_SCENE_KEYS.includes(value as VisualEffectSceneKey)
}

export function normalizeVisualEffectScene(value: string | undefined): VisualEffectSceneKey {
  if (value && isVisualEffectSceneKey(value)) return value
  return 'cyberpunk'
}

export function resolvePresetWorld(worldId: string, sceneKey?: string) {
  const presetById = AMBIENT_WORLDS.find((world) => world.id === worldId)
  if (presetById) return presetById

  const mappedWorldId = sceneKey && isVisualEffectSceneKey(sceneKey) ? SCENE_TO_WORLD_ID[sceneKey] : undefined
  if (mappedWorldId) {
    const presetByScene = AMBIENT_WORLDS.find((world) => world.id === mappedWorldId)
    if (presetByScene) return presetByScene
  }

  return AMBIENT_WORLDS[0]
}

export function resolveParticlePreset(sceneKey: string | undefined, fallback: string) {
  if (sceneKey && isVisualEffectSceneKey(sceneKey)) {
    return SCENE_TO_PARTICLE_PRESET[sceneKey]
  }
  if (sceneKey) return sceneKey
  return fallback
}

export type AmbientWorldId = 'cyberpunk' | 'cosmic-dust' | 'deep-ocean'

export interface AmbientWorldConfig {
  id: AmbientWorldId
  title: string
  backgroundImage: string
  depthMap: string
  particlePreset: string
  shaderPreset: string
  colorProfile: string
  ambienceAudio: string
}

export const AMBIENT_WORLDS: AmbientWorldConfig[] = [
  {
    id: 'cyberpunk',
    title: 'Neon Rain District',
    backgroundImage: '/cyberpunk-bg.jpg',
    depthMap: '/cyberpunk-depth.jpg',
    particlePreset: 'rain-neon-dust',
    shaderPreset: 'blade-runner-bloom',
    colorProfile: 'cyan-magenta-night',
    ambienceAudio: 'neon-rain-ambience',
  },
  {
    id: 'cosmic-dust',
    title: 'Cosmic Dust Field',
    backgroundImage: '/cosmic-bg.jpg',
    depthMap: '/cosmic-depth.jpg',
    particlePreset: 'cosmic-dust',
    shaderPreset: 'slow-cosmic-parallax',
    colorProfile: 'violet-deep-space',
    ambienceAudio: 'cosmic-low-hum',
  },
  {
    id: 'deep-ocean',
    title: 'Deep Ocean Drift',
    backgroundImage: '',
    depthMap: '',
    particlePreset: 'underwater-mist',
    shaderPreset: 'subsurface-caustics',
    colorProfile: 'blue-teal-abyss',
    ambienceAudio: 'deep-ocean-drone',
  },
]

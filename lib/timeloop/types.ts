export type GalleryWorldAssets = {
  backgroundImage: string
  depthMap: string
  particlePreset?: string
}

export type AmbientWorldLayer = GalleryWorldAssets & {
  key: string
  particlePreset: string
  shaderPreset: string
  ambienceAudio: string
  isActive: boolean
}

export type UserGeneratedWorld = {
  id: string
  title: string
  backgroundImage: string
  depthMap: string
  particlePreset: string
}

export type GenerateApiResponse =
  | { success: true; world: UserGeneratedWorld }
  | { success: false; error: string }

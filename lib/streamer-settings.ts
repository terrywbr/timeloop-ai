export type StreamOverlayPosition = 'tl' | 'tr' | 'bl' | 'br'

export type StreamerOverlaySettings = {
  enabled: boolean
  line1: string
  line2: string
  position: StreamOverlayPosition
  opacity: number
}

export type StreamerSettings = {
  overlay: StreamerOverlaySettings
  backgroundRotationMinutes: 5 | 10
}

export const DEFAULT_STREAMER_OVERLAY: StreamerOverlaySettings = {
  enabled: true,
  line1: '',
  line2: '',
  position: 'bl',
  opacity: 0.85,
}

export const DEFAULT_STREAMER_SETTINGS: StreamerSettings = {
  overlay: DEFAULT_STREAMER_OVERLAY,
  backgroundRotationMinutes: 5,
}

export function normalizeStreamerSettings(raw: Partial<StreamerSettings> | null | undefined): StreamerSettings {
  const overlay: Partial<StreamerOverlaySettings> = raw?.overlay ?? {}
  const opacity = typeof overlay.opacity === 'number' ? overlay.opacity : DEFAULT_STREAMER_OVERLAY.opacity
  return {
    overlay: {
      enabled: overlay.enabled ?? DEFAULT_STREAMER_OVERLAY.enabled,
      line1: overlay.line1 ?? DEFAULT_STREAMER_OVERLAY.line1,
      line2: overlay.line2 ?? DEFAULT_STREAMER_OVERLAY.line2,
      position: overlay.position ?? DEFAULT_STREAMER_OVERLAY.position,
      opacity: Math.min(1, Math.max(0.3, opacity)),
    },
    backgroundRotationMinutes: raw?.backgroundRotationMinutes === 10 ? 10 : 5,
  }
}

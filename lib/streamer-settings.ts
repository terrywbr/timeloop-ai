export type StreamerSettings = {
  backgroundRotationMinutes: 5 | 10
}

export const DEFAULT_STREAMER_SETTINGS: StreamerSettings = {
  backgroundRotationMinutes: 5,
}

export function normalizeStreamerSettings(raw: Partial<StreamerSettings> | null | undefined): StreamerSettings {
  return {
    backgroundRotationMinutes: raw?.backgroundRotationMinutes === 10 ? 10 : 5,
  }
}

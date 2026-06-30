/** Streamer must heartbeat within this window to stay on the Live Network board. */
export const STREAMER_PRESENCE_STALE_MS = 5 * 60 * 1000

/** Viewer sessions older than this are excluded from viewer_count. */
export const VIEWER_PRESENCE_STALE_MS = 2 * 60 * 1000

/** Client interval for streamer/viewer heartbeats in ?stream=1. */
export const LIVE_NETWORK_HEARTBEAT_MS = 30_000

export function streamerPresenceCutoffIso(nowMs = Date.now()): string {
  return new Date(nowMs - STREAMER_PRESENCE_STALE_MS).toISOString()
}

export function viewerPresenceCutoffIso(nowMs = Date.now()): string {
  return new Date(nowMs - VIEWER_PRESENCE_STALE_MS).toISOString()
}

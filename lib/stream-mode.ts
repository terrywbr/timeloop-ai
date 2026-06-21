export function isStreamModeFromSearch(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('stream') === '1'
}

export function readStreamModeFromWindow(): boolean {
  if (typeof window === 'undefined') return false
  return isStreamModeFromSearch(window.location.search)
}

/** OBS browser source URL on the current origin. */
export function buildStreamModeUrl(pathname = '/') {
  if (typeof window === 'undefined') {
    return `${pathname}?stream=1`
  }
  const url = new URL(pathname, window.location.origin)
  url.searchParams.set('stream', '1')
  return url.toString()
}

const STREAM_POPOUT_NAME = 'timeloop-stream'
const STREAM_POPOUT_WIDTH = 1920
const STREAM_POPOUT_HEIGHT = 1080

/** Open a dedicated 1920×1080 window for OBS Browser Source capture. */
export function openStreamModePopout(url: string) {
  if (typeof window === 'undefined') return null

  const left = Math.max(0, window.screenX + Math.round((window.outerWidth - STREAM_POPOUT_WIDTH) / 2))
  const top = Math.max(0, window.screenY + Math.round((window.outerHeight - STREAM_POPOUT_HEIGHT) / 2))
  const features = [
    'popup=yes',
    'noopener=yes',
    'noreferrer=yes',
    `width=${STREAM_POPOUT_WIDTH}`,
    `height=${STREAM_POPOUT_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
  ].join(',')

  const popout = window.open(url, STREAM_POPOUT_NAME, features)
  if (popout) {
    popout.focus()
  }
  return popout
}

const STREAMER_LIVE_LAUNCH_DATE_KEY = 'timeloop.streamer.liveLaunchDate'

function todayDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export function readStreamerLiveLaunchedToday() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STREAMER_LIVE_LAUNCH_DATE_KEY) === todayDateKey()
  } catch {
    return false
  }
}

export function markStreamerLiveLaunchedToday() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STREAMER_LIVE_LAUNCH_DATE_KEY, todayDateKey())
  } catch {
    // Ignore local storage write errors in private/incognito contexts.
  }
}

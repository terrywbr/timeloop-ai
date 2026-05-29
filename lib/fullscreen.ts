type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  msFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

export function getFullscreenElement() {
  if (typeof document === 'undefined') return null
  const doc = document as FullscreenDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null
}

export function requestAppFullscreen() {
  if (typeof document === 'undefined') return Promise.resolve()

  if (getFullscreenElement()) return Promise.resolve()

  const el = document.documentElement as FullscreenElement
  const request =
    el.requestFullscreen?.bind(el) ??
    el.webkitRequestFullscreen?.bind(el) ??
    el.msRequestFullscreen?.bind(el)

  if (!request) return Promise.resolve()

  return Promise.resolve(request()).catch(() => undefined)
}

export function exitAppFullscreen() {
  if (typeof document === 'undefined') return Promise.resolve()

  const doc = document as FullscreenDocument
  const exit =
    doc.exitFullscreen?.bind(doc) ??
    doc.webkitExitFullscreen?.bind(doc) ??
    doc.msExitFullscreen?.bind(doc)

  if (!exit) return Promise.resolve()

  return Promise.resolve(exit()).catch(() => undefined)
}

export function toggleAppFullscreen() {
  if (getFullscreenElement()) {
    return exitAppFullscreen()
  }
  return requestAppFullscreen()
}

export function subscribeFullscreenChange(callback: () => void) {
  if (typeof document === 'undefined') return () => undefined

  const events = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'] as const
  events.forEach((event) => document.addEventListener(event, callback))

  return () => {
    events.forEach((event) => document.removeEventListener(event, callback))
  }
}

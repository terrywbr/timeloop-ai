'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768

function subscribeMobile(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener('change', callback)
  window.addEventListener('resize', callback)
  return () => {
    mql.removeEventListener('change', callback)
    window.removeEventListener('resize', callback)
  }
}

function getIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getIsMobile, getServerMobileSnapshot)
}

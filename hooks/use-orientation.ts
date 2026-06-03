'use client'

import { useSyncExternalStore } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

function subscribeOrientation(callback: () => void) {
  window.addEventListener('resize', callback)
  window.addEventListener('orientationchange', callback)
  const portraitQuery = window.matchMedia('(orientation: portrait)')
  portraitQuery.addEventListener('change', callback)
  return () => {
    window.removeEventListener('resize', callback)
    window.removeEventListener('orientationchange', callback)
    portraitQuery.removeEventListener('change', callback)
  }
}

function getIsPortrait() {
  return window.matchMedia('(orientation: portrait)').matches
}

function getServerPortraitSnapshot() {
  return false
}

export function useOrientation() {
  const isMobile = useIsMobile()
  const isPortrait = useSyncExternalStore(subscribeOrientation, getIsPortrait, getServerPortraitSnapshot)

  return {
    isPortrait,
    isLandscape: !isPortrait,
    isMobilePortrait: isMobile && isPortrait,
    isMobileLandscape: isMobile && !isPortrait,
  }
}

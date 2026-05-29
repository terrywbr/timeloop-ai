import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

function readIsPortrait() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(orientation: portrait)').matches
}

export function useOrientation() {
  const isMobile = useIsMobile()
  const [isPortrait, setIsPortrait] = useState(readIsPortrait)

  useEffect(() => {
    const update = () => setIsPortrait(readIsPortrait())

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    const portraitQuery = window.matchMedia('(orientation: portrait)')
    portraitQuery.addEventListener('change', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      portraitQuery.removeEventListener('change', update)
    }
  }, [])

  return {
    isPortrait,
    isLandscape: !isPortrait,
    isMobilePortrait: isMobile && isPortrait,
    isMobileLandscape: isMobile && !isPortrait,
  }
}

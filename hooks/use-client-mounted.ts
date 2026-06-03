'use client'

import { useEffect, useState } from 'react'

/** Avoid SSR/hydration mismatch for viewport-dependent UI. */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

'use client'

import { useEffect, useState } from 'react'

/**
 * Підписка на CSS media query. Повертає `false` до монтування на клієнті,
 * щоб уникнути розбіжностей SSR/CSR.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

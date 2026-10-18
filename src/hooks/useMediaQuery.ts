import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/** Размер окна одной строкой "ширина×высота" — строка, чтобы React не перерисовывал зря */
export function useViewport() {
  const size = useSyncExternalStore(subscribeResize, () => `${window.innerWidth}x${window.innerHeight}`)
  const [w, h] = size.split('x').map(Number)
  return { w, h }
}

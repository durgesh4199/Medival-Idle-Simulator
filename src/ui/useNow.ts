import { useEffect, useState } from 'react'

/**
 * Returns the current timestamp, refreshed on an interval. Used to drive
 * smooth progress-bar animation from components without writing to the
 * global store every frame.
 */
export function useNow(intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

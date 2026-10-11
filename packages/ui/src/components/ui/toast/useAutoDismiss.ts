import { useEffect, useRef } from 'react'

export /** Auto-dismiss countdown that holds while `paused` and resumes with the time left. */
function useAutoDismiss(duration: number, paused: boolean, onClose: () => void) {
  const remaining = useRef(duration)

  useEffect(() => {
    remaining.current = duration
  }, [duration])

  useEffect(() => {
    if (duration <= 0 || paused) return
    const startedAt = Date.now()
    const timer = setTimeout(onClose, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt))
    }
  }, [duration, paused, onClose])
}

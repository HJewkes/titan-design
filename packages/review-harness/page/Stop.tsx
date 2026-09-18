import { useEffect, useRef, type Dispatch, type ReactNode } from 'react'
import type { Action } from './state.ts'

interface StopProps {
  index: number
  active: boolean
  dispatch: Dispatch<Action>
  className: string
  testId: string
  children: ReactNode
}

/** One keyboard stop: Enter moves focus here, and focusing anything inside activates it. */
export function Stop({ index, active, dispatch, className, testId, children }: StopProps) {
  const ref = useRef<HTMLElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    const el = ref.current
    const firstRender = !mounted.current
    mounted.current = true
    if (!active || !el || el.contains(document.activeElement)) return
    el.focus({ preventScroll: true })
    if (!firstRender) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [active])
  return (
    <section
      ref={ref}
      tabIndex={-1}
      data-testid={testId}
      data-active={active || undefined}
      className={`stop ${className}`}
      onFocusCapture={() => !active && dispatch({ type: 'activate', index })}
      onPointerDownCapture={() => !active && dispatch({ type: 'activate', index })}
    >
      {children}
    </section>
  )
}

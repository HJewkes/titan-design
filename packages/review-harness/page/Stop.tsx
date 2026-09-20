import { useEffect, useRef, type Dispatch, type ReactNode } from 'react'
import type { Action } from './state.ts'

interface StopProps {
  id?: string
  index: number
  active: boolean
  /** Move focus and scroll here on activation; false when the human clicked or focused into it. */
  follow: boolean
  dispatch: Dispatch<Action>
  className: string
  testId: string
  children: ReactNode
}

/** One keyboard stop: Enter moves focus here, and focusing anything inside activates it. */
export function Stop({
  id,
  index,
  active,
  follow,
  dispatch,
  className,
  testId,
  children,
}: StopProps) {
  const ref = useRef<HTMLElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    const el = ref.current
    const firstRender = !mounted.current
    mounted.current = true
    if (!active || !follow || !el || el.contains(document.activeElement)) return
    el.focus({ preventScroll: true })
    if (!firstRender) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [active, follow])
  return (
    <section
      ref={ref}
      id={id}
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

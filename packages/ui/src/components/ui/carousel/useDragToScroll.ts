import { useEffect, useRef, type RefObject } from 'react'
import { Platform, type View } from 'react-native'

/** Horizontal travel that turns a press into a drag, so a tap on a card still presses it. */
const DRAG_THRESHOLD_PX = 6

export interface DragRelease {
  /** Where the scroll rests at release. */
  offset: number
  /** Horizontal speed over the last move, px/ms; positive scrolls towards later slides. */
  velocity: number
}

interface Sample {
  x: number
  at: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  startScroll: number
  /** Recent positions, for a speed that one jumpy move cannot distort. */
  samples: Sample[]
  dragging: boolean
}

/** Window the release speed is measured over. */
const VELOCITY_WINDOW_MS = 100

function velocityOf(samples: Sample[]): number {
  const last = samples[samples.length - 1]
  const first = samples.find((s) => last.at - s.at <= VELOCITY_WINDOW_MS) ?? samples[0]
  const elapsed = last.at - first.at
  return elapsed <= 0 ? 0 : (first.x - last.x) / elapsed
}

/**
 * Mouse and trackpad drag for a horizontal scroller. Touch needs nothing: the
 * platform already drags, flings and snaps, and taking the gesture would cost
 * that. The drag starts only once the pointer has travelled further across than
 * down, so a vertical page scroll is never captured and a press on a card's own
 * control still reaches it.
 */
export function useDragToScroll(
  wrapperRef: RefObject<View | null>,
  onStart: () => void,
  onRelease: (release: DragRelease) => void,
  onUserScroll: () => void
): void {
  const handlers = useRef({ onStart, onRelease, onUserScroll })
  useEffect(() => {
    handlers.current = { onStart, onRelease, onUserScroll }
  }, [onStart, onRelease, onUserScroll])

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const scroller = scrollerOf(wrapperRef.current)
    if (scroller === null) return
    const detachDrag = attachDrag(scroller, {
      onStart: () => handlers.current.onStart(),
      onRelease: (release) => handlers.current.onRelease(release),
    })
    // A finger or a wheel takes over whatever scroll the carousel started.
    const takeOver = () => handlers.current.onUserScroll()
    scroller.addEventListener('touchstart', takeOver, { passive: true })
    scroller.addEventListener('wheel', takeOver, { passive: true })
    return () => {
      detachDrag()
      scroller.removeEventListener('touchstart', takeOver)
      scroller.removeEventListener('wheel', takeOver)
    }
  }, [wrapperRef])
}

interface DragHandlers {
  onStart: () => void
  onRelease: (release: DragRelease) => void
}

/** react-native-web renders the View as a div whose only child is the scroller. */
function scrollerOf(wrapper: View | null): HTMLElement | null {
  const node = wrapper as unknown as HTMLElement | null
  const child = node?.firstElementChild
  return child instanceof HTMLElement ? child : null
}

function attachDrag(scroller: HTMLElement, handlers: DragHandlers): () => void {
  let state: DragState | null = null

  const stop = (): void => {
    if (state === null) return
    const wasDragging = state.dragging
    const velocity = velocityOf(state.samples)
    scroller.style.scrollSnapType = ''
    scroller.style.userSelect = ''
    state = null
    if (wasDragging) handlers.onRelease({ offset: scroller.scrollLeft, velocity })
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || event.button !== 0) return
    state = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: scroller.scrollLeft,
      samples: [{ x: event.clientX, at: event.timeStamp }],
      dragging: false,
    }
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (state === null || event.pointerId !== state.pointerId) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (!state.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return
      state.dragging = true
      handlers.onStart()
      // Free the scroll while the hand holds it; the snap decides again on release.
      scroller.style.scrollSnapType = 'none'
      scroller.style.userSelect = 'none'
      scroller.setPointerCapture(event.pointerId)
    }
    state.samples.push({ x: event.clientX, at: event.timeStamp })
    state.samples = state.samples.filter((s) => event.timeStamp - s.at <= VELOCITY_WINDOW_MS * 2)
    scroller.scrollLeft = state.startScroll - dx
  }

  // A drag that ends over a card must not also press it.
  const onClick = (event: MouseEvent): void => {
    if (suppressClick) {
      event.stopPropagation()
      event.preventDefault()
      suppressClick = false
    }
  }

  let suppressClick = false
  const onPointerUp = (event: PointerEvent): void => {
    if (state === null || event.pointerId !== state.pointerId) return
    suppressClick = state.dragging
    stop()
  }

  scroller.addEventListener('pointerdown', onPointerDown)
  scroller.addEventListener('pointermove', onPointerMove)
  scroller.addEventListener('pointerup', onPointerUp)
  scroller.addEventListener('pointercancel', onPointerUp)
  scroller.addEventListener('click', onClick, true)
  return () => {
    scroller.removeEventListener('pointerdown', onPointerDown)
    scroller.removeEventListener('pointermove', onPointerMove)
    scroller.removeEventListener('pointerup', onPointerUp)
    scroller.removeEventListener('pointercancel', onPointerUp)
    scroller.removeEventListener('click', onClick, true)
  }
}

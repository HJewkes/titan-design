import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Annotation, FrameHeight, Variant } from '../src/schema.ts'
import { storyUrl } from '../src/round.ts'
import { isAuto } from '../src/sections.ts'
import {
  AUTO_FALLBACK_HEIGHT,
  nextFrameHeight,
  storyContentHeight,
  type MeasurableDoc,
} from './autoHeight.ts'

type PinInput = Omit<Annotation, 'id' | 'note'>

interface FrameProps {
  variant: Variant
  width: number
  height: FrameHeight
  maxHeight: number
  annotate: boolean
  pins: Annotation[]
  onPin: (pin: PinInput) => void
  onHitTesting: (sameOrigin: boolean) => void
}

/** Remeasures after a load and whenever the story reflows; the frame ends up its size. */
const MAX_MEASUREMENTS = 12

const round = (n: number, places: number) => Number(n.toFixed(places))

/** Scale that fits `width` into the space the card gives it; never enlarges. */
function useFitScale(width: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / width))
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])
  return { ref, scale }
}

/** Mount the iframe only once it nears the viewport; ten live stories are heavy. */
function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: '600px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [near])
  return { ref, near }
}

function sameOriginDocument(iframe: HTMLIFrameElement | null): Document | null {
  try {
    return iframe?.contentDocument ?? null
  } catch {
    return null
  }
}

/** The harness proxy answers a dead Storybook with a text page, which has no story root. */
export function reachedStorybook(doc: Pick<Document, 'getElementById'> | null): boolean {
  return doc === null || doc.getElementById('storybook-root') !== null
}

/**
 * Sizes an `auto` frame to its story. The iframes are same-origin (the harness proxies
 * Storybook on its own origin), so the page measures the story directly; a frame it
 * cannot read, or one that never renders, stays at the fallback height.
 */
function useFittedHeight(height: FrameHeight, maxHeight: number) {
  const [fitted, setFitted] = useState(AUTO_FALLBACK_HEIGHT)
  const applied = useRef(AUTO_FALLBACK_HEIGHT)
  const measurements = useRef(0)
  const observer = useRef<{ disconnect: () => void } | null>(null)
  const auto = isAuto(height)

  const measure = useCallback(
    (doc: MeasurableDoc | null) => {
      if (!auto || measurements.current >= MAX_MEASUREMENTS) return
      const next = nextFrameHeight(applied.current, storyContentHeight(doc), maxHeight)
      if (next === applied.current) return
      measurements.current += 1
      applied.current = next
      setFitted(next)
    },
    [auto, maxHeight]
  )

  const watch = useCallback(
    (iframe: HTMLIFrameElement) => {
      observer.current?.disconnect()
      observer.current = null
      if (!auto) return
      const doc = sameOriginDocument(iframe)
      const win = iframe.contentWindow as (Window & typeof globalThis) | null
      measure(doc)
      doc?.fonts?.ready.then(() => measure(doc)).catch(() => {})
      const root = doc?.getElementById('storybook-root')
      if (!root || !win?.ResizeObserver) return
      const resize = new win.ResizeObserver(() => measure(doc))
      resize.observe(root)
      observer.current = resize
    },
    [auto, measure]
  )

  useEffect(() => () => observer.current?.disconnect(), [])
  return { height: auto ? fitted : height, watch }
}

/** Whether the last load reached Storybook, and a retry that remounts the iframe. */
function useFrameHealth(onHitTesting: (sameOrigin: boolean) => void) {
  const [attempt, setAttempt] = useState(0)
  const [dead, setDead] = useState(false)
  const onLoad = (iframe: HTMLIFrameElement) => {
    const doc = sameOriginDocument(iframe)
    onHitTesting(Boolean(doc))
    setDead(!reachedStorybook(doc))
  }
  const retry = () => {
    setDead(false)
    setAttempt((n) => n + 1)
  }
  return { attempt, dead, onLoad, retry }
}

function DeadFrame({ testId, onRetry }: { testId: string; onRetry: () => void }) {
  return (
    <div className="frame-dead" role="alert" data-testid={testId}>
      <p>Preview unreachable: Storybook did not answer for this story.</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function hitTarget(iframe: HTMLIFrameElement | null, x: number, y: number) {
  const hit = sameOriginDocument(iframe)?.elementFromPoint(x, y) as HTMLElement | null | undefined
  if (!hit) return undefined
  const testId = hit.closest('[data-testid]')?.getAttribute('data-testid') ?? undefined
  const role = hit.closest('[role]')?.getAttribute('role') ?? undefined
  const text = (hit.innerText || hit.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
  return { ...(testId && { testId }), ...(role && { role }), ...(text && { text }) }
}

export function Frame(props: FrameProps) {
  const { variant, width, annotate, pins } = props
  const { ref: fitRef, scale } = useFitScale(width)
  const { ref: lazyRef, near } = useNearViewport()
  const iframe = useRef<HTMLIFrameElement>(null)
  const health = useFrameHealth(props.onHitTesting)
  const { height, watch } = useFittedHeight(props.height, props.maxHeight)

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = round((e.clientX - rect.left) / scale, 0)
    const y = round((e.clientY - rect.top) / scale, 0)
    const target = hitTarget(iframe.current, x, y)
    props.onPin({ width, x, y, xPct: round(x / width, 4), yPct: round(y / height, 4), target })
  }

  return (
    <figure className="frame" data-width={width} ref={fitRef}>
      <figcaption>
        {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}
        {isAuto(props.height) ? ' · fitted' : ''}
      </figcaption>
      <div
        className="frame-box"
        ref={lazyRef}
        style={{ width: width * scale, height: height * scale }}
      >
        {near && (
          <iframe
            key={health.attempt}
            ref={iframe}
            title={`${variant.key} · ${variant.label} at ${width}px`}
            src={storyUrl('', variant)}
            tabIndex={-1}
            style={{ width, height, transform: `scale(${scale})` }}
            onLoad={(e) => {
              health.onLoad(e.currentTarget)
              watch(e.currentTarget)
            }}
          />
        )}
        <div
          className={annotate ? 'overlay annotating' : 'overlay'}
          data-testid={`overlay-${variant.key}-${width}`}
          onClick={annotate ? onOverlayClick : undefined}
        >
          {pins
            .filter((p) => p.width === width)
            .map((p) => (
              <span key={p.id} className="pin" style={{ left: p.x * scale, top: p.y * scale }}>
                {p.id.split('-').pop()}
              </span>
            ))}
        </div>
        {health.dead && (
          <DeadFrame testId={`dead-${variant.key}-${width}`} onRetry={health.retry} />
        )}
      </div>
    </figure>
  )
}

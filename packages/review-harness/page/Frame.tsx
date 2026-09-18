import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Annotation, Variant } from '../src/schema.ts'
import { storyUrl } from '../src/round.ts'

type PinInput = Omit<Annotation, 'id' | 'note'>

interface FrameProps {
  variant: Variant
  width: number
  height: number
  annotate: boolean
  pins: Annotation[]
  onPin: (pin: PinInput) => void
  onHitTesting: (sameOrigin: boolean) => void
}

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

function hitTarget(iframe: HTMLIFrameElement | null, x: number, y: number) {
  const hit = sameOriginDocument(iframe)?.elementFromPoint(x, y) as HTMLElement | null | undefined
  if (!hit) return undefined
  const testId = hit.closest('[data-testid]')?.getAttribute('data-testid') ?? undefined
  const role = hit.closest('[role]')?.getAttribute('role') ?? undefined
  const text = (hit.innerText || hit.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
  return { ...(testId && { testId }), ...(role && { role }), ...(text && { text }) }
}

export function Frame(props: FrameProps) {
  const { variant, width, height, annotate, pins } = props
  const { ref: fitRef, scale } = useFitScale(width)
  const { ref: lazyRef, near } = useNearViewport()
  const iframe = useRef<HTMLIFrameElement>(null)

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
      </figcaption>
      <div
        className="frame-box"
        ref={lazyRef}
        style={{ width: width * scale, height: height * scale }}
      >
        {near && (
          <iframe
            ref={iframe}
            title={`${variant.key} · ${variant.label} at ${width}px`}
            src={storyUrl('', variant)}
            tabIndex={-1}
            style={{ width, height, transform: `scale(${scale})` }}
            onLoad={(e) => props.onHitTesting(Boolean(e.currentTarget.contentDocument))}
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
      </div>
    </figure>
  )
}

// The page bridge a frame-capture renderer drives: `window.__titanMotion`. The renderer talks to a
// page only through this protocol, so it never imports the design system.
import { flushSync } from 'react-dom'
import type { Clock, SeekClock } from './clocks'

/** What a `MotionProvider` on a seek clock publishes as `window.__titanMotion` on web. */
export interface TitanMotionApi {
  /**
   * Seeks to `t` seconds, clamped to `[0, duration]` (only at 0 when `duration` is 0), and commits
   * the frame before returning. A non-finite `t` throws a `RangeError`.
   */
  seek(t: number): void
  /** Resolves once fonts, pending `<img>` elements and every `useWaitUntil` promise have settled. */
  ready(): Promise<void>
  /** Total timeline length in seconds: the provider's `durationS`. */
  readonly duration: number
}

declare global {
  interface Window {
    __titanMotion?: TitanMotionApi
  }
}

function isSeekClock(clock: Clock): clock is SeekClock {
  return clock.kind === 'seek'
}

function clampSeek(t: number, durationS: number): number {
  if (!Number.isFinite(t)) throw new RangeError(`__titanMotion.seek(${t}) needs a finite time`)
  const atLeastZero = Math.max(0, t)
  return durationS > 0 ? Math.min(durationS, atLeastZero) : atLeastZero
}

function settled(img: HTMLImageElement): Promise<unknown> {
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  })
}

function pendingImages(): Promise<unknown>[] {
  return Array.from(document.images)
    .filter((img) => !img.complete)
    .map(settled)
}

function createMotionApi(
  clock: SeekClock,
  durationS: number,
  waits: ReadonlySet<Promise<unknown>>
): TitanMotionApi {
  return {
    seek: (t) => flushSync(() => clock.seek(clampSeek(t, durationS))),
    async ready() {
      await Promise.allSettled([document.fonts?.ready, ...pendingImages(), ...waits])
    },
    duration: durationS,
  }
}

/** Publishes the bridge for `clock` on web and returns its removal; a no-op elsewhere. */
export function publishMotionApi(
  clock: Clock,
  durationS: number,
  waits: ReadonlySet<Promise<unknown>>
): (() => void) | undefined {
  if (!isSeekClock(clock) || typeof document === 'undefined') return undefined
  const api = createMotionApi(clock, durationS, waits)
  window.__titanMotion = api
  return () => {
    if (window.__titanMotion === api) delete window.__titanMotion
  }
}

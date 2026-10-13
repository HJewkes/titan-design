// Time sources. Clocks are the only part of the motion core that touches real time;
// `now()` returns a value cached at the last tick so React sees one time per frame.

export type ClockKind = 'raf' | 'seek' | 'media'

export interface Clock {
  readonly kind: ClockKind
  now(): number
  subscribe(cb: () => void): () => void
}

export interface SeekClock extends Clock {
  readonly kind: 'seek'
  seek(t: number): void
}

/** What a reduced-motion rAF clock with no end reports: past the end of any entrance or beat. */
export const REDUCED_MOTION_END_S = 1e4

function subscribers(onFirst: () => void = () => {}, onLast: () => void = () => {}) {
  const set = new Set<() => void>()
  return {
    add(cb: () => void): () => void {
      set.add(cb)
      if (set.size === 1) onFirst()
      return () => {
        if (set.delete(cb) && set.size === 0) onLast()
      }
    },
    notify(): void {
      for (const cb of [...set]) cb()
    },
  }
}

export function seekClock(initialS = 0): SeekClock {
  let t = initialS
  const subs = subscribers()
  return {
    kind: 'seek',
    now: () => t,
    subscribe: subs.add,
    seek(next) {
      t = next
      subs.notify()
    },
  }
}

type FrameListener = (ms: number) => void

// One requestAnimationFrame loop for every rAF clock, running only while one is subscribed,
// so a screen of entrances costs one frame callback rather than one per component.
const frameListeners = new Set<FrameListener>()
let sharedFrame = 0

function onSharedFrame(ms: number): void {
  for (const listener of [...frameListeners]) listener(ms)
  sharedFrame = frameListeners.size > 0 ? requestAnimationFrame(onSharedFrame) : 0
}

function listenToFrames(listener: FrameListener): () => void {
  frameListeners.add(listener)
  if (frameListeners.size === 1) sharedFrame = requestAnimationFrame(onSharedFrame)
  return () => {
    if (!frameListeners.delete(listener) || frameListeners.size > 0) return
    cancelAnimationFrame(sharedFrame)
    sharedFrame = 0
  }
}

export interface RafClockOptions {
  startS?: number
  /** The clock stops here: it reports `endS` and requests no further frames. */
  endS?: number
  /** Report the end at once. Read the preference with `usePrefersReducedMotion`. */
  reducedMotion?: boolean
}

/** Advances with requestAnimationFrame from the first frame after the first subscriber. */
export function rafClock({
  startS = 0,
  endS = Infinity,
  reducedMotion = false,
}: RafClockOptions = {}): Clock {
  if (reducedMotion) {
    const end = Number.isFinite(endS) ? endS : REDUCED_MOTION_END_S
    return { kind: 'raf', now: () => end, subscribe: () => () => {} }
  }
  let t = Math.min(startS, endS)
  let originMs: number | null = null
  let stop: (() => void) | null = null
  const tick = (ms: number) => {
    originMs ??= ms - t * 1000
    t = Math.min(endS, (ms - originMs) / 1000)
    if (t >= endS) halt()
    subs.notify()
  }
  const halt = () => {
    stop?.()
    stop = null
  }
  const subs = subscribers(() => {
    if (t < endS) stop = listenToFrames(tick)
  }, halt)
  return { kind: 'raf', now: () => t, subscribe: subs.add }
}

/** Follows `media.currentTime`: on timeupdate and seeked, and every frame while playing. */
export function mediaClock(media: HTMLMediaElement): Clock {
  let t = media.currentTime
  let frame = 0
  const sync = () => {
    if (media.currentTime === t) return
    t = media.currentTime
    subs.notify()
  }
  const loop = () => {
    sync()
    frame = requestAnimationFrame(loop)
  }
  const startLoop = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(loop)
  }
  const stopLoop = () => {
    cancelAnimationFrame(frame)
    sync()
  }
  const events: [string, () => void][] = [
    ['timeupdate', sync],
    ['seeked', sync],
    ['play', startLoop],
    ['pause', stopLoop],
    ['ended', stopLoop],
  ]
  const subs = subscribers(
    () => {
      for (const [name, fn] of events) media.addEventListener(name, fn)
      if (!media.paused) startLoop()
    },
    () => {
      for (const [name, fn] of events) media.removeEventListener(name, fn)
      cancelAnimationFrame(frame)
    }
  )
  return { kind: 'media', now: () => t, subscribe: subs.add }
}

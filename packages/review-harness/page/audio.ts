/** The server serves each sound by route key, never by path: a variant key, or a blind take's. */
export function audioUrl(key: string): string {
  return `api/audio/${key.split('/').map(encodeURIComponent).join('/')}`
}

type Playable = Pick<
  HTMLAudioElement,
  'loop' | 'currentTime' | 'play' | 'pause' | 'addEventListener'
>

/**
 * Plays `first` from the start, then `second` from the start as soon as `first` ends. `first`
 * stops looping while it plays its turn, or it would never end; its own loop setting comes back
 * when `second` starts.
 */
export function playBackToBack(first: Playable | null, second: Playable | null): void {
  if (!first || !second) return
  const loop = first.loop
  for (const take of [first, second]) {
    take.pause()
    take.currentTime = 0
  }
  first.loop = false
  first.addEventListener(
    'ended',
    () => {
      first.loop = loop
      void second.play()
    },
    { once: true }
  )
  void first.play()
}

/** A recording's stated length, as the page prints it. */
export function durationText(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)} s`
}

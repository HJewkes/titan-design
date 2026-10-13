import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VariantSchema, type ClipVariant, type Keyframe } from '@titan-design/review-schema'
import {
  clipDuration,
  clipReadout,
  currentKeyframe,
  keyframeTime,
  scrubTo,
  seekToKeyframe,
  setLoop,
  togglePlayback,
  type ClipMedia,
} from '../page/clip.ts'
import { ClipFrame } from '../page/ClipFrame.tsx'

/** A video element's playback surface: play and pause flip `paused`, as the browser's do. */
function stubMedia(init: Partial<ClipMedia> = {}): ClipMedia {
  const media: ClipMedia = {
    currentTime: 0,
    duration: 4,
    paused: false,
    loop: true,
    play: () => {
      media.paused = false
    },
    pause: () => {
      media.paused = true
    },
    ...init,
  }
  return media
}

const STAGES: Keyframe[] = [
  { atMs: 0, label: '1 overview' },
  { atMs: 1200, label: '2 drill in' },
  { atMs: 2400, label: '3 enter: D4' },
]

const clipVariant = (motion: Record<string, unknown> = {}) =>
  VariantSchema.parse({
    key: 'reel',
    clip: 'clips/reel.webm',
    label: 'Reel',
    motion: { mechanism: 'clip', ...motion },
  }) as ClipVariant

const frameHtml = (variant: ClipVariant) =>
  renderToStaticMarkup(
    createElement(ClipFrame, { variant, width: 640, annotate: false, pins: [], onPin: () => {} })
  )

describe('the clip controls', () => {
  it('seeks to a keyframe in seconds and pauses there', () => {
    const media = stubMedia()

    seekToKeyframe(media, STAGES[2])

    expect([media.currentTime, media.paused]).toEqual([2.4, true])
  })

  it('unticking loop stops the video looping', () => {
    const media = stubMedia({ loop: true })

    setLoop(media, false)

    expect(media.loop).toBe(false)
  })

  it('pauses on scrub and drops the playhead at that share of the clip, clamped', () => {
    const media = stubMedia()

    scrubTo(media, 0.25, 4)
    expect([media.currentTime, media.paused]).toEqual([1, true])

    scrubTo(media, 1.5, 4)
    expect(media.currentTime).toBe(4)
  })

  it('plays a paused clip and pauses a playing one, staying paused if play is refused', async () => {
    const media = stubMedia({ paused: true })
    togglePlayback(media)
    expect(media.paused).toBe(false)
    togglePlayback(media)
    expect(media.paused).toBe(true)

    const refused = stubMedia({ paused: true, play: () => Promise.reject(new Error('blocked')) })
    togglePlayback(refused)
    await Promise.resolve()
    expect(refused.paused).toBe(true)
  })

  it("takes the file's duration once known, else the round's stated one", () => {
    expect(clipDuration(3.5, undefined)).toBe(3.5)
    expect(clipDuration(Number.NaN, { mechanism: 'clip', durationMs: 4000 } as never)).toBe(4)
    expect(clipDuration(Number.POSITIVE_INFINITY, undefined)).toBe(0)
  })

  it('reads out the playhead and each keyframe time to the hundredth', () => {
    expect(clipReadout(0, 4)).toBe('0.00 / 4.00 s')
    expect(clipReadout(2.4, 4)).toBe('2.40 / 4.00 s')
    expect(keyframeTime(STAGES[2])).toBe('2.40 s')
  })

  it('marks the stage the playhead is in', () => {
    expect(currentKeyframe(STAGES, 1.19)).toBe(0)
    expect(currentKeyframe(STAGES, 2.3999999)).toBe(2)
    expect(currentKeyframe(STAGES.slice(1), 0.5)).toBe(-1)
  })
})

describe('a clip frame', () => {
  it("replaces the browser's controls with the page's player, ticked to loop by default", () => {
    const html = frameHtml(clipVariant())

    expect(html).not.toMatch(/<video[^>]*controls/)
    expect(html).toContain('data-testid="clip-reel"')
    expect(html).toContain('aria-label="Play reel"')
    expect(html).toContain('aria-label="Scrub reel"')
    expect(html).toMatch(/<input type="checkbox" checked=""\/> Loop/)
    expect(html).not.toContain('clip-keyframes')
  })

  it('starts the loop toggle unticked for a clip that plays once', () => {
    const html = frameHtml(clipVariant({ loop: false }))

    expect(html).toMatch(/<input type="checkbox"\/> Loop/)
    expect(html).toContain(', plays once')
  })

  it('lists labelled keyframes under the clip with their times', () => {
    const html = frameHtml(clipVariant({ durationMs: 4000, keyframes: STAGES }))

    expect(html).toContain('aria-label="Keyframes of reel"')
    expect(html).toContain('<span class="clip-keyframe-time">2.40 s</span> 3 enter: D4')
    expect(html).toContain('0.00 / 4.00 s')
  })
})

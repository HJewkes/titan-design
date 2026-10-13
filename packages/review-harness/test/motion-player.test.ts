import { describe, expect, it } from 'vitest'
import { ArgMotionSchema, type ArgMotion } from '@titan-design/review-schema'
import { advance, argAt, initialPlayer, playheadLabel, seek, toggle } from '../page/motion.ts'
import { LADDER_WIDTH, largestTextPx, scaleColumns, sizeLabel, viewScale } from '../page/scale.ts'
import { UPDATE_STORY_ARGS, pushStoryArgs } from '../page/storyArgs.ts'
import { ScaleReferenceSchema } from '@titan-design/review-schema'

const motion = (extra: Partial<ArgMotion> = {}): ArgMotion =>
  ArgMotionSchema.parse({ mechanism: 'arg', durationMs: 2000, ...extra })

describe('the motion player', () => {
  it('starts at the beginning, playing when the motion autoplays', () => {
    expect(initialPlayer(motion())).toEqual({ playing: true, position: 0 })
    expect(initialPlayer(motion({ autoplay: false }))).toEqual({ playing: false, position: 0 })
  })

  it('advances by elapsed time over the duration', () => {
    expect(advance({ playing: true, position: 0 }, 500, motion())).toEqual({
      playing: true,
      position: 0.25,
    })
  })

  it('wraps to the start when it loops', () => {
    const next = advance({ playing: true, position: 0.9 }, 400, motion())
    expect(next.playing).toBe(true)
    expect(next.position).toBeCloseTo(0.1)
  })

  it('stops at the end when it plays once, and play then restarts it', () => {
    const ended = advance({ playing: true, position: 0.9 }, 400, motion({ loop: false }))
    expect(ended).toEqual({ playing: false, position: 1 })
    expect(toggle(ended)).toEqual({ playing: true, position: 0 })
  })

  it('does not move while paused', () => {
    const paused = { playing: false, position: 0.4 }
    expect(advance(paused, 1000, motion())).toBe(paused)
  })

  it('scrubs to a clamped position and keeps playing or paused as it was', () => {
    expect(seek({ playing: true, position: 0.2 }, 0.7)).toEqual({ playing: true, position: 0.7 })
    expect(seek({ playing: false, position: 0.2 }, 1.4)).toEqual({ playing: false, position: 1 })
    expect(seek({ playing: false, position: 0.2 }, -1)).toEqual({ playing: false, position: 0 })
  })

  it('pauses and resumes in place', () => {
    expect(toggle({ playing: true, position: 0.3 })).toEqual({ playing: false, position: 0.3 })
    expect(toggle({ playing: false, position: 0.3 })).toEqual({ playing: true, position: 0.3 })
  })

  it("maps the position onto the arg's range, either way round", () => {
    expect(argAt(motion(), 0.25)).toBe(0.25)
    expect(argAt(motion({ arg: 'value', from: 0, to: 100 }), 0.333333)).toBe(33.3333)
    expect(argAt(motion({ from: 10, to: 0 }), 0.5)).toBe(5)
  })

  it('reads out the time and the arg value at the playhead', () => {
    expect(playheadLabel(motion(), 0.6)).toBe('1.2s / 2.0s · progress 0.60')
  })
})

describe('sending args to a story', () => {
  it("emits Storybook's updateStoryArgs on the iframe's preview channel", () => {
    const sent: unknown[] = []
    const win = {
      __STORYBOOK_ADDONS_CHANNEL__: { emit: (...a: unknown[]) => sent.push(a) },
    } as unknown as Window
    expect(pushStoryArgs(win, 'a--b', { progress: 0.5 })).toBe(true)
    expect(sent).toEqual([[UPDATE_STORY_ARGS, { storyId: 'a--b', updatedArgs: { progress: 0.5 } }]])
  })

  it('reports false while the story has no channel, or the window cannot be read', () => {
    expect(pushStoryArgs({} as Window, 'a--b', { progress: 0 })).toBe(false)
    expect(pushStoryArgs(null, 'a--b', { progress: 0 })).toBe(false)
    const crossOrigin = Object.defineProperty({}, '__STORYBOOK_ADDONS_CHANNEL__', {
      get: () => {
        throw new Error('SecurityError')
      },
    }) as Window
    expect(pushStoryArgs(crossOrigin, 'a--b', { progress: 0 })).toBe(false)
  })
})

describe('the scale reference', () => {
  const scale = ScaleReferenceSchema.parse({ arg: 'size', candidates: ['sm', 'md', 'lg'] })

  it('labels a size with its share of the frame height', () => {
    expect(sizeLabel(64, 1080)).toBe('64px · 5.9% of 1080')
    expect(sizeLabel(24, 1080)).toBe('24px · 2.2% of 1080')
    expect(sizeLabel(47.5, 1080)).toBe('47.5px · 4.4% of 1080')
  })

  it('splits the frame into the ladder and one equal column per candidate', () => {
    expect(scaleColumns(scale)).toEqual({ ladder: LADDER_WIDTH, cell: 520 })
    const narrow = ScaleReferenceSchema.parse({ ...scale, frame: { width: 800, height: 600 } })
    expect(scaleColumns(narrow)).toEqual({ ladder: 200, cell: 200 })
  })

  it('draws the frame fitted to the card, or at 1:1', () => {
    expect(viewScale('fit', 0.45)).toBe(0.45)
    expect(viewScale('fit', 1.6)).toBe(1)
    expect(viewScale('actual', 0.45)).toBe(1)
  })

  it('finds the largest text a candidate draws, ignoring empty runs', () => {
    expect(
      largestTextPx([
        { text: '1248', fontSize: '96px' },
        { text: 'kg', fontSize: '40px' },
        { text: '  ', fontSize: '200px' },
        { text: 'x', fontSize: 'normal' },
      ])
    ).toBe(96)
    expect(largestTextPx([])).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCALE_FRAME,
  DEFAULT_SCALE_LADDER,
  MANIFEST_SCHEMA_ID,
  RoundSchema,
  VariantSchema,
  lintRound,
} from '../src/index.ts'

const STORY = 'components-molecules-chapter-card--default'
const TEXTS = { deciding: 'How it moves.', changed: 'A new card.', context: 'Copy is fixed.' }

const messages = (input: unknown) => {
  const parsed = VariantSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

function round(variants: unknown[], kind: 'STATES' | 'CHOICE' = 'STATES') {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'motion',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6200',
    widths: [1920],
    variants,
    questions: [],
    sections: [
      {
        id: 'card',
        title: 'The card',
        ...TEXTS,
        kind,
        variantKeys: variants.map((v) => (v as { key: string }).key),
      },
    ],
  }
}

const lintOf = (input: unknown) => lintRound(RoundSchema.parse(input))
const sample = (key: string, progress: number, extra: Record<string, unknown> = {}) => ({
  key,
  storyId: STORY,
  label: `at ${progress}`,
  args: { progress, ...extra },
})

describe('motion on a variant', () => {
  it('fills autoplay, loop and a 0..1 progress sweep for an arg motion', () => {
    const v = VariantSchema.parse({
      key: 'card',
      storyId: STORY,
      label: 'Card',
      motion: { mechanism: 'arg', durationMs: 2000 },
    })
    expect(v.motion).toEqual({
      mechanism: 'arg',
      arg: 'progress',
      from: 0,
      to: 1,
      durationMs: 2000,
      autoplay: true,
      loop: true,
    })
  })

  it('refuses an arg motion without a duration or with an empty range', () => {
    expect(
      messages({ key: 'a', storyId: STORY, label: 'A', motion: { mechanism: 'arg' } })
    ).toEqual([expect.stringMatching(/^motion\.durationMs: /)])
    expect(
      messages({
        key: 'a',
        storyId: STORY,
        label: 'A',
        motion: { mechanism: 'arg', from: 1, to: 1, durationMs: 900 },
      })
    ).toEqual(['motion: a motion arg sweeps a range: from and to differ'])
  })

  it('accepts a clip variant that declares a clip motion', () => {
    const v = VariantSchema.parse({
      key: 'reel',
      clip: 'clips/reel.webm',
      label: 'Reel',
      motion: { mechanism: 'clip' },
    })
    expect(v.motion).toEqual({ mechanism: 'clip', autoplay: true, loop: true })
  })

  it('ties each mechanism to its source', () => {
    expect(messages({ key: 'a', clip: 'a.mp4', label: 'A' })).toEqual([
      'motion: a clip variant declares motion { mechanism: "clip" }',
    ])
    expect(
      messages({
        key: 'a',
        image: 'a.png',
        label: 'A',
        motion: { mechanism: 'arg', durationMs: 900 },
      })
    ).toEqual(['motion: an arg motion drives a live story; give the variant a storyId'])
    expect(
      messages({ key: 'a', storyId: STORY, label: 'A', motion: { mechanism: 'clip' } })
    ).toEqual(['motion: a clip motion plays the variant clip; give the variant a clip'])
  })

  it('refuses a clip that is not mp4 or webm, or a second source', () => {
    expect(
      messages({ key: 'a', clip: 'a.gif', label: 'A', motion: { mechanism: 'clip' } })
    ).toEqual(['clip: an .mp4 or .webm path relative to the round file, without .. segments'])
    expect(
      messages({
        key: 'a',
        clip: 'a.mp4',
        image: 'a.png',
        label: 'A',
        motion: { mechanism: 'clip' },
      })
    ).toEqual([': a variant has exactly one of storyId, image or clip'])
  })

  describe('keyframes on a clip', () => {
    const reel = (motion: Record<string, unknown>) => ({
      key: 'reel',
      clip: 'clips/reel.webm',
      label: 'Reel',
      motion: { mechanism: 'clip', ...motion },
    })
    const stages = [
      { atMs: 0, label: '1 overview' },
      { atMs: 1200, label: '2 drill in' },
      { atMs: 2400, label: '3 enter: D4' },
    ]

    it('keeps keyframes in the order the round gives them', () => {
      const v = VariantSchema.parse(reel({ durationMs: 4000, keyframes: stages }))
      expect(v.motion?.mechanism === 'clip' && v.motion.keyframes).toEqual(stages)
    })

    it('refuses keyframes out of time order, or at one time twice', () => {
      expect(messages(reel({ keyframes: [stages[0], stages[2], stages[1]] }))).toEqual([
        'motion.keyframes.2.atMs: keyframes run in time order: 2 drill in at 1200ms follows 2400ms',
      ])
      expect(messages(reel({ keyframes: [stages[1], { atMs: 1200, label: 'again' }] }))).toEqual([
        'motion.keyframes.1.atMs: keyframes run in time order: again at 1200ms follows 1200ms',
      ])
    })

    it("refuses a keyframe past the clip's stated duration, and allows any time without one", () => {
      expect(messages(reel({ durationMs: 2000, keyframes: stages }))).toEqual([
        "motion.keyframes.2.atMs: keyframe 3 enter: D4 at 2400ms is past the clip's 2000ms",
      ])
      expect(messages(reel({ keyframes: stages }))).toEqual([])
    })
  })

  it('refuses a driven arg that the variant also fixes in args', () => {
    expect(
      messages({
        key: 'a',
        storyId: STORY,
        label: 'A',
        args: { progress: 0.5 },
        motion: { mechanism: 'arg', durationMs: 900 },
      })
    ).toEqual(["args: progress is driven by the frame's motion or scale; drop it from args"])
  })
})

describe('a scale reference on a variant', () => {
  it('defaults to a 1920x1080 frame and the 1080p reference ladder', () => {
    const v = VariantSchema.parse({
      key: 'size',
      storyId: STORY,
      label: 'Sizes',
      scale: { arg: 'size', candidates: ['sm', 'md', 'lg'] },
    })
    expect(v.scale?.frame).toEqual(DEFAULT_SCALE_FRAME)
    expect(v.scale?.ladder).toEqual([
      { label: 'caption', px: 24 },
      { label: 'body', px: 32 },
      { label: 'title', px: 64 },
      { label: 'display', px: 96 },
    ])
    expect(DEFAULT_SCALE_LADDER).toHaveLength(4)
  })

  it('refuses one candidate, a repeated candidate, an image source or the motion arg', () => {
    const scale = (candidates: unknown[]) => ({
      key: 'a',
      storyId: STORY,
      label: 'A',
      scale: { arg: 'size', candidates },
    })
    expect(messages(scale(['md']))).toEqual([expect.stringMatching(/^scale\.candidates: /)])
    expect(messages(scale(['md', 'md']))).toEqual(['scale: scale candidates repeat a value'])
    expect(
      messages({ key: 'a', image: 'a.png', label: 'A', scale: { arg: 's', candidates: [1, 2] } })
    ).toEqual(['scale: a scale reference renders a live story; give the variant a storyId'])
    expect(
      messages({
        ...scale([1, 2]),
        scale: { arg: 'progress', candidates: [1, 2] },
        motion: { mechanism: 'arg', durationMs: 900 },
      })
    ).toEqual(['scale: motion and scale both drive progress; they set different args'])
  })
})

describe('a frame reference on a variant', () => {
  it('defaults an image to a 1920x1080 frame and the 1080p reference ladder', () => {
    const v = VariantSchema.parse({
      key: 'shot',
      image: 'shot.png',
      label: 'Shot',
      frameReference: {},
    })
    expect(v.frameReference).toEqual({
      frame: DEFAULT_SCALE_FRAME,
      ladder: [...DEFAULT_SCALE_LADDER],
    })
  })

  it('takes a clip with its own frame and ladder', () => {
    const frameReference = {
      frame: { width: 1280, height: 720 },
      ladder: [{ label: 'floor x-height', px: 21.6 }],
    }
    const clip = { key: 'reel', clip: 'reel.webm', label: 'Reel', motion: { mechanism: 'clip' } }
    expect(VariantSchema.parse({ ...clip, frameReference }).frameReference).toEqual(frameReference)
  })

  it('refuses one on a story, which uses scale instead', () => {
    expect(messages({ key: 'card', storyId: STORY, label: 'Card', frameReference: {} })).toEqual([
      'frameReference: a frame reference sizes an image or clip; a story uses scale',
    ])
  })
})

describe('a CHOICE strip compares motion too', () => {
  it('refuses a choice between a playing frame and a static one', () => {
    const parsed = RoundSchema.safeParse(
      round(
        [
          { key: 'a', storyId: STORY, label: 'A', motion: { mechanism: 'arg', durationMs: 900 } },
          { key: 'b', storyId: STORY, label: 'B' },
        ],
        'CHOICE'
      )
    )
    expect(parsed.error?.issues.map((i) => i.message)).toEqual([
      expect.stringContaining('motion (a: progress 0..1 over 900ms, b: static)'),
    ])
  })
})

describe('the sampled-animation lint rule', () => {
  it('refuses STATES frames sampled from one story along progress', () => {
    const problems = lintOf(round([sample('p0', 0), sample('p5', 0.5), sample('p1', 1)]))
    expect(problems).toEqual([
      {
        rule: 'sampled-animation',
        message:
          `section card: frames p0, p5, p1 sample ${STORY} at progress 0, 0.5, 1; ` +
          'show one variant with motion { mechanism: "arg", arg: "progress" } so it plays with a scrubber',
      },
    ])
  })

  it('reads any numeric arg held to 0..1 as time', () => {
    const at = (key: string, t: number) => ({ ...sample(key, 0), args: { phase: t } })
    expect(lintOf(round([at('a', 0.2), at('b', 0.8)])).map((p) => p.rule)).toEqual([
      'sampled-animation',
    ])
  })

  it('passes states that differ in a value that is not time', () => {
    const at = (key: string, value: number) => ({ ...sample(key, 0), args: { value } })
    expect(lintOf(round([at('empty', 0), at('half', 50), at('full', 100)]))).toEqual([])
  })

  it('passes samples that also differ in a second arg, theme or story', () => {
    expect(lintOf(round([sample('a', 0, { size: 'sm' }), sample('b', 1, { size: 'lg' })]))).toEqual(
      []
    )
    expect(
      lintOf(round([sample('a', 0), { ...sample('b', 1), globals: { theme: 'light' } }]))
    ).toEqual([])
  })

  it('passes one motion variant in place of the samples', () => {
    const playing = {
      key: 'card',
      storyId: STORY,
      label: 'Card',
      motion: { mechanism: 'arg', durationMs: 2000 },
    }
    expect(lintOf(round([playing]))).toEqual([])
  })
})

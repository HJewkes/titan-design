import { describe, expect, it } from 'vitest'
import { EXIT_BLOCKERS, EXIT_CLEAN, EXIT_RENDER_ERROR, exitCodeFor } from './capture.mjs'
import { applyRatchet, fullyAudited, keysOf, ratchetLines } from './ratchet.mjs'

const WIDTHS = [360, 768, 1280]
const STORY = 'components-atoms-sample--default'
const OTHER = 'components-atoms-other--default'

const floor = (selector) => ({
  kind: 'text-floor',
  selector,
  detail: '8px text under the 10px floor (error tier)',
  rule: 'DR-TY-06',
})
const frame = (id, width, warnings = [], extra = {}) => ({
  id,
  width,
  theme: 'dark',
  rendered: true,
  blockers: [],
  warnings,
  ...extra,
})
const baselineOf = (stories, widths = WIDTHS) => ({
  schema: 1,
  generated: { sha: 'abc1234', widths },
  ceiling: { 'text-floor': Object.values(stories).flat().length },
  kinds: { 'text-floor': stories },
})

describe('applyRatchet', () => {
  it('fails a text-floor finding outside the baseline, keeping its kind and rule', () => {
    const entries = [frame(STORY, 360, [floor('span.new')])]

    const out = applyRatchet(entries, baselineOf({}))

    expect(out.entries[0].warnings).toEqual([])
    expect(out.entries[0].blockers).toEqual([{ ...floor('span.new'), ratchet: 'new' }])
    expect(exitCodeFor(out.entries)).toBe(EXIT_BLOCKERS)
    expect(out.report[0].added).toEqual([`${STORY} span.new`])
  })

  it('keeps a baselined finding as a warning and exits clean', () => {
    const entries = [frame(STORY, 360, [floor('span.old')])]

    const out = applyRatchet(entries, baselineOf({ [STORY]: ['span.old'] }))

    expect(out.entries[0].warnings).toEqual([{ ...floor('span.old'), ratchet: 'baselined' }])
    expect(exitCodeFor(out.entries)).toBe(EXIT_CLEAN)
    expect(out.report[0].baselined).toBe(1)
  })

  it('treats a baselined selector under another story id as new', () => {
    const entries = [frame(OTHER, 360, [floor('span.old')])]

    const out = applyRatchet(entries, baselineOf({ [STORY]: ['span.old'] }))

    expect(out.entries[0].blockers.map((b) => b.ratchet)).toEqual(['new'])
  })

  it('passes a key seen at another baseline width, since the key carries no width', () => {
    const entries = [frame(STORY, 360, [floor('span.wide-only')])]

    const out = applyRatchet(entries, baselineOf({ [STORY]: ['span.wide-only'] }))

    expect(exitCodeFor(out.entries)).toBe(EXIT_CLEAN)
  })

  it('leaves a finding at a width the baseline was not generated at as a warning', () => {
    const entries = [frame(STORY, 320, [floor('span.touch')])]

    const out = applyRatchet(entries, baselineOf({}))

    expect(out.entries[0].warnings).toEqual([
      { ...floor('span.touch'), ratchet: 'unbaselined-width' },
    ])
    expect(exitCodeFor(out.entries)).toBe(EXIT_CLEAN)
    expect(out.report[0].unbaselinedFrames).toBe(1)
  })

  it('never moves a kind that is not ratcheted', () => {
    const small = { kind: 'small-text', selector: 'span', detail: '"x" at 10px' }
    const lift = { kind: 'nested-lift', selector: 'div', detail: 'lift' }
    const entries = [frame(STORY, 360, [small, lift])]

    const out = applyRatchet(entries, baselineOf({}))

    expect(out.entries[0].warnings).toEqual([small, lift])
    expect(out.entries[0].blockers).toEqual([])
  })

  it('counts a stale key only for a story audited at every baseline width', () => {
    const known = { [STORY]: ['span.gone'], [OTHER]: ['span.gone'] }
    const entries = [...WIDTHS.map((w) => frame(STORY, w)), frame(OTHER, 360)]

    const out = applyRatchet(entries, baselineOf(known))

    expect(out.report[0].stale).toEqual([`${STORY} span.gone`])
  })

  it('keeps exit 2 when a frame failed to render beside a new finding', () => {
    const broken = frame(OTHER, 360, [], { rendered: false })
    const entries = [frame(STORY, 360, [floor('span.new')]), broken]

    const out = applyRatchet(entries, baselineOf({}))

    expect(exitCodeFor(out.entries)).toBe(EXIT_RENDER_ERROR)
  })

  it('does not mutate the entries it is given', () => {
    const entries = [frame(STORY, 360, [floor('span.new')])]

    applyRatchet(entries, baselineOf({}))

    expect(entries[0].warnings).toEqual([floor('span.new')])
  })
})

describe('keysOf and fullyAudited', () => {
  it('unions a story’s selectors over the baseline widths only', () => {
    const entries = [
      frame(STORY, 360, [floor('a')]),
      frame(STORY, 768, [floor('b'), floor('a')]),
      frame(STORY, 320, [floor('touch')]),
    ]

    const keys = keysOf(entries, 'text-floor', WIDTHS)

    expect([...keys.get(STORY)].sort()).toEqual(['a', 'b'])
  })

  it('counts a story as audited only with a rendered frame at every width', () => {
    const entries = [
      ...WIDTHS.map((w) => frame(STORY, w)),
      frame(OTHER, 360),
      frame(OTHER, 768),
      frame(OTHER, 1280, [], { rendered: false }),
    ]

    expect([...fullyAudited(entries, WIDTHS)]).toEqual([STORY])
  })
})

describe('ratchetLines', () => {
  it('reports new, baselined, stale and unbaselined-width counts, with the regen hint when stale', () => {
    const report = [
      { kind: 'text-floor', added: ['a x'], baselined: 3, stale: ['b y'], unbaselinedFrames: 2 },
    ]

    expect(ratchetLines(report)).toEqual([
      'ratchet text-floor: 1 new (fail), 3 baselined (warn), 1 stale, ' +
        '2 frames at unbaselined widths; run pnpm audit:stories:baseline <dom.json>',
    ])
  })
})

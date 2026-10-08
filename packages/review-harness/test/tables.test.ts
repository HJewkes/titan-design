import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { PinList } from '../page/PinList.tsx'
import { VariantCard } from '../page/VariantCard.tsx'
import { pinId, pinNumber } from '../page/pins.ts'
import {
  CLEAR_VERDICT_KEY,
  VERDICTS,
  VERDICT_KEYS,
  createReducer,
  initialState,
  numberKeyAction,
} from '../page/state.ts'
import { readFeedbackFiles } from '../src/calibration.ts'
import { REQUIRED_RATIO } from '../src/contrast.ts'
import { loadRound } from '../src/review.ts'
import { CHECK_KINDS, VerdictSchema, type Annotation, type CheckKind } from '../src/schema.ts'
import { sectionOfQuestion } from '../src/sections.ts'
import { manifest, sectioned } from './fixtures.ts'

describe('check kinds', () => {
  it('derives the kind type from the CHECK_KINDS table', () => {
    expectTypeOf<CheckKind>().toEqualTypeOf<(typeof CHECK_KINDS)[number]>()
    expectTypeOf(REQUIRED_RATIO).toEqualTypeOf<Record<CheckKind, number>>()
  })

  it('refuses to compile a threshold table that leaves a kind out', () => {
    // @ts-expect-error every check kind needs a threshold
    const partial: typeof REQUIRED_RATIO = { text: 4.5, 'large-text': 3 }
    expect(Object.keys(partial)).toHaveLength(CHECK_KINDS.length - 1)
  })

  it('gives every check kind exactly one threshold', () => {
    expect(Object.keys(REQUIRED_RATIO).sort()).toEqual([...CHECK_KINDS].sort())
  })
})

describe('the section of a question', () => {
  it('finds the section that asks it, and nothing for a question outside every section', () => {
    const m = sectioned()
    const [first] = m.sections ?? []
    expect(sectionOfQuestion(m, first.questionIds[0])?.id).toBe(first.id)
    expect(sectionOfQuestion(m, 'no-such-question')).toBeUndefined()
    expect(sectionOfQuestion(manifest(), 'q1')).toBeUndefined()
  })
})

describe('reading a JSON file', () => {
  const notJson = async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'titan-review-json-')), 'broken.json')
    await writeFile(path, '{ not json')
    return path
  }

  it('names the file when a round is not JSON', async () => {
    const path = await notJson()
    await expect(loadRound(path)).rejects.toThrow(`${path} is not JSON`)
  })

  it('names the file when a feedback file is not JSON', async () => {
    const path = await notJson()
    await expect(readFeedbackFiles([path])).rejects.toThrow(`${path} is not JSON`)
  })

  it('names the file it cannot read', async () => {
    const path = join(tmpdir(), 'titan-review-missing', 'feedback.json')
    await expect(readFeedbackFiles([path])).rejects.toThrow(`cannot read ${path}`)
  })
})

describe('verdict hotkeys', () => {
  const m = manifest()
  const variant = m.variants[0]

  it('gives every verdict exactly one hotkey, none shared', () => {
    const verdicts = VERDICTS.map((v) => v.verdict)
    expect([...verdicts].sort()).toEqual([...VerdictSchema.unwrap().options].sort())
    const keys = [...VERDICTS.map((v) => v.key), CLEAR_VERDICT_KEY]
    expect(new Set(keys).size).toBe(keys.length)
    expect(Object.keys(VERDICT_KEYS).sort()).toEqual([...keys].sort())
  })

  it('sets the verdict whose hotkey the card shows', () => {
    const markup = renderToStaticMarkup(
      createElement(VariantCard, {
        manifest: m,
        variant,
        draft: { verdict: null, comment: '', annotations: [] },
        index: 0,
        active: true,
        follow: false,
        annotate: false,
        focusPin: null,
        dispatch: () => {},
        onHitTesting: () => {},
      })
    )
    const shown = [...markup.matchAll(/<kbd>(\w)<\/kbd> (\w+)/g)].map(([, key, label]) => ({
      key,
      label,
    }))
    expect(shown).toEqual(VERDICTS.map(({ key, label }) => ({ key, label })))
    for (const { key, verdict } of VERDICTS)
      expect(numberKeyAction(m, { kind: 'variant', key: variant.key }, key)).toEqual({
        type: 'verdict',
        key: variant.key,
        verdict,
      })
  })

  it('clears the verdict on the clear hotkey', () => {
    expect(numberKeyAction(m, { kind: 'variant', key: variant.key }, CLEAR_VERDICT_KEY)).toEqual({
      type: 'verdict',
      key: variant.key,
      verdict: null,
    })
  })
})

describe('pin ids', () => {
  it('reads back the number a pin id was made with', () => {
    expect(pinNumber(pinId('A-wide', 12))).toBe(12)
    expect(pinNumber('A')).toBe(0)
  })

  it('numbers a new pin after the highest one, and the list shows that number', () => {
    const m = manifest()
    const reduce = createReducer(m)
    const pin = { width: 400, x: 1, y: 2, xPct: 0.1, yPct: 0.2 }
    const added = [1, 2].reduce(
      (s) => reduce(s, { type: 'addPin', key: 'A', pin }),
      initialState(m)
    )
    const pins: Annotation[] = added.draft.variants.A.annotations
    expect(pins.map((p) => p.id)).toEqual([pinId('A', 1), pinId('A', 2)])
    const markup = renderToStaticMarkup(
      createElement(PinList, { variantKey: 'A', pins, focusPin: null, dispatch: () => {} })
    )
    expect(markup).toContain('<span class="pin-label">2 · 400px')
  })
})

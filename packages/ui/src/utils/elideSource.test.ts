import { describe, it, expect } from 'vitest'
import { elideSource } from './elideSource'
import { ALL_EVIDENCE_CHIPS, beatFixture } from '../components/ui/chip/__fixtures__/evidence-chips'

const PREFIX_PIN = /^[A-Za-z][\w-]*@[0-9a-f]{7,40}:/
const SUFFIX_PIN = / @[0-9a-f]{7,40}$/
const PATH_LINE = /[\w.-]+\.\w+:L?\d+(?:-L?\d+)?/

// Derived independently of the implementation: the first pinned ref, else the first ref.
function leadAtoms(text: string): string[] {
  const refs = text.split('; ')
  const lead = refs.find((r) => PREFIX_PIN.test(r) || SUFFIX_PIN.test(r)) ?? refs[0]
  return [
    lead.match(PREFIX_PIN)?.[0],
    lead.match(PATH_LINE)?.[0],
    lead.match(SUFFIX_PIN)?.[0],
  ].filter((atom): atom is string => Boolean(atom))
}

const chipText = (beat: string, index = 0) => beatFixture(beat).chips[index].text

describe('elideSource', () => {
  it.each([30, 46, 60])('keeps the lead pin and path:L whole at a %i-char budget', (budget) => {
    for (const { text } of ALL_EVIDENCE_CHIPS) {
      const result = elideSource(text, budget)
      for (const atom of leadAtoms(text)) expect(result.text, text).toContain(atom)
    }
  })

  it('returns a string that already fits unchanged at level 0', () => {
    const text = chipText('a5-1-land')
    expect(elideSource(text, 60)).toEqual({ text, level: 0, droppedRefs: 0, fits: true })
  })

  it('collapses directories first', () => {
    expect(elideSource(chipText('a5-1-land'), 46)).toMatchObject({
      text: 'cd@7b2e04a1:…/settle.ts:202-224',
      level: 1,
    })
  })

  it('leads with the pinned ref when a plain ref comes before it', () => {
    expect(elideSource(chipText('a4-7-budget'), 46)).toEqual({
      text: 'ab@3f9c21e:…/budget-check.ts:40-52 +2',
      level: 3,
      droppedRefs: 2,
      fits: true,
    })
  })

  it('folds prose refs into one ellipsis before dropping file refs', () => {
    expect(elideSource(chipText('a4-7-budget'), 55)).toEqual({
      text: 'notes.md:54; ab@3f9c21e:…/budget-check.ts:40-52; …',
      level: 2,
      droppedRefs: 1,
      fits: true,
    })
  })

  it('trims extra line ranges, then a doc tail, then middle prose words', () => {
    expect(elideSource(chipText('a2-3-thesis'), 40).text).toBe('ab@3f9c21e:…/rebalance.ts:283-307…')
    expect(elideSource(chipText('b3-5-runtime'), 36).text).toBe('flow-rework-2026-09-30.md §2.4…')
    expect(elideSource(chipText('a6-12-merged'), 34).text).toBe('runner-cli guard … (run row 1419)')
  })

  it('keeps a suffix pin through the last level', () => {
    expect(elideSource(chipText('t5-2-walk'), 30)).toMatchObject({
      text: 'ledger.ts:L1225… @5d8e1a9c',
      level: 4,
      fits: true,
    })
  })

  it('stays inside the budget and counts exactly the refs it drops', () => {
    for (const budget of [30, 46, 60]) {
      for (const { text } of ALL_EVIDENCE_CHIPS) {
        const result = elideSource(text, budget)
        if (!result.fits) continue
        expect(result.text.length).toBeLessThanOrEqual(budget)
        const refCount = text.split('; ').length
        if (result.level < 3 || refCount === 1) continue
        expect(result.droppedRefs).toBe(refCount - 1)
        expect(result.text.endsWith(` +${refCount - 1}`), result.text).toBe(true)
      }
    }
  })

  it('reports no fit rather than splitting the pin when the budget is too small', () => {
    const result = elideSource(chipText('a5-1-land'), 20)
    expect(result.fits).toBe(false)
    expect(result.text).toContain('cd@7b2e04a1:')
    expect(result.text).toContain('settle.ts:202-224')
  })
})

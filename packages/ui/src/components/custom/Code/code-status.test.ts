import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { fcAssert } from '../../../test/property'
import {
  BUDGET_BAND_META,
  CODE_CHANGE_META,
  CODE_CHANGE_ORDER,
  CODE_COUPLING_CLASS_META,
  budgetBand,
  changeLabel,
  changeName,
  changeTone,
  scoreBand,
} from './code-status'

const cutoff = { value: 3000, label: 'Scary' }
const elevated = { value: 1000, label: 'Elevated' }

describe('change vocabulary', () => {
  it('gives every change kind a label, a name and a tone', () => {
    expect([...CODE_CHANGE_ORDER].sort()).toEqual(Object.keys(CODE_CHANGE_META).sort())
    for (const kind of CODE_CHANGE_ORDER) {
      const meta = CODE_CHANGE_META[kind]
      expect(meta.label).not.toBe('')
      expect(meta.name).not.toBe('')
      expect(meta.tone).toBeTruthy()
    }
  })

  it('makes worsened warning, and error over the cutoff, with no other kind changing', () => {
    expect(changeTone('worsened')).toBe('warning')
    expect(changeTone('worsened', true)).toBe('error')
    for (const kind of CODE_CHANGE_ORDER.filter((k) => k !== 'worsened')) {
      expect(changeTone(kind, true)).toBe(changeTone(kind, false))
    }
  })

  it('shows +magnitude for worsened and -magnitude for improved whatever the delta sign', () => {
    expect(changeLabel('worsened', 120)).toBe('+120')
    expect(changeLabel('worsened', -120)).toBe('+120')
    expect(changeLabel('improved', 120)).toBe('-120')
    expect(changeLabel('improved', -120)).toBe('-120')
    expect(changeLabel('worsened', 1200)).toBe('+1.2k')
  })

  it('falls back to the word for a missing, zero, NaN or infinite delta', () => {
    for (const delta of [undefined, 0, Number.NaN, Infinity, -Infinity]) {
      expect(changeLabel('worsened', delta)).toBe('Worsened')
      expect(changeLabel('improved', delta)).toBe('Improved')
      expect(changeName('worsened', delta)).toBe('Worsened')
    }
  })

  it('ignores a delta on kinds that do not show one', () => {
    expect(changeLabel('new-file', 50)).toBe('New')
    expect(changeName('resolved', 50)).toBe('Resolved')
  })

  it('states the kind in words and the magnitude in the accessible name', () => {
    expect(changeName('worsened', 120)).toBe('Worsened by 120')
    expect(changeName('improved', -1200)).toBe('Improved by 1.2k')
    expect(changeName('crossed-cutoff')).toBe('Crossed the cutoff')
    expect(changeName('entered')).toBe('Entered the ranking')
    expect(changeName('new-file')).toBe('New file')
  })
})

describe('scoreBand', () => {
  it('is over at exactly the cutoff and elevated at exactly the elevated value', () => {
    expect(scoreBand(3000, cutoff, elevated)).toBe('over')
    expect(scoreBand(2999, cutoff, elevated)).toBe('elevated')
    expect(scoreBand(1000, cutoff, elevated)).toBe('elevated')
    expect(scoreBand(999, cutoff, elevated)).toBe('watch')
  })

  it('is null without a cutoff, for a cutoff of 0, negative or NaN, and for a missing score', () => {
    expect(scoreBand(10)).toBeNull()
    for (const value of [0, -5, Number.NaN]) {
      expect(scoreBand(10, { value, label: 'x' })).toBeNull()
    }
    expect(scoreBand(null, cutoff)).toBeNull()
    expect(scoreBand(undefined, cutoff)).toBeNull()
    expect(scoreBand(Number.NaN, cutoff)).toBeNull()
  })

  it('ignores an elevated value at or above the cutoff', () => {
    expect(scoreBand(500, cutoff, { value: 3000, label: 'e' })).toBe('watch')
    expect(scoreBand(3500, cutoff, { value: 4000, label: 'e' })).toBe('over')
    expect(scoreBand(2000, cutoff, { value: 0, label: 'e' })).toBe('watch')
  })

  it('never gets better as the score rises', () => {
    const rank = { watch: 0, elevated: 1, over: 2 } as const
    fcAssert(
      fc.property(fc.nat(10_000), fc.nat(10_000), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        expect(rank[scoreBand(hi, cutoff, elevated)!]).toBeGreaterThanOrEqual(
          rank[scoreBand(lo, cutoff, elevated)!]
        )
      })
    )
  })
})

describe('budgetBand', () => {
  it('is over at the budget, near at 75%, within below, unbudgeted without a budget', () => {
    expect(budgetBand(100, 100)).toBe('over')
    expect(budgetBand(75, 100)).toBe('near')
    expect(budgetBand(74, 100)).toBe('within')
    expect(budgetBand(50)).toBe('unbudgeted')
  })

  it('honours nearRatio', () => {
    expect(budgetBand(50, 100, 0.5)).toBe('near')
  })

  it('treats a zero, negative or non-finite budget and a null value as unbudgeted', () => {
    expect(budgetBand(5, 0)).toBe('unbudgeted')
    expect(budgetBand(5, -1)).toBe('unbudgeted')
    expect(budgetBand(5, Number.NaN)).toBe('unbudgeted')
    expect(budgetBand(5, Infinity)).toBe('unbudgeted')
    expect(budgetBand(null, 100)).toBe('unbudgeted')
  })

  it('carries a flag only for over and near', () => {
    expect(BUDGET_BAND_META.over.flagTone).toBe('error')
    expect(BUDGET_BAND_META.near.flagTone).toBe('warning')
    expect(BUDGET_BAND_META.within.flagTone).toBeNull()
    expect(BUDGET_BAND_META.unbudgeted.word).toBeNull()
  })
})

describe('coupling class meta', () => {
  it('makes hidden coupling warning and the others neutral, each with a word', () => {
    expect(CODE_COUPLING_CLASS_META.hidden.tone).toBe('warning')
    expect(CODE_COUPLING_CLASS_META.expected.tone).toBe('neutral')
    expect(CODE_COUPLING_CLASS_META.unverifiable.tone).toBe('neutral')
    expect(CODE_COUPLING_CLASS_META.hidden.label).toBe('Hidden')
  })
})

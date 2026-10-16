import { describe, expect, it } from 'vitest'
import {
  blankIncreases,
  increases,
  mergeBaseline,
  mergeBlankList,
  parseReports,
} from './update-contrast-stories-baseline.mjs'

const row = (key, counts) => ({ key, id: key.split(' ')[0], theme: key.split(' ')[1], counts })

describe('parseReports', () => {
  it('reads rows across several shard files and skips blank lines', () => {
    const rows = parseReports([
      '{"key":"a dark","counts":{}}\n\n',
      '{"key":"b light","blank":"x"}\n',
    ])
    expect(rows.map((r) => r.key)).toEqual(['a dark', 'b light'])
  })

  it('keeps only the last attempt of a retried test', () => {
    const rows = parseReports([
      '{"key":"a dark","retry":0,"counts":{"x|y":2}}\n{"key":"a dark","retry":1,"counts":{"x|y":1}}\n',
    ])
    expect(rows).toEqual([{ key: 'a dark', retry: 1, counts: { 'x|y': 1 } }])
  })
})

describe('mergeBaseline', () => {
  it('lists only story-themes with violations, keys and pairs sorted', () => {
    const next = mergeBaseline({}, [
      row('b light', { 'z|z': 1, 'a|a': 2 }),
      row('a dark', {}),
      { key: 'c dark', id: 'c', theme: 'dark', blank: '#storybook-root has no child elements' },
    ])
    expect(next).toEqual({ 'b light': { 'a|a': 2, 'z|z': 1 } })
    expect(Object.keys(next['b light'])).toEqual(['a|a', 'z|z'])
  })

  it('drops an entry whose story now reports no violations', () => {
    const next = mergeBaseline({ 'a dark': { 'x|y': 1 } }, [row('a dark', {})])
    expect(next).toEqual({})
  })

  it('keeps an entry no row mentions, so a partial set of shards cannot shrink it', () => {
    const previous = { 'a dark': { 'x|y': 1 }, 'b dark': { 'x|y': 3 } }
    expect(mergeBaseline(previous, [row('a dark', { 'x|y': 1 })])).toEqual(previous)
  })

  it('keeps an entry whose story rendered blank, since a blank says nothing about contrast', () => {
    const previous = { 'a dark': { 'x|y': 1 } }
    const blankRow = { key: 'a dark', id: 'a', theme: 'dark', blank: 'zero-size box' }
    expect(mergeBaseline(previous, [blankRow])).toEqual(previous)
  })

  it('drops unmentioned entries only when asked', () => {
    const previous = { 'a dark': { 'x|y': 1 }, 'b dark': { 'x|y': 3 } }
    const next = mergeBaseline(previous, [row('a dark', { 'x|y': 1 })], { dropMissing: true })
    expect(next).toEqual({ 'a dark': { 'x|y': 1 } })
  })
})

describe('increases', () => {
  it('names every new story-theme, new pair and raised count', () => {
    const lines = increases(
      { 'a dark': { 'x|y': 2, 'p|q': 1 } },
      { 'a dark': { 'x|y': 3, 'p|q': 1, 'm|n': 1 }, 'b light': { 'x|y': 1 } }
    )
    expect(lines).toEqual(['a dark: x|y 2 -> 3', 'a dark: m|n 0 -> 1', 'b light: x|y 0 -> 1'])
  })

  it('is empty when the baseline only shrinks', () => {
    expect(increases({ 'a dark': { 'x|y': 2 } }, { 'a dark': { 'x|y': 1 } })).toEqual([])
  })
})

const blankRow = (id, theme) => ({ key: `${id} ${theme}`, id, theme, blank: 'zero-size box' })

describe('mergeBlankList', () => {
  it('lists a story blank in any theme, sorted, and drops one that now renders', () => {
    const next = mergeBlankList(
      ['rendered', 'still-blank'],
      [
        blankRow('still-blank', 'dark'),
        blankRow('still-blank', 'light'),
        row('rendered dark', {}),
        row('rendered light', {}),
        blankRow('new-blank', 'dark'),
        row('new-blank light', {}),
      ]
    )
    expect(next).toEqual(['new-blank', 'still-blank'])
  })

  it('keeps a listed story no row mentions unless asked to drop it', () => {
    expect(mergeBlankList(['unmentioned'], [row('a dark', {})])).toEqual(['unmentioned'])
    expect(mergeBlankList(['unmentioned'], [row('a dark', {})], { dropMissing: true })).toEqual([])
  })
})

describe('blankIncreases', () => {
  it('names every story the regeneration would add, and nothing when the list shrinks', () => {
    expect(blankIncreases(['a'], ['a', 'b'])).toEqual(['b: newly blank'])
    expect(blankIncreases(['a', 'b'], ['a'])).toEqual([])
  })
})

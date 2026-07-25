import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const { extractRawColors } = createRequire(import.meta.url)(
  '../../eslint-rules/raw-color-patterns.js'
) as { extractRawColors: (text: string) => Array<{ value: string; id: string }> }

const ids = (text: string) => extractRawColors(text).map((c) => c.id)
const values = (text: string) => extractRawColors(text).map((c) => c.value)

/**
 * Detection for the `no-raw-color` ratchet. The rule and its baseline generator
 * share this module, so a gap here silently widens the allowance rather than
 * failing loudly — worth pinning the notations directly.
 */
describe('extractRawColors', () => {
  it('detects every hex length', () => {
    expect(ids('#fff')).toEqual(['hex'])
    expect(ids('#ffff')).toEqual(['hex'])
    expect(ids('#1C1916')).toEqual(['hex'])
    expect(ids('#1C1916FF')).toEqual(['hex'])
  })

  it('detects functional notations, including ones with no occurrences today', () => {
    for (const text of [
      'rgb(1,2,3)',
      'rgba(1,2,3,0.5)',
      'hsl(1 2% 3%)',
      'hsla(1,2%,3%,0.5)',
      'oklch(0.5 0.2 30)',
      'lab(50% 40 59)',
      'color-mix(in oklch, red, blue)',
    ]) {
      expect(ids(text), text).toContain('functional')
    }
  })

  it('detects Tailwind colour utilities but not layout classes', () => {
    expect(ids('bg-red-500')).toEqual(['twPalette'])
    expect(ids('text-slate-200')).toEqual(['twPalette'])
    expect(ids('bg-white')).toEqual(['twAchromatic'])
    expect(ids('bg-[#1C1C1C]')).toEqual(['twArbitrary'])
    expect(ids('flex flex-row gap-2 p-4 rounded-lg')).toEqual([])
    // Semantic utilities are the desired output, not violations.
    expect(ids('bg-surface-raised text-text-primary')).toEqual([])
  })

  it('treats a bare keyword as a colour only when it is the whole value', () => {
    expect(ids('white')).toEqual(['named'])
    expect(ids('  black  ')).toEqual(['named'])
    // Prose and identifiers must not match, or every comment becomes a violation.
    expect(ids('white text on a black plane')).toEqual([])
    expect(ids('whiteboard')).toEqual([])
  })

  it('does not flag absence or inheritance', () => {
    // `transparent` encodes absence and `currentColor` defers to the cascade;
    // neither has a token equivalent.
    expect(ids('transparent')).toEqual([])
    expect(ids('currentColor')).toEqual([])
  })

  it('normalises case so #FFF and #fff are the same debt', () => {
    expect(values('#ABCDEF')).toEqual(['#abcdef'])
  })

  it('extracts every colour in a multi-colour literal', () => {
    // The baseline funds each one, so both have to come back.
    expect(values('linear-gradient(#111111, #222222)')).toEqual(['#111111', '#222222'])
  })
})

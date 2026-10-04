import { describe, it, expect } from 'vitest'
import {
  diffBaseline,
  nextBaseline,
  parseUndocumented,
  readBaseline,
  readReports,
} from '../../scripts/api-undocumented.mjs'

const REPORT = [
  '// @public',
  'export function Button(props: ButtonProps): JSX.Element;',
  '',
  '// @public (undocumented)',
  'export interface ButtonProps {',
  '    // (undocumented)',
  '    className?: string;',
  '    // Warning: something',
  '    // (undocumented)',
  "    'data-id'?: string;",
  '    label: string;',
  '}',
  '',
  '// @public (undocumented)',
  'export const SIZES: readonly string[];',
  '',
].join('\r\n')

describe('parseUndocumented', () => {
  it('lists undocumented exports and members, sorted, and skips documented ones', () => {
    expect(parseUndocumented(REPORT)).toEqual([
      'ButtonProps',
      "ButtonProps.'data-id'",
      'ButtonProps.className',
      'SIZES',
    ])
  })
})

describe('diffBaseline', () => {
  const current = { index: ['A', 'B'], pages: [] }

  it('reports a new undocumented name that is not baselined', () => {
    expect(diffBaseline(current, { index: ['A'], pages: [] }).added).toEqual(['index: B'])
  })

  it('reports a baselined name that is no longer undocumented as stale', () => {
    expect(diffBaseline({ index: ['A'] }, { index: ['A', 'B'] }).stale).toEqual(['index: B'])
  })

  it('reports nothing when the baseline matches', () => {
    expect(diffBaseline(current, current)).toEqual({ added: [], stale: [] })
  })
})

describe('nextBaseline', () => {
  const reports = { index: REPORT }

  it('refuses growth without allowIncrease', () => {
    expect(() => nextBaseline(reports, { index: ['SIZES'] }, false)).toThrow(/--allow-increase/)
  })

  it('accepts growth with allowIncrease', () => {
    expect(nextBaseline(reports, { index: [] }, true).index).toHaveLength(4)
  })

  it('shrinks without allowIncrease', () => {
    const baseline = {
      index: ['Gone', 'ButtonProps', "ButtonProps.'data-id'", 'ButtonProps.className', 'SIZES'],
    }
    expect(nextBaseline(reports, baseline, false).index).not.toContain('Gone')
  })
})

describe('committed API reports', () => {
  const { added, stale } = diffBaseline(collect(), readBaseline())

  it('have no (undocumented) export missing from undocumented-baseline.json', () => {
    expect(added, 'document these, or run `pnpm api:update -- --allow-increase`').toEqual([])
  })

  it('have no baselined name that is now documented or gone', () => {
    expect(stale, 'run `pnpm api:update` to shrink the baseline').toEqual([])
  })
})

function collect() {
  const reports = readReports() as Record<string, string>
  return Object.fromEntries(
    Object.entries(reports).map(([name, text]) => [name, parseUndocumented(text)])
  )
}

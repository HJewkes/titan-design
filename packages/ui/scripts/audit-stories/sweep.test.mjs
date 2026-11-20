// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { UsageError, parseOptions } from '../audit-stories.mjs'
import { SWEEP_BREAKPOINT_WIDTHS, mergeWidthRanges, sweepWidths } from './sweep.mjs'

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('sweepWidths', () => {
  it('covers 320..1440 in 40 px steps plus the breakpoint edges, sorted and unique', () => {
    const widths = sweepWidths()
    const steps = Array.from({ length: 29 }, (_, i) => 320 + i * 40)
    expect(widths).toEqual(
      [...new Set([...steps, 599, 600, 999, 1000, 1199, 1200])].sort((a, b) => a - b)
    )
    expect(widths[0]).toBe(320)
    expect(widths.at(-1)).toBe(1440)
  })

  it('uses the sm, md and lg breakpoints from the primitive tokens', () => {
    const source = readFileSync(resolve(uiDir, 'src/theme/tokens/primitives.ts'), 'utf8')
    const block = /primitiveBreakpoints = \{([^}]*)\}/.exec(source)[1]
    const bp = (name) => Number(new RegExp(`${name}:\\s*(\\d+)`).exec(block)[1])
    const edges = [bp('sm'), bp('md'), bp('lg')]
    expect(edges).toEqual([600, 1000, 1200])
    for (const edge of edges) {
      expect(SWEEP_BREAKPOINT_WIDTHS).toContain(edge)
      expect(sweepWidths()).toContain(edge)
    }
  })
})

describe('--sweep parsing', () => {
  it('audits the sweep widths', () => {
    expect(parseOptions(['--sweep']).widths).toEqual(sweepWidths())
  })

  it('refuses --sweep together with --widths', () => {
    expect(() => parseOptions(['--sweep', '--widths', '360'])).toThrow(UsageError)
  })
})

describe('mergeWidthRanges', () => {
  const audited = [320, 360, 400, 440, 1199, 1200]

  it('joins neighbours in the audited list and keeps gaps apart', () => {
    expect(mergeWidthRanges([1200, 320, 400, 360], audited)).toBe('320-400,1200')
  })

  it('prints a lone width bare', () => {
    expect(mergeWidthRanges([440], audited)).toBe('440')
  })

  it('joins a breakpoint pair that is adjacent in the audited list', () => {
    expect(mergeWidthRanges([1199, 1200], audited)).toBe('1199-1200')
  })
})

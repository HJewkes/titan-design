import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LABELS, METRICS_FILE, measureAdvance, measureAll } from './font-metrics.ts'

const SPACE_GROTESK = join(import.meta.dirname, '..', 'src', 'theme', 'fonts', 'space-grotesk', 'latin.woff2')
/** Kerning is not applied; on these labels the file measure and Chromium's canvas differ by 0.4 %. */
const TOLERANCE_EM = 0.003

interface Written {
  faces: ReturnType<typeof measureAll>
}
const written = () => JSON.parse(readFileSync(METRICS_FILE, 'utf8')) as Written

describe('font-metrics', () => {
  it('matches Chromium canvas widths of the L1 labels within kerning', () => {
    const m = measureAdvance(SPACE_GROTESK, 500, LABELS)

    expect(Math.abs(m.avgAdvance - 0.5242)).toBeLessThan(TOLERANCE_EM)
  })

  it('moves the advance with the weight axis through HVAR', () => {
    const light = measureAdvance(SPACE_GROTESK, 300, ['x'])
    const bold = measureAdvance(SPACE_GROTESK, 700, ['x'])

    expect(light.avgAdvance).toBe(0.594)
    expect(bold.avgAdvance).toBe(0.592)
  })

  it('reports the Space Grotesk x-height from the font file', () => {
    const { xHeight } = written().faces['space-grotesk']!.weights['400']!

    expect(xHeight).toBe(0.486)
  })

  it('has a committed font-metrics.json that equals a fresh measurement', () => {
    expect(written().faces).toEqual(measureAll())
  })
})

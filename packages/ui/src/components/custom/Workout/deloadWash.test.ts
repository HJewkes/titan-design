/**
 * The deload column is the product's deload magenta (titan-0201 round 5, human: "I believe
 * we are using a purple to reflect deload in other areas of the product, can we make the
 * deload shaded region use a dark translucent purple"). One semantic token, washed; the
 * marks drawn over it keep their contrast.
 */
import { describe, expect, it } from 'vitest'
import { DELOAD_WASH, trajectoryPalette } from './GoalTrajectoryPlot'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { WORKOUT_PILL_DELOAD } from '../../../theme/extracted-colors-dataviz'

const dark = getSemanticColors('dark')

function rgb(value: string): [number, number, number] {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (hex) return [1, 2, 3].map((i) => parseInt(hex[i], 16)) as [number, number, number]
  const parts = /rgba?\(([^)]+)\)/.exec(value)?.[1].split(',').map(Number) ?? []
  return [parts[0], parts[1], parts[2]]
}

const channel = (c: number) =>
  c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4
const luminance = (c: [number, number, number]) =>
  0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const over = (fg: [number, number, number], alpha: number, bg: [number, number, number]) =>
  fg.map((v, i) => Math.round(bg[i] * (1 - alpha) + v * alpha)) as [number, number, number]

describe('the deload column', () => {
  const palette = trajectoryPalette('dark', 'base', 'on_track')

  it('washes the deload token, the same magenta WorkoutPill and WeekRow use', () => {
    expect(dark['status-deload']).toBe(WORKOUT_PILL_DELOAD)
    expect(palette.deload).toBe(`rgba(186, 41, 150, ${String(DELOAD_WASH)})`)
  })

  it('leaves every mark over it its contrast, and reads as its own column', () => {
    const plane = rgb(palette.plane)
    const column = over(rgb(dark['status-deload']), DELOAD_WASH, plane)
    expect(contrast(rgb(dark['status-success']), column)).toBeGreaterThan(4.5)
    expect(contrast(rgb(dark['brand-primary']), column)).toBeGreaterThan(4.5)
    expect(contrast(rgb(palette.rule), column)).toBeGreaterThan(4.5)
    expect(contrast(rgb(palette.bandHue), column)).toBeGreaterThan(2.5)
    // Visible as a column, and never so strong that it reads as a filled block. The floor
    // fits the owner's round-7 pick of 0.12 (1.086); 0.08 at 1.047 was too faint to pick.
    expect(contrast(column, plane)).toBeGreaterThan(1.08)
    expect(contrast(column, plane)).toBeLessThan(1.5)
  })
})

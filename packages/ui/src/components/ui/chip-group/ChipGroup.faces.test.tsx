import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { capturedByNode } from '../../../test/classname-capture'
import { chipLightContrastExceptions } from '../../../test/chip-contrast'
import { compositeOver, contrast } from '../../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'
import type { ChipColor } from '../chip'
import { ChipGroup } from './ChipGroup'
import { chipGroupFixtures } from './fixtures'

const { items } = chipGroupFixtures.default

const renderGroup = (color?: ChipColor) =>
  render(<ChipGroup label="Kind" items={items} color={color} />)

const chipClasses = (name: string) =>
  (capturedByNode.get(screen.getByRole('radio', { name })) ?? '').split(/\s+/)

const TEXT_COLOUR = /^text-(?!xs$)/

const labelOnFill = (mode: ThemeMode, fillClass: string, labelClass: string) => {
  const colors: Record<string, string> = getSemanticColors(mode)
  const fill = compositeOver(colors[fillClass.slice(3)], colors['surface-base'])
  return contrast(compositeOver(colors[labelClass.slice(5)], fill), fill)
}

describe('ChipGroup face contrast', () => {
  const rows = (['dark', 'light'] as const).flatMap((mode) =>
    (['primary', 'default'] as const).flatMap((color) =>
      [true, false].map((isSelected) => ({ mode, color, isSelected }))
    )
  )
  // Chip.test.tsx asserts each declared light miss as a miss; ChipGroup inherits that exception list.
  const isException = (row: (typeof rows)[number]) =>
    row.mode === 'light' && row.isSelected && chipLightContrastExceptions.includes(row.color)

  it.each(rows.filter((row) => !isException(row)))(
    '$mode $color selected=$isSelected label reads >= 4.5 on surface-base',
    ({ mode, color, isSelected }) => {
      renderGroup(color)
      const classes = chipClasses(isSelected ? 'All, 48' : 'Clips, 12')
      const fill = classes.find((c) => c.startsWith('bg-'))
      const label = classes.find((c) => TEXT_COLOUR.test(c))
      expect(fill && label).toBeTruthy()
      expect(labelOnFill(mode, fill as string, label as string)).toBeGreaterThanOrEqual(4.5)
    }
  )

  // Decision 0003 names the light brand solid an exception: white on orange[500], 3.74. The owner
  // kept it for ChipGroup's selected chip, so the story baseline carries this one pair.
  it('light primary selected reads the brand solid cell, the declared white-on-orange[500] miss', () => {
    renderGroup('primary')
    expect(chipClasses('All, 48')).toEqual(
      expect.arrayContaining(['bg-brand-primary-solid', 'text-on-brand-primary'])
    )
    const light = getSemanticColors('light')
    expect(light['brand-primary-solid']).toBe(primitiveRamps.orange[500])
    expect(light['on-brand-primary']).toBe(primitiveColors.white)
    const ratio = labelOnFill('light', 'bg-brand-primary-solid', 'text-on-brand-primary')
    expect(ratio).toBeCloseTo(3.74, 2)
    expect(chipLightContrastExceptions).toContain('primary')
  })
})

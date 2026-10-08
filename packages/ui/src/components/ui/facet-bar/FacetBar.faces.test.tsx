import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { capturedByNode } from '../../../test/classname-capture'
import { compositeOver, contrast } from '../../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import type { ChipColor } from '../chip'
import { chipLightContrastExceptions } from '../../../test/chip-contrast'
import { FacetBar } from './FacetBar'
import { facetBarFixtures } from './fixtures'

const { options, defaultValue } = facetBarFixtures.default

const renderBar = (color?: ChipColor) =>
  render(<FacetBar label="Record" options={options} defaultValue={defaultValue} color={color} />)

const classesOf = (node: Element) => (capturedByNode.get(node) ?? '').split(/\s+/)
const chip = (label: string) => screen.getByRole('button', { name: new RegExp(label) })
const chipClasses = (label: string) => classesOf(chip(label))
const countClasses = (count: string) => classesOf(screen.getByText(count))

const TEXT_COLOUR = /^text-(?!xs$)/

describe('FacetBar faces, real Chip', () => {
  it('primary: selected carries the solid face, unselected the subtle face, none an outline border', () => {
    renderBar()
    expect(chipClasses('Notes')).toEqual(
      expect.arrayContaining(['bg-brand-primary-solid', 'text-on-brand-primary'])
    )
    for (const label of ['Sources', 'Drafts']) {
      expect(chipClasses(label)).toEqual(
        expect.arrayContaining(['bg-brand-primary-subtle', 'text-on-brand-primary-subtle'])
      )
    }
    for (const label of ['Notes', 'Sources', 'Drafts']) {
      expect(chipClasses(label)).not.toContain('border-brand-primary')
    }
  })

  it('default colour: selected is the inverse face, unselected reads text-primary', () => {
    renderBar('default')
    expect(chipClasses('Notes')).toEqual(
      expect.arrayContaining(['bg-text-primary', 'text-text-inverse'])
    )
    expect(chipClasses('Sources')).toContain('text-text-primary')
    expect(chipClasses('Drafts')).toContain('text-text-primary')
  })

  it.each([
    ['selected', '128'],
    ['unselected', '42'],
  ])('the %s count inherits the label colour and sets none of its own', (_state, count) => {
    renderBar()
    const classes = countClasses(count)
    expect(classes).toContain('text-inherit')
    expect(classes.filter((c) => /opacity/.test(c))).toEqual([])
    expect(classes.filter((c) => TEXT_COLOUR.test(c) && c !== 'text-inherit')).toEqual([])
  })

  it('pressing an unselected chip moves it to the selected class set, and both keep a border', () => {
    renderBar()
    expect(chipClasses('Sources')).toContain('border')
    fireEvent.click(chip('Sources'))
    expect(chipClasses('Sources')).toEqual(
      expect.arrayContaining(['bg-brand-primary-solid', 'text-on-brand-primary', 'border'])
    )
    expect(chipClasses('Sources')).not.toContain('bg-brand-primary-subtle')
  })
})

describe('FacetBar face contrast', () => {
  const rows = (['dark', 'light'] as const).flatMap((mode) =>
    (['primary', 'default'] as const).flatMap((color) =>
      [true, false].map((isSelected) => ({ mode, color, isSelected }))
    )
  )
  // Chip.test.tsx asserts each declared light miss as a miss; FacetBar inherits that exception list.
  const isException = (row: (typeof rows)[number]) =>
    row.mode === 'light' && row.isSelected && chipLightContrastExceptions.includes(row.color)

  const labelOnFill = (mode: ThemeMode, fillClass: string, labelClass: string) => {
    const colors: Record<string, string> = getSemanticColors(mode)
    const fill = compositeOver(colors[fillClass.slice(3)], colors['surface-base'])
    return contrast(compositeOver(colors[labelClass.slice(5)], fill), fill)
  }

  it.each(rows.filter((row) => !isException(row)))(
    '$mode $color selected=$isSelected label reads >= 4.5 on surface-base',
    ({ mode, color, isSelected }) => {
      renderBar(color)
      const classes = chipClasses(isSelected ? 'Notes' : 'Sources')
      const fill = classes.find((c) => c.startsWith('bg-'))
      const label = classes.find((c) => TEXT_COLOUR.test(c))
      expect(fill && label).toBeTruthy()
      expect(labelOnFill(mode, fill as string, label as string)).toBeGreaterThanOrEqual(4.5)
    }
  )
})

describe('FacetBar label contrast', () => {
  it('reads the label from text-secondary', () => {
    render(<FacetBar label="Record" options={facetBarFixtures.default.options} />)
    const label = screen.getByText('Record')
    expect(classesOf(label)).toContain('text-text-secondary')
    expect(classesOf(label)).not.toContain('text-text-tertiary')
  })

  it.each(['dark', 'light'] as const)('%s: the label reads 4.5 or more on surface-base', (mode) => {
    const colors = getSemanticColors(mode)
    expect(contrast(colors['text-secondary'], colors['surface-base'])).toBeGreaterThanOrEqual(4.5)
  })
})

import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { capturedByNode } from '../../../../test/classname-capture'
import { Typography } from '../../typography'
import { chartText } from './chartText'

const classesOf = (set: string) => set.split(/\s+/)

describe('chartText', () => {
  it('sets tick numerals in mono regular tertiary', () => {
    expect(classesOf(chartText.tick)).toEqual(
      expect.arrayContaining(['font-mono', 'text-2xs', 'font-normal', 'text-text-tertiary'])
    )
  })

  it('sets categories exactly as Typography microLabel in secondary', () => {
    render(createElement(Typography, { variant: 'microLabel', color: 'secondary' }, 'Push'))
    expect(chartText.category).toBe(capturedByNode.get(screen.getByText('Push')))
  })

  it.each(['axisTitle', 'legend'] as const)(
    'sets %s in the heading face, secondary, in sentence case',
    (role) => {
      const classes = classesOf(chartText[role])
      expect(classes).toEqual(
        expect.arrayContaining(['font-heading', 'text-xs', 'text-text-secondary'])
      )
      expect(classes).not.toContain('uppercase')
    }
  )

  it('weights the axis title above the legend', () => {
    expect(classesOf(chartText.axisTitle)).toContain('font-semibold')
    expect(classesOf(chartText.legend)).toContain('font-medium')
  })

  it('sets data labels in the heading face and leaves the ink to the chart', () => {
    const classes = classesOf(chartText.dataLabel)
    expect(classes).toEqual(['font-heading', 'text-2xs', 'font-semibold'])
    expect(classes.some((c) => c.startsWith('text-text-'))).toBe(false)
  })

  it('keeps every role on the type scale, with no arbitrary px size', () => {
    for (const set of Object.values(chartText)) expect(set).not.toMatch(/text-\[\d+px\]/)
  })
})

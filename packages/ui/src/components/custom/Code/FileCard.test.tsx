import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FileCard } from './FileCard'
import { fileCardRows, metricDeltaText, metricValueText } from './file-card-rows'
import { fileCardFixture } from './fixtures'

const CODEWATCH_LABELS = [
  'Lines',
  'Functions',
  'Max complexity',
  'Max nesting',
  'Fan-in',
  'Fan-out',
  'Instability',
  'Churn',
]

describe('fileCardRows', () => {
  // Mutation caught: dropping the sort leaves the rows in input order.
  it('orders known metrics as codewatch’s panel does, unknown ones after in input order', () => {
    const rows = fileCardRows([
      { key: 'zeta', value: 1 },
      { key: 'fan_out', value: 2 },
      { key: 'loc', value: 3 },
      { key: 'alpha', value: 4 },
      { key: 'cyclomatic_sum', value: 5 },
    ])
    expect(rows.map((r) => r.key)).toEqual(['loc', 'cyclomatic_sum', 'fan_out', 'zeta', 'alpha'])
  })

  // Mutation caught: keeping duplicates repeats a fact on the card (design floor F3).
  it('keeps the first of two metrics with one key', () => {
    const rows = fileCardRows([
      { key: 'loc', value: 3 },
      { key: 'loc', value: 99 },
    ])
    expect(rows).toEqual([{ key: 'loc', value: 3, label: 'Lines' }])
  })
})

describe('metric text', () => {
  it('trims integers, rounds decimals and dashes a missing value', () => {
    expect(metricValueText(412)).toBe('412')
    expect(metricValueText(0.3125)).toBe('0.31')
    expect(metricValueText(null)).toBe('—')
  })

  // Mutation caught: an unsigned delta reads as the value of a second metric.
  it('signs a delta and drops a zero one', () => {
    expect(metricDeltaText(3)).toBe('+3')
    expect(metricDeltaText(-0.04)).toBe('-0.04')
    expect(metricDeltaText(0)).toBeNull()
  })
})

describe('FileCard', () => {
  // Mutation caught: rendering `metrics` before the shorthand props, or unsorted.
  it('renders its rows in codewatch’s panel order', () => {
    render(<FileCard {...fileCardFixture} />)
    const rows = within(screen.getByTestId('file-card-rows'))
    const labels = CODEWATCH_LABELS.map((label) => rows.getByText(label))
    labels.slice(1).forEach((label, i) => {
      expect(
        labels[i].compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    })
  })

  it('shows the path, the status word and a missing value as a dash', () => {
    render(<FileCard {...fileCardFixture} />)
    expect(screen.getByText('parser-07.ts')).toBeInTheDocument()
    expect(screen.getByText('Renamed')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('p92')).toBeInTheDocument()
  })

  it('renders only the path when it has no metrics', () => {
    render(<FileCard path="packages/atlas/src/core/parser-00.ts" />)
    expect(screen.queryByTestId('file-card-rows')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FileCard {...fileCardFixture} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

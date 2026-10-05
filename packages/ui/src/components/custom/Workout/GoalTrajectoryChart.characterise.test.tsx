import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { capturedClassNames } from '../../../test/classname-capture'

const base = {
  expected: [
    { weekIndex: 1, low: 175, high: 175 },
    { weekIndex: 2, low: 177, high: 179 },
    { weekIndex: 3, low: 179, high: 183 },
    { weekIndex: 4, low: 181, high: 187 },
    { weekIndex: 5, low: 183, high: 191 },
    { weekIndex: 6, low: 185, high: 195 },
  ],
  committed: 185,
  stretch: 195,
  actuals: [
    { weekIndex: 1, value: 175 },
    { weekIndex: 2, value: 178 },
    { weekIndex: 3, value: 183, isPR: true },
  ],
  weeks: [1, 2, 3, 4, 5, 6].map((index) => ({ index, ...(index === 5 ? { isDeload: true } : {}) })),
  mesoBoundaries: [6],
  width: 600,
  height: 300,
  metricLabel: 'Bench top load',
  status: 'on_track' as const,
  animate: false,
}

const cases = {
  plotted: {
    ...base,
    nextTarget: { weekIndex: 4, value: 185, label: 'next week: 185 x 5' },
    currentWeek: 4,
  },
  'rights and axis': { ...base, referenceLabelSide: 'right' as const, yAxisLabels: true },
  empty: { ...base, expected: [], actuals: [], status: 'calibrating' as const },
}

function accessibilityTree(root: HTMLElement): string[] {
  return [root, ...Array.from(root.querySelectorAll('*'))].map((el) => {
    const attrs = el
      .getAttributeNames()
      .filter(
        (n) => n === 'role' || n.startsWith('aria-') || n === 'data-testid' || n === 'tabindex'
      )
      .map((n) => `${n}=${el.getAttribute(n) ?? ''}`)
    return `${el.tagName.toLowerCase()} ${attrs.join(' ')}`.trim()
  })
}

describe('GoalTrajectoryChart characterisation (TD-612)', () => {
  it.each(Object.entries(cases))('keeps classes and accessibility tree: %s', (_name, props) => {
    const { container } = render(<GoalTrajectoryChart {...props} />)
    expect({
      classNames: Object.fromEntries(
        [...capturedClassNames].sort(([a], [b]) => a.localeCompare(b))
      ),
      tree: accessibilityTree(container),
    }).toMatchSnapshot()
  })
})

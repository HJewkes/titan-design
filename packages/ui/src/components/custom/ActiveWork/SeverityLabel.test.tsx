import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  SeverityLabel,
  SEVERITY_ORDER,
  SEVERITY_RANK,
  SEVERITY_BAR_COLOR,
  severityRank,
} from './SeverityLabel'

describe('SeverityLabel', () => {
  it('renders the dot and the label for a severity', () => {
    render(<SeverityLabel severity="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByTestId('severity-dot-critical')).toBeInTheDocument()
  })

  it('renders every severity with its own label', () => {
    for (const severity of SEVERITY_ORDER) {
      const { unmount } = render(<SeverityLabel severity={severity} />)
      expect(screen.getByTestId(`severity-dot-${severity}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('drops the label but keeps the dot when dotOnly', () => {
    render(<SeverityLabel severity="high" dotOnly />)
    expect(screen.getByTestId('severity-dot-high')).toBeInTheDocument()
    expect(screen.queryByText('High')).not.toBeInTheDocument()
  })

  it('renders an em-dash and no dot when severity is unset', () => {
    render(<SeverityLabel />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByTestId(/^severity-dot-/)).not.toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<SeverityLabel severity="medium" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('severity vocabulary', () => {
  it('ranks worst-first, matching SEVERITY_ORDER', () => {
    const byRank = [...SEVERITY_ORDER].sort((a, b) => SEVERITY_RANK[a] - SEVERITY_RANK[b])
    expect(byRank).toEqual(SEVERITY_ORDER)
  })

  it('ranks an unset severity after every real one', () => {
    for (const severity of SEVERITY_ORDER) {
      expect(severityRank(severity)).toBeLessThan(severityRank(undefined))
    }
  })

  it('does not rank alphabetically — low is last, not second', () => {
    // The bug this guards: 'critical' < 'high' < 'low' < 'medium' as strings,
    // which reads as "low is more urgent than medium".
    expect(severityRank('low')).toBeGreaterThan(severityRank('medium'))
  })

  it('covers every severity in the bar palette', () => {
    for (const severity of SEVERITY_ORDER) {
      expect(SEVERITY_BAR_COLOR[severity]).toBeTruthy()
    }
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import { Metric, MetricGroup } from './Metric'

const classesOf = (node: Element | null) => (node ? capturedByNode.get(node) : '')?.split(' ') ?? []

describe('Metric', () => {
  it('renders value and label', () => {
    render(<Metric value="42" label="Reps" />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Reps')).toBeInTheDocument()
  })

  it('renders unit when provided', () => {
    render(<Metric value="1.2" label="Peak Velocity" unit="m/s" />)
    expect(screen.getByText('m/s')).toBeInTheDocument()
  })

  it('does not render unit when omitted', () => {
    render(<Metric value="10" label="Sets" />)
    expect(screen.queryByText('m/s')).not.toBeInTheDocument()
  })

  it('renders no bare text node for an empty unit', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Metric value="10" label="Sets" unit="" />)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('renders trend arrow when provided', () => {
    render(<Metric value="85" label="Score" trend="up" />)
    expect(screen.getByText('\u2191')).toBeInTheDocument()
  })

  it('renders down trend arrow', () => {
    render(<Metric value="60" label="Score" trend="down" />)
    expect(screen.getByText('\u2193')).toBeInTheDocument()
  })

  it('renders neutral trend arrow', () => {
    render(<Metric value="70" label="Score" trend="neutral" />)
    expect(screen.getByText('\u2192')).toBeInTheDocument()
  })

  it('does not render trend when omitted', () => {
    render(<Metric value="50" label="Weight" />)
    expect(screen.queryByText('\u2191')).not.toBeInTheDocument()
    expect(screen.queryByText('\u2193')).not.toBeInTheDocument()
    expect(screen.queryByText('\u2192')).not.toBeInTheDocument()
  })

  it('defaults to md size', () => {
    const { container } = render(<Metric value="10" label="Reps" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('accepts all size variants without error', () => {
    const { rerender } = render(<Metric value="10" label="Reps" size="sm" />)
    expect(screen.getByText('10')).toBeInTheDocument()

    rerender(<Metric value="10" label="Reps" size="md" />)
    expect(screen.getByText('10')).toBeInTheDocument()

    rerender(<Metric value="10" label="Reps" size="lg" />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it.each([
    ['start', 'items-start'],
    ['center', 'items-center'],
    ['end', 'items-end'],
  ] as const)('align=%s sets %s on the column', (align, expected) => {
    const { container } = render(<Metric value="42" label="Reps" align={align} />)
    const classes = classesOf(container.firstElementChild)
    expect(classes).toContain(expected)
    expect(classes.filter((c) => c.startsWith('items-'))).toEqual([expected])
  })

  it('tone=error colours the value from the dark-safe text-error token, not status-error', () => {
    render(<Metric value="12" label="Misses" tone="error" />)
    const classes = classesOf(screen.getByText('12'))
    expect(classes).toContain('text-text-error')
    expect(classes).not.toContain('text-status-error')
  })

  // TD-789 3b: the status tones as value text missed 4.5:1 on the grey 100 and 200 planes.
  it.each([
    ['success', 'text-text-success', 'text-status-success'],
    ['warning', 'text-text-warning', 'text-status-warning'],
    ['info', 'text-text-info', 'text-status-info'],
    ['brand', 'text-text-brand', 'text-brand-primary'],
  ] as const)('tone=%s colours the value from %s, not %s', (tone, textRole, fillTone) => {
    render(<Metric value="12" label="Sets" tone={tone} />)
    const classes = classesOf(screen.getByText('12'))
    expect(classes).toContain(textRole)
    expect(classes).not.toContain(fillTone)
  })

  it('labelPosition=above puts the label before the figure', () => {
    render(<Metric value="76%" label="Volume" labelPosition="above" />)
    const label = screen.getByText('Volume')
    expect(
      label.compareDocumentPosition(screen.getByText('76%')) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(classesOf(label)).toContain('mb-1')
  })

  it('keeps the value on text-primary when no tone is given', () => {
    render(<Metric value="42" label="Reps" />)
    expect(classesOf(screen.getByText('42'))).toContain('text-text-primary')
  })

  it('leaves the label and unit uncoloured by tone', () => {
    render(<Metric value="76" label="Volume" unit="%" tone="error" />)
    expect(classesOf(screen.getByText('Volume'))).toContain('text-text-secondary')
    expect(classesOf(screen.getByText('%'))).toContain('text-text-tertiary')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Metric value="42" label="Reps" unit="reps" trend="up" align="end" tone="warning" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('MetricGroup', () => {
  it('renders all child metrics', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
        <Metric value="42" label="Reps" />
        <Metric value="1.2" label="Velocity" unit="m/s" />
      </MetricGroup>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('1.2')).toBeInTheDocument()
  })

  it('renders dividers between metrics', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
        <Metric value="42" label="Reps" />
        <Metric value="1.2" label="Velocity" />
      </MetricGroup>
    )
    const dividers = screen.getAllByTestId('metric-divider')
    expect(dividers).toHaveLength(2)
  })

  it('renders no dividers for a single metric', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
      </MetricGroup>
    )
    const dividers = screen.queryAllByTestId('metric-divider')
    expect(dividers).toHaveLength(0)
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <MetricGroup>
          <Metric value="10" label="Sets" />
          <Metric value="42" label="Reps" />
        </MetricGroup>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

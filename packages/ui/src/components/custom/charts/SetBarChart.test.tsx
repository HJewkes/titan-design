import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetBarChart, type SetSlot } from './SetBarChart'

const reps = (values: number[]): SetSlot[] => values.map((v) => ({ kind: 'rep', value: v }))
const silver = () => '#C7CBD1'

describe('SetBarChart bars', () => {
  it('renders one bar per rep slot with the prefixed testID', () => {
    render(
      <SetBarChart slots={reps([0.9, 0.8, 0.7])} colorFor={silver} height={200} testIDPrefix="t" />
    )
    expect(screen.getAllByTestId(/^t-bar-\d+$/)).toHaveLength(3)
  })

  it('colors each bar via colorFor(value)', () => {
    render(
      <SetBarChart
        slots={reps([1.0, 0.4])}
        colorFor={(v) => (v >= 0.75 ? '#2ED573' : '#D14343')}
        height={200}
        testIDPrefix="t"
      />
    )
    expect(screen.getByTestId('t-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getByTestId('t-bar-1')).toHaveStyle({ backgroundColor: '#D14343' })
  })

  it('shows a per-bar value label only when showValueLabels is on', () => {
    const { rerender } = render(
      <SetBarChart slots={reps([0.9])} colorFor={silver} height={200} testIDPrefix="t" />
    )
    expect(screen.queryByTestId('t-label-0')).not.toBeInTheDocument()
    rerender(
      <SetBarChart
        slots={reps([0.9])}
        colorFor={silver}
        height={200}
        testIDPrefix="t"
        showValueLabels
        formatValue={(v) => v.toFixed(2)}
      />
    )
    expect(screen.getByTestId('t-label-0')).toHaveTextContent('0.90')
  })
})

describe('SetBarChart todo placeholders', () => {
  it('appends dashed todo stubs up to targetReps', () => {
    render(
      <SetBarChart
        slots={reps([0.9, 0.8])}
        colorFor={silver}
        height={200}
        targetReps={5}
        testIDPrefix="t"
      />
    )
    expect(screen.getAllByTestId(/^t-bar-\d+$/)).toHaveLength(2)
    expect(screen.getAllByTestId('t-slot-todo')).toHaveLength(3)
  })

  it('appends no todo stubs when the slots already meet targetReps', () => {
    render(
      <SetBarChart
        slots={reps([0.9, 0.8, 0.7])}
        colorFor={silver}
        height={200}
        targetReps={3}
        testIDPrefix="t"
      />
    )
    expect(screen.queryByTestId('t-slot-todo')).not.toBeInTheDocument()
  })
})

describe('SetBarChart minColumns padding', () => {
  it('pads the rendered columns to minColumns with todo stubs (dual alignment)', () => {
    render(
      <SetBarChart
        slots={reps([0.9, 0.8])}
        colorFor={silver}
        height={200}
        minColumns={6}
        testIDPrefix="t"
      />
    )
    expect(screen.getAllByTestId(/^t-bar-\d+$/)).toHaveLength(2)
    // 6 columns − 2 rep bars = 4 padded todo cells.
    expect(screen.getAllByTestId('t-slot-todo')).toHaveLength(4)
  })

  it('does not shrink below the natural slot count when minColumns is smaller', () => {
    render(
      <SetBarChart
        slots={reps([0.9, 0.8, 0.7])}
        colorFor={silver}
        height={200}
        minColumns={1}
        testIDPrefix="t"
      />
    )
    expect(screen.getAllByTestId(/^t-bar-\d+$/)).toHaveLength(3)
    expect(screen.queryByTestId('t-slot-todo')).not.toBeInTheDocument()
  })
})

describe('SetBarChart todoVariant', () => {
  it('solid (default) draws a filled to-do section (no dashed border)', () => {
    render(
      <SetBarChart slots={reps([0.9])} colorFor={silver} height={200} targetReps={2} testIDPrefix="t" />
    )
    expect(screen.getByTestId('t-slot-todo')).not.toHaveStyle({ borderTopStyle: 'dashed' })
  })

  it('dashed draws a dashed outline to-do stub (ROM keeps this)', () => {
    render(
      <SetBarChart
        slots={reps([0.9])}
        colorFor={silver}
        height={200}
        targetReps={2}
        todoVariant="dashed"
        testIDPrefix="t"
      />
    )
    expect(screen.getByTestId('t-slot-todo')).toHaveStyle({ borderTopStyle: 'dashed' })
  })
})

describe('SetBarChart empty columns', () => {
  it('renders an empty cell for a rep column with no value (dual index-lock)', () => {
    const slots: SetSlot[] = [
      { kind: 'rep', value: 0.9 },
      { kind: 'empty' },
      { kind: 'rep', value: 0.8 },
    ]
    render(<SetBarChart slots={slots} colorFor={silver} height={200} testIDPrefix="t" />)
    expect(screen.getAllByTestId(/^t-bar-\d+$/)).toHaveLength(2)
    expect(screen.getByTestId('t-slot-empty')).toBeInTheDocument()
  })
})

describe('SetBarChart set-type windows', () => {
  it('renders variable and continue window stubs from explicit slots', () => {
    const slots: SetSlot[] = [
      { kind: 'rep', value: 0.9 },
      { kind: 'variable' },
      { kind: 'continue' },
    ]
    render(<SetBarChart slots={slots} colorFor={silver} height={200} testIDPrefix="t" />)
    expect(screen.getByTestId('t-slot-variable')).toBeInTheDocument()
    expect(screen.getByTestId('t-slot-continue')).toBeInTheDocument()
  })
})

describe('SetBarChart reference overlay', () => {
  it('hands the painter the chart geometry (scaleDenom, plotHeight, yOf, best)', () => {
    let captured: { best: number; plotHeight: number } | null = null
    render(
      <SetBarChart
        slots={reps([0.6, 1.0, 0.8])}
        colorFor={silver}
        height={200}
        showValueLabels
        renderReference={(g) => {
          captured = { best: g.best, plotHeight: g.plotHeight }
          return null
        }}
        testIDPrefix="t"
      />
    )
    expect(captured).not.toBeNull()
    expect(captured!.best).toBeCloseTo(1.0)
    // plotHeight = height − (label-row height 16 + label gap 3) when labels show.
    expect(captured!.plotHeight).toBe(181)
  })
})

describe('SetBarChart accessibility', () => {
  it('reads as an image with the supplied label', () => {
    render(
      <SetBarChart
        slots={reps([0.9, 0.8])}
        colorFor={silver}
        height={200}
        accessibilityLabel="Depth chart, 2 reps"
        testIDPrefix="t"
      />
    )
    expect(screen.getByLabelText('Depth chart, 2 reps')).toBeInTheDocument()
  })

  it('has no violations', async () => {
    const { container } = render(
      <SetBarChart
        slots={reps([0.9, 0.8, 0.7])}
        colorFor={silver}
        height={200}
        targetReps={5}
        accessibilityLabel="chart"
        testIDPrefix="t"
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

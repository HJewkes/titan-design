import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionHeader, type SessionHeaderPlanEntry } from './SessionHeader'

const PLAN: SessionHeaderPlanEntry[] = [
  { name: 'Seated Row', sets: 3 },
  { name: 'Incline DB', sets: 3 },
  { name: 'Chest Press', sets: 2 },
  { name: 'Calf Raise', sets: 2 },
  { name: 'Face Pull', sets: 2 },
] // total = 12

const liveProps = {
  title: 'Pull A · Intensification',
  plan: PLAN,
  setsDone: 7.2,
  elapsedMs: (42 * 60 + 18) * 1000,
  budgetMs: 60 * 60 * 1000,
  metrics: [
    { label: 'Volume', value: '76%' },
    { label: 'Load', value: '7.3k' },
    { label: 'Fatigue', value: 'MOD' },
  ],
}

describe('SessionHeader', () => {
  it('renders the session title', () => {
    render(<SessionHeader {...liveProps} />)
    expect(screen.getByTestId('session-rail-title')).toHaveTextContent('Pull A · Intensification')
  })

  describe('live · behind pace', () => {
    it('shows the floored sets-done over the total', () => {
      render(<SessionHeader {...liveProps} />)
      expect(screen.getByTestId('session-rail-sets')).toHaveTextContent('7/12 sets')
    })

    it('renders the live metric tiles', () => {
      render(<SessionHeader {...liveProps} />)
      expect(screen.getByText('Volume')).toBeInTheDocument()
      expect(screen.getByText('Fatigue')).toBeInTheDocument()
    })

    it('drops the pace marker when a budget and elapsed are given', () => {
      render(<SessionHeader {...liveProps} />)
      expect(screen.getByTestId('segmented-bar-marker')).toBeInTheDocument()
    })

    it('appends the budget to the timer readout', () => {
      render(<SessionHeader {...liveProps} />)
      expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('42:18')
      expect(screen.getByTestId('timer-readout-total')).toHaveTextContent('60:00')
    })
  })

  describe('live · no time target', () => {
    const noTimeProps = { ...liveProps, budgetMs: undefined }

    it('omits the pace marker', () => {
      render(<SessionHeader {...noTimeProps} />)
      expect(screen.queryByTestId('segmented-bar-marker')).not.toBeInTheDocument()
    })

    it('shows the elapsed readout with no budget suffix', () => {
      render(<SessionHeader {...noTimeProps} />)
      expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('42:18')
      expect(screen.queryByTestId('timer-readout-total')).not.toBeInTheDocument()
    })
  })

  describe('upcoming', () => {
    const upcomingProps = {
      title: 'Lower B · Volume',
      plan: PLAN,
      budgetMs: 52 * 60 * 1000,
      next: new Date('2026-07-11T18:30:00'),
    }

    it('renders the next session name as the title', () => {
      render(<SessionHeader {...upcomingProps} />)
      expect(screen.getByTestId('session-rail-title')).toHaveTextContent('Lower B · Volume')
    })

    it('shows the schedule tiles instead of metric tiles', () => {
      render(<SessionHeader {...upcomingProps} />)
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Time')).toBeInTheDocument()
      expect(screen.getByText('Until')).toBeInTheDocument()
    })

    it('shows only the total sets and no marker', () => {
      render(<SessionHeader {...upcomingProps} />)
      expect(screen.getByTestId('session-rail-sets')).toHaveTextContent('12 sets')
      expect(screen.queryByTestId('segmented-bar-marker')).not.toBeInTheDocument()
    })

    it('reads the planned duration statically (not live-green)', () => {
      render(<SessionHeader {...upcomingProps} />)
      expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('52:00')
    })
  })

  describe('accessibility', () => {
    it('has no violations when live', async () => {
      const { container } = render(<SessionHeader {...liveProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no violations when upcoming', async () => {
      const { container } = render(
        <SessionHeader
          title="Lower B · Volume"
          plan={PLAN}
          budgetMs={52 * 60 * 1000}
          next={new Date('2026-07-11T18:30:00')}
        />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

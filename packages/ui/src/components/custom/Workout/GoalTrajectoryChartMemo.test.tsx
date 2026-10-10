import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import * as geometry from './GoalTrajectoryChartGeometry'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

vi.mock('./GoalTrajectoryChartGeometry', async (importActual) => {
  const actual = await importActual<typeof import('./GoalTrajectoryChartGeometry')>()
  return { ...actual, deriveTrajectoryGeometry: vi.fn(actual.deriveTrajectoryGeometry) }
})

describe('GoalTrajectoryChart geometry memo', () => {
  it('does not recompute the geometry on a re-render with the same props', () => {
    const props = { ...S.onTrack.goal!, status: 'on_track' as const, width: 600, height: 300 }
    const { rerender } = render(<GoalTrajectoryChart {...props} />)
    const calls = vi.mocked(geometry.deriveTrajectoryGeometry).mock.calls.length

    rerender(<GoalTrajectoryChart {...props} />)

    expect(vi.mocked(geometry.deriveTrajectoryGeometry)).toHaveBeenCalledTimes(calls)
  })
})

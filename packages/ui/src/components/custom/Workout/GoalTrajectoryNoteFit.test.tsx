/**
 * Functional review C2: the calibrating note fits the chart. It wraps to two lines
 * inside the hatch, clear of the readings and the next target; where the hatch has
 * no room it becomes a caption under the plot, cut with an ellipsis past two lines.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { DEFAULT_CALIBRATING_NOTE, calibratingMarks } from './GoalTrajectoryCalibrating'
import { deriveTrajectoryGeometry, CHART_FONT } from './GoalTrajectoryChartGeometry'
import { collides, marksAlong, textWidth, type Rect } from './calibratingNoteFit'
import { calibratingGoalAt } from './goalTrajectoryCalibratingFixture'

const SIZES = {
  1920: { width: 1920, height: 340 },
  360: { width: 360, height: 220 },
  320: { width: 320, height: 220 },
} as const
type Width = keyof typeof SIZES

const SHORT = 'No band yet'
const NEXT = { weekIndex: 3, value: 105, label: 'next' }
const LONG = '1 more comparable session and more working sets of this lift'
const RUNAWAY =
  'Waiting on 3 more comparable sessions, more working sets of this lift at a steady load, ' +
  'and a fresh start lift after the deload so the band has something honest to fit'

/** The consumer's phone page: 100 lb in week 5 of 8, low in a 98 to 120 domain, next target week 6. */
const LATE_LOW = {
  ...calibratingGoalAt('start'),
  expected: Array.from({ length: 8 }, (_, i) => ({
    weekIndex: i + 1,
    low: 100 + i * 2.5,
    high: 100 + i * 2.5,
  })),
  weeks: Array.from({ length: 8 }, (_, i) => ({ index: i + 1 })),
  committed: 117.5,
  stretch: 117.5,
  actuals: [
    { weekIndex: 1, value: 100 },
    { weekIndex: 5, value: 100 },
  ],
  nextTarget: { weekIndex: 6, value: 112.5, label: 'next' },
}

function noteLines() {
  return screen.getAllByTestId(/^goal-trajectory-chart-calibrating-note-\d+$/)
}

/** Each in-plot line's box, from its drawn anchor and text. */
function drawnRects(): Rect[] {
  return noteLines().map((el) => {
    const x = Number(el.getAttribute('x'))
    const y = Number(el.getAttribute('y'))
    return {
      left: x - textWidth(el.textContent ?? '', CHART_FONT),
      right: x,
      top: y - CHART_FONT,
      bottom: y + 3,
    }
  })
}

function hatchLeft(): number {
  return Number(screen.getByTestId('goal-trajectory-chart-calibrating-hatch').getAttribute('x'))
}

const renderAt = (width: Width, note: string, goal: object = calibratingGoalAt('above')) =>
  render(<GoalTrajectoryChart {...goal} {...SIZES[width]} calibratingNote={note} animate={false} />)

/** Every mark the note must clear: readings, the line between them, the next target and the ramp. */
function marksOf(goal: object, width: Width) {
  const g = deriveTrajectoryGeometry({ ...(goal as typeof LATE_LOW), ...SIZES[width] })
  return [
    ...marksAlong(g.actuals, 6, 2),
    ...marksAlong(g.bandPolygon, 2, 2),
    ...(g.nextTarget ? [{ ...g.nextTarget, radius: 6 }] : []),
  ]
}

describe.each([1920, 360, 320] as const)('the calibrating note at %ipx', (width) => {
  it('writes a short note inside the hatch, clear of every mark', () => {
    const goal = { ...calibratingGoalAt('above'), nextTarget: NEXT }
    renderAt(width, SHORT, goal)
    expect(noteLines()[0].getAttribute('data-placement')).toBe('hatch-bottom')
    expect(noteLines()[0]).toHaveTextContent(SHORT)
    for (const rect of drawnRects()) {
      expect(rect.left).toBeGreaterThanOrEqual(hatchLeft())
      expect(rect.right).toBeLessThanOrEqual(SIZES[width].width)
      expect(collides(rect, marksOf(goal, width))).toBe(false)
    }
  })

  it('writes a long note whole in at most two lines, in the hatch or under the plot', () => {
    renderAt(width, LONG)
    const notes = noteLines().slice(0, width === 1920 ? 1 : 2)
    expect(notes.map((l) => l.textContent).join(' ')).toBe(LONG)
    const inHatch = notes[0].getAttribute('data-placement') === 'hatch-bottom'
    expect(inHatch).toBe(width !== 320)
    if (!inHatch) {
      expect(screen.getByTestId('goal-trajectory-chart-calibrating-caption')).toContainElement(
        notes[0]
      )
    }
  })

  it('falls back to the default note for an empty string', () => {
    renderAt(width, '   ')
    expect(noteLines()[0]).toHaveTextContent(DEFAULT_CALIBRATING_NOTE)
  })
})

// At 1920 the plot is wide enough that no real note needs more than two lines.
describe.each([360, 320] as const)('a note too long for the hatch at %ipx', (width) => {
  it('moves a note that cannot fit two lines under the plot, cut with an ellipsis', () => {
    renderAt(width, RUNAWAY)
    const caption = screen.getByTestId('goal-trajectory-chart-calibrating-caption')
    const lines = noteLines()
    expect(caption).toContainElement(lines[0])
    expect(lines[1].textContent?.endsWith('…')).toBe(true)
  })
})

describe('a late reading low in the plot (week 5 of 8)', () => {
  it.each([1920, 360] as const)('keeps the note off every mark at %ipx', (width) => {
    renderAt(width, LONG, LATE_LOW)
    const marks = marksOf(LATE_LOW, width)
    const placement = noteLines()[0].getAttribute('data-placement')
    if (placement === null) {
      expect(screen.getByTestId('goal-trajectory-chart-calibrating-caption')).toBeInTheDocument()
      return
    }
    for (const rect of drawnRects()) {
      expect(collides(rect, marks)).toBe(false)
      expect(rect.left).toBeGreaterThanOrEqual(hatchLeft())
    }
  })

  it('moves it under the plot at 360, where the hatch is too narrow for the note', () => {
    renderAt(360, LONG, LATE_LOW)
    const caption = screen.getByTestId('goal-trajectory-chart-calibrating-caption')
    const [first, second] = noteLines()
    expect(caption).toContainElement(first)
    expect(`${first.textContent} ${second.textContent}`).toBe(LONG)
  })

  it('has no accessibility violations', async () => {
    const { container } = renderAt(360, LONG, LATE_LOW)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('calibratingMarks placement', () => {
  // A 400 x 200 plot, weeks 40px apart, one reading in week 1.
  function geometryWith(nextTarget: { x: number; y: number } | null) {
    return {
      plot: { left: 0, right: 400, top: 0, bottom: 200 },
      toX: (week: number) => week * 40,
      bandPolygon: [],
      actuals: [{ x: 40, y: 100 }],
      nextTarget: nextTarget && { ...nextTarget, weekIndex: 9, value: 0, leadPath: '' },
    } as unknown as Parameters<typeof calibratingMarks>[0]['geometry']
  }

  it('uses the hatch bottom corner when it is clear', () => {
    const marks = calibratingMarks({ geometry: geometryWith(null), wall: false, note: SHORT })
    expect(marks.placement).toBe('hatch-bottom')
  })

  it('moves to the hatch top corner when the next target sits in the bottom one', () => {
    const geometry = geometryWith({ x: 360, y: 180 })
    const marks = calibratingMarks({ geometry, wall: false, note: SHORT })
    expect(marks.placement).toBe('hatch-top')
  })

  it('moves under the plot when the hatch is too narrow for the block', () => {
    const geometry = {
      ...geometryWith(null),
      actuals: [
        { x: 40, y: 100 },
        { x: 360, y: 100 },
      ],
    }
    const marks = calibratingMarks({ geometry, wall: false, note: SHORT })
    expect(marks.placement).toBe('below')
  })

  it('moves under the plot when the note fits the hatch but its explanation does not', () => {
    // Hatch 100px wide: room for "No band yet", not for "Your band appears here".
    const geometry = {
      ...geometryWith(null),
      actuals: [
        { x: 40, y: 100 },
        { x: 262, y: 100 },
      ],
    }
    expect(textWidth(SHORT, CHART_FONT)).toBeLessThan(100)
    expect(textWidth('Your band appears here', CHART_FONT)).toBeGreaterThan(100)
    const marks = calibratingMarks({ geometry, wall: false, note: SHORT })
    expect(marks.placement).toBe('below')
  })

  it('moves to the hatch top corner when the ramp runs through the bottom one', () => {
    const geometry = {
      ...geometryWith(null),
      bandPolygon: [
        { x: 0, y: 190 },
        { x: 400, y: 180 },
      ],
    }
    const marks = calibratingMarks({ geometry, wall: false, note: SHORT })
    expect(marks.placement).toBe('hatch-top')
  })
})

describe('the calibrating accessible name', () => {
  const nameOf = () =>
    screen.getByTestId('goal-trajectory-chart-canvas').getAttribute('aria-label') ?? ''

  it('says the note and that the line is the planned ramp, not a band', () => {
    renderAt(360, '')
    expect(nameOf()).toContain('Status: Calibrating.')
    expect(nameOf()).toContain(
      `${DEFAULT_CALIBRATING_NOTE}. The line is the planned ramp from the start lift, not an expected band.`
    )
  })

  it('carries the whole note even where the drawn note ends in an ellipsis', () => {
    renderAt(320, RUNAWAY)
    expect(noteLines()[1].textContent?.endsWith('…')).toBe(true)
    expect(nameOf()).toContain(`${RUNAWAY}.`)
  })

  it('says nothing about a ramp for a goal that is not calibrating', () => {
    render(
      <GoalTrajectoryChart {...calibratingGoalAt('above')} {...SIZES[360]} status="on_track" />
    )
    expect(nameOf()).not.toMatch(/planned ramp|No band yet/)
  })
})

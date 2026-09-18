// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * What a calibrating chart adds to the plot (VW-433, human's pick D with B's
 * dashed ramp): the weeks after the latest reading hatched, with the reason there
 * is no band yet written in their lower-right corner, which the ramp climbs away
 * from. The dashed ramp itself is `BandLayer`'s `dashed` edge.
 */
import { useId } from 'react'
import {
  CHART_FONT,
  type GoalExpectedPoint,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'
import type { TrajectoryPalette } from './GoalTrajectoryPlot'

/**
 * The note's first line when the consumer supplies none. It claims no count,
 * because none is known, and not the word "Calibrating", which the card's status
 * pill already says.
 */
export const DEFAULT_CALIBRATING_NOTE = 'No band yet'

const WALL_EXPLANATION = [
  'Your band appears here once there is enough history',
  'Until then the line is the planned ramp from your start lift',
]
const PHONE_EXPLANATION = ['Your band appears here']

interface TextMark {
  x: number
  y: number
  text: string
  anchor: 'start' | 'end'
}

/** The calibrating layer in the chart's own pixels. */
export interface CalibratingMarks {
  /** Left edge of the hatch: the far side of the latest reading's week column. */
  hatchX: number
  lines: TextMark[]
  rampLabel: TextMark | null
}

const LABEL_OFFSET = 6

/** A third of the way along the ramp, under it, reading rightwards as the ramp climbs away. */
function rampLabel(expected: GoalExpectedPoint[], g: GoalTrajectoryGeometry): TextMark | null {
  const point = expected[Math.floor(expected.length / 3)]
  if (!point) return null
  return {
    x: g.toX(point.weekIndex),
    y: g.toY(point.low) + CHART_FONT + LABEL_OFFSET,
    text: 'Planned ramp',
    anchor: 'start',
  }
}

export interface CalibratingMarksInput {
  geometry: GoalTrajectoryGeometry
  expected: GoalExpectedPoint[]
  wall: boolean
  note: string
  showRampLabel: boolean
}

export function calibratingMarks(input: CalibratingMarksInput): CalibratingMarks {
  const { geometry: g } = input
  const latest = g.actuals[g.actuals.length - 1]
  const span = Math.abs(g.toX(2) - g.toX(1))
  const copy = [input.note, ...(input.wall ? WALL_EXPLANATION : PHONE_EXPLANATION)]
  const bottom = g.plot.bottom - LABEL_OFFSET * 2
  return {
    hatchX: latest ? latest.x + span / 2 : g.plot.left,
    lines: copy.map((text, i) => ({
      x: g.plot.right - LABEL_OFFSET * 2,
      y: bottom - (copy.length - 1 - i) * (CHART_FONT + 5),
      text,
      anchor: 'end',
    })),
    rampLabel: input.showRampLabel ? rampLabel(input.expected, g) : null,
  }
}

function ChartText({ mark, fill, id }: { mark: TextMark; fill: string; id: string }) {
  return (
    <text
      data-testid={`goal-trajectory-chart-calibrating-${id}`}
      x={mark.x}
      y={mark.y}
      fill={fill}
      fontSize={CHART_FONT}
      fontFamily="Inter, sans-serif"
      textAnchor={mark.anchor}
    >
      {mark.text}
    </text>
  )
}

interface LayerArgs {
  marks: CalibratingMarks
  geometry: GoalTrajectoryGeometry
  palette: TrajectoryPalette
}

/** Inside the plane's clip: the weeks still to come, hatched. */
export function CalibratingHatch({ marks, geometry, palette }: LayerArgs) {
  const id = `gtc-hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const { plane } = geometry
  return (
    <>
      <defs>
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke={palette.grid} strokeWidth={1} />
        </pattern>
      </defs>
      <rect
        data-testid="goal-trajectory-chart-calibrating-hatch"
        x={marks.hatchX}
        y={plane.y}
        width={Math.max(0, plane.x + plane.width - marks.hatchX)}
        height={plane.height}
        fill={`url(#${id})`}
      />
    </>
  )
}

/** Over the plane, unclipped: the note and, when asked for, the ramp's name. */
export function CalibratingLabels({ marks, palette }: Omit<LayerArgs, 'geometry'>) {
  return (
    <>
      {marks.rampLabel && <ChartText mark={marks.rampLabel} fill={palette.axis} id="ramp-label" />}
      {marks.lines.map((line, i) => (
        <ChartText
          key={line.text}
          mark={line}
          fill={i === 0 ? palette.rule : palette.axis}
          id={`note-${String(i)}`}
        />
      ))}
    </>
  )
}

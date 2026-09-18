// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * VW-433 review round 1: the calibrating treatments under review. The chart takes
 * one through `calibratingTreatment`; `v0` is today's rendering. Once the human
 * picks, the unchosen treatments are deleted and recorded in REJECTED.md.
 */
import { useId } from 'react'
import { roundWeight } from '../../../utils/workout-format'
import { Typography } from '../Typography'
import { BAND_EDGE_WIDTH } from './GoalTrajectoryBand'
import {
  CHART_FONT,
  type GoalExpectedPoint,
  type GoalNextTarget,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'
import type { TrajectoryPalette } from './GoalTrajectoryPlot'

export type CalibratingTreatment = 'v0' | 'plain' | 'labelled' | 'caption' | 'annotated'

/** How far through calibration the lift is, when the read model can say. */
export interface CalibrationProgress {
  sessions: number
  needed: number
}

interface TreatmentPlan {
  /** Draw readings as plain dots: a first reading is not an achievement. */
  dropPR: boolean
  /** `run` is today's dashed run and hollow dot; `dot` keeps only the dot. */
  next: 'run' | 'dot' | 'flat' | 'none'
  /** `ghost` swaps the solid ramp for a faint dashed one with a word label. */
  ramp: 'edge' | 'ghost'
  /** Hatch the weeks after the latest reading and say why they are empty. */
  annotate: boolean
  /** A sentence under the plot that says what each mark is. */
  caption: boolean
}

const PLANS: Record<CalibratingTreatment, TreatmentPlan> = {
  v0: { dropPR: false, next: 'run', ramp: 'edge', annotate: false, caption: false },
  plain: { dropPR: true, next: 'none', ramp: 'edge', annotate: false, caption: false },
  labelled: { dropPR: true, next: 'flat', ramp: 'ghost', annotate: false, caption: false },
  caption: { dropPR: true, next: 'none', ramp: 'edge', annotate: false, caption: true },
  annotated: { dropPR: true, next: 'dot', ramp: 'edge', annotate: true, caption: false },
}

export function treatmentPlan(treatment: CalibratingTreatment): TreatmentPlan {
  return PLANS[treatment]
}

interface TextMark {
  x: number
  y: number
  text: string
  anchor: 'start' | 'middle' | 'end'
}

/** The marks a treatment adds to the plane, in the chart's own pixels. */
export interface CalibratingMarks {
  ghostRamp: boolean
  rampLabel: TextMark | null
  flatNext: { x1: number; x2: number; y: number; label: TextMark } | null
  hatch: { x: number; lines: TextMark[] } | null
}

const LABEL_OFFSET = 6

/** The ramp week the ghost's label hangs from: a third of the way along, clear of the readings. */
function rampLabel(expected: GoalExpectedPoint[], g: GoalTrajectoryGeometry, wall: boolean) {
  const point = expected[Math.floor(expected.length / 3)]
  if (!point) return null
  return {
    x: g.toX(point.weekIndex),
    y: g.toY(point.low) + CHART_FONT + LABEL_OFFSET,
    text: wall ? 'Planned ramp, until there is enough history for a band' : 'Planned ramp',
    anchor: 'start' as const,
  }
}

/** A flat rule at the next target's value, from the latest reading to the next week's column. */
function flatNext(next: GoalNextTarget, g: GoalTrajectoryGeometry, span: number, wall: boolean) {
  const latest = g.actuals[g.actuals.length - 1]
  const x2 = g.toX(next.weekIndex) + span / 2
  const y = g.toY(next.value)
  const value = String(roundWeight(next.value))
  return {
    x1: latest ? latest.x : g.toX(next.weekIndex) - span / 2,
    x2,
    y,
    // Right of and under the rule's end: the ramp has climbed above it there.
    label: {
      x: x2,
      y: y + CHART_FONT + 2,
      text: wall ? `Next week: ${value}` : `Next ${value}`,
      anchor: 'start' as const,
    },
  }
}

/** The annotation sits in the lower-right corner of the hatched weeks, which the ramp climbs away from. */
function hatch(g: GoalTrajectoryGeometry, span: number, copy: string[]) {
  const latest = g.actuals[g.actuals.length - 1]
  const x = latest ? latest.x + span / 2 : g.plot.left
  const bottom = g.plot.bottom - LABEL_OFFSET * 2
  const lines = copy.map((text, i) => ({
    x: g.plot.right - LABEL_OFFSET * 2,
    y: bottom - (copy.length - 1 - i) * (CHART_FONT + 5),
    text,
    anchor: 'end' as const,
  }))
  return { x, lines }
}

export interface CalibratingMarksInput {
  treatment: CalibratingTreatment
  geometry: GoalTrajectoryGeometry
  expected: GoalExpectedPoint[]
  nextTarget?: GoalNextTarget
  span: number
  wall: boolean
  progress?: CalibrationProgress
}

export function calibratingMarks(input: CalibratingMarksInput): CalibratingMarks {
  const plan = treatmentPlan(input.treatment)
  const { geometry: g, span, wall } = input
  const ghost = plan.ramp === 'ghost'
  return {
    ghostRamp: ghost,
    rampLabel: ghost ? rampLabel(input.expected, g, wall) : null,
    flatNext:
      plan.next === 'flat' && input.nextTarget ? flatNext(input.nextTarget, g, span, wall) : null,
    hatch: plan.annotate ? hatch(g, span, annotationCopy(wall, input.progress)) : null,
  }
}

function sessionsLine(progress?: CalibrationProgress): string {
  if (!progress) return 'Calibrating'
  return `Calibrating: ${String(progress.sessions)} of ${String(progress.needed)} sessions`
}

function annotationCopy(wall: boolean, progress?: CalibrationProgress): string[] {
  if (!wall) return [sessionsLine(progress), 'Your band appears here']
  return [
    sessionsLine(progress),
    'Your band appears here once there is enough history',
    'Until then the line is the planned ramp from your start lift',
  ]
}

/** What the caption treatment says under the plot. */
export function captionCopy(progress?: CalibrationProgress): string {
  return (
    `${sessionsLine(progress)}. The dots are your sessions. The thin line is the planned ramp ` +
    'from your start lift; it becomes your expected band once there is enough history to fit one.'
  )
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

/** The ramp drawn faint and dashed, so it reads as a plan and not a result. */
function GhostRamp({ geometry, palette }: Omit<LayerArgs, 'marks'>) {
  return (
    <path
      data-testid="goal-trajectory-chart-calibrating-ghost-ramp"
      d={geometry.bandEdgePath}
      fill="none"
      stroke={palette.bandHue}
      strokeOpacity={0.85}
      strokeWidth={BAND_EDGE_WIDTH}
      strokeDasharray="5 4"
      strokeLinecap="round"
    />
  )
}

function Hatch({ x, geometry, palette }: { x: number } & Omit<LayerArgs, 'marks'>) {
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
        x={x}
        y={plane.y}
        width={Math.max(0, plane.x + plane.width - x)}
        height={plane.height}
        fill={`url(#${id})`}
      />
    </>
  )
}

/** Inside the plane's clip: the ghost ramp, the hatch and the flat next-target rule. */
export function CalibratingUnderlay({ marks, geometry, palette }: LayerArgs) {
  return (
    <>
      {marks.hatch && <Hatch x={marks.hatch.x} geometry={geometry} palette={palette} />}
      {marks.ghostRamp && <GhostRamp geometry={geometry} palette={palette} />}
      {marks.flatNext && (
        <line
          data-testid="goal-trajectory-chart-calibrating-next-rule"
          x1={marks.flatNext.x1}
          x2={marks.flatNext.x2}
          y1={marks.flatNext.y}
          y2={marks.flatNext.y}
          stroke={palette.rule}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}
    </>
  )
}

/** Over the plane, unclipped: every word the treatment puts on the chart. */
export function CalibratingLabels({ marks, palette }: Omit<LayerArgs, 'geometry'>) {
  return (
    <>
      {marks.rampLabel && <ChartText mark={marks.rampLabel} fill={palette.axis} id="ramp-label" />}
      {marks.flatNext && (
        <ChartText mark={marks.flatNext.label} fill={palette.rule} id="next-label" />
      )}
      {marks.hatch?.lines.map((line, i) => (
        <ChartText
          key={line.text}
          mark={line}
          fill={i === 0 ? palette.rule : palette.axis}
          id={`annotation-${String(i)}`}
        />
      ))}
    </>
  )
}

export function CalibratingCaption({ progress }: { progress?: CalibrationProgress }) {
  return (
    <Typography
      variant="caption"
      color="secondary"
      testID="goal-trajectory-chart-calibrating-caption"
    >
      {captionCopy(progress)}
    </Typography>
  )
}

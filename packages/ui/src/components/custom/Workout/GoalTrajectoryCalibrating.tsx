// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * What a calibrating chart adds to the plot (VW-433, human's pick D with B's
 * dashed ramp): the weeks after the latest reading hatched. The dashed ramp itself
 * is `BandLayer`'s `dashed` edge.
 *
 * The reason there is no band lives in a tip, not on the plane (titan-0201 round 1,
 * human: "Lets move to a info hover tip target in the lower right corner of the
 * chart that we can then put whatever text we need into it"). The target sits in
 * the plot's lower-right corner, which the hatch always reaches, and moves off any
 * data mark there.
 */
import { useId } from 'react'
import { Platform, View } from 'react-native'
import { InfoIcon } from '../../icons'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../Typography'
import type { GeometryPoint, GoalTrajectoryGeometry } from './GoalTrajectoryChartGeometry'
import type { TrajectoryPalette } from './GoalTrajectoryPlot'

/**
 * The note's first line when the consumer supplies none. It claims no count,
 * because none is known, and not the word "Calibrating", which the card's status
 * pill already says.
 */
export const DEFAULT_CALIBRATING_NOTE = 'No band yet'

/** What the tip says under the consumer's note, at every width. */
export const CALIBRATING_EXPLANATION = [
  'Your band appears here once there is enough history',
  'Until then the line is the planned ramp from your start lift',
]

/** The info target's accessible name. */
export const CALIBRATING_TIP_LABEL = 'Why is there no band?'

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

const warnedNotes = new Set<string>()

function warnRepeatedStatus(note: string, statusLabel: string) {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
  if (warnedNotes.has(note)) return
  warnedNotes.add(note)
  console.warn(
    `titan: calibratingNote "${note}" starts with "${statusLabel}", which the status pill already says.`
  )
}

/**
 * The note to show: the consumer's, trimmed, or the default when it is empty. Given the
 * status label, a note that opens with it shows as given, with a dev-only warning.
 */
export function resolveCalibratingNote(note: string | undefined, statusLabel?: string): string {
  const trimmed = note?.trim() ?? ''
  if (trimmed === '') return DEFAULT_CALIBRATING_NOTE
  if (statusLabel && trimmed.toLowerCase().startsWith(statusLabel.toLowerCase())) {
    warnRepeatedStatus(trimmed, statusLabel)
  }
  return trimmed
}

/** Where the info target sits: the plot's lower-right corner, its upper-right one, or under the plot. */
export type InfoTargetCorner = 'bottom-right' | 'top-right' | 'below'

/** The calibrating layer in the chart's own pixels. */
export interface CalibratingMarks {
  /** Left edge of the hatch: the far side of the latest reading's week column. */
  hatchX: number
  /** The info target's hit box and the corner it took. */
  target: { x: number; y: number; size: number; corner: InfoTargetCorner }
}

/** Hit area: 24px for a pointer, 44px for touch (WCAG 2.5.8 and the platform minimums). */
export const INFO_TARGET_POINTER = 24
export const INFO_TARGET_TOUCH = 44

/** The hit size for this device: touch on native, and on a web page whose main pointer is coarse. */
export function infoTargetSize(): number {
  if (Platform.OS !== 'web') return INFO_TARGET_TOUCH
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  return coarse ? INFO_TARGET_TOUCH : INFO_TARGET_POINTER
}

const CORNER_INSET = 4
// A reading or the next target is a 4px dot with a 2px ring; the ramp is a 1.5px dashed line.
const DOT_REACH = 6
const LINE_REACH = 2
const LINE_SAMPLES = 12

interface Box {
  x: number
  y: number
  size: number
}

function reaches(box: Box, p: GeometryPoint, radius: number): boolean {
  const dx = Math.max(box.x - p.x, 0, p.x - (box.x + box.size))
  const dy = Math.max(box.y - p.y, 0, p.y - (box.y + box.size))
  return dx * dx + dy * dy < radius * radius
}

function alongLine(points: GeometryPoint[]): GeometryPoint[] {
  const out = [...points]
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]]
    for (let s = 1; s < LINE_SAMPLES; s++) {
      const t = s / LINE_SAMPLES
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

/** True when the box would cover a reading, the line between readings, the next target or the ramp. */
function coversMark(g: GoalTrajectoryGeometry, box: Box): boolean {
  const dots = g.nextTarget ? [...g.actuals, g.nextTarget] : g.actuals
  if (dots.some((p) => reaches(box, p, DOT_REACH))) return true
  const lines = [...alongLine(g.actuals), ...alongLine(g.bandPolygon)]
  return lines.some((p) => reaches(box, p, LINE_REACH))
}

/** The lower-right corner of the plot, else its upper-right, else hanging just under the plot. */
function placeTarget(g: GoalTrajectoryGeometry, size: number): CalibratingMarks['target'] {
  const x = g.plot.right - CORNER_INSET - size
  const corners: [InfoTargetCorner, number][] = [
    ['bottom-right', g.plot.bottom - CORNER_INSET - size],
    ['top-right', g.plot.top + CORNER_INSET],
  ]
  for (const [corner, y] of corners) {
    if (!coversMark(g, { x, y, size })) return { x, y, size, corner }
  }
  return { x, y: g.plot.bottom + CORNER_INSET, size, corner: 'below' }
}

export interface CalibratingMarksInput {
  geometry: GoalTrajectoryGeometry
  /** Hit size in px; {@link infoTargetSize} by default. */
  targetSize?: number
}

export function calibratingMarks(input: CalibratingMarksInput): CalibratingMarks {
  const { geometry: g, targetSize = infoTargetSize() } = input
  const latest = g.actuals[g.actuals.length - 1]
  const span = Math.abs(g.toX(2) - g.toX(1))
  return {
    hatchX: latest ? latest.x + span / 2 : g.plot.left,
    target: placeTarget(g, targetSize),
  }
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

/** The widest the tip text gets, the room kept from the chart's left edge, and the tip's own padding. */
const TIP_MAX_WIDTH = 280
const TIP_EDGE = 8
// Tooltip's Surface pads its content with px-inset-md: 12px a side.
const TIP_PADDING = 24
const ICON_SIZE = 16

/** The tip's text box: the whole tip fits between the chart's left edge and the target's right edge. */
export function calibratingTipWidth(targetRight: number): number {
  return Math.max(0, Math.min(TIP_MAX_WIDTH, targetRight - TIP_EDGE - TIP_PADDING))
}

function TipBody({ note, width }: { note: string; width: number }) {
  return (
    <View style={{ width }} className="gap-stack-sm" testID="goal-trajectory-chart-calibrating-tip">
      <Typography variant="body2">{note}</Typography>
      {CALIBRATING_EXPLANATION.map((line) => (
        <Typography key={line} variant="caption" color="secondary">
          {line}
        </Typography>
      ))}
    </View>
  )
}

interface CalibratingInfoProps {
  marks: CalibratingMarks
  note: string
  palette: TrajectoryPalette
}

/**
 * The info target over the plot, absolute against the chart's own box. The tip opens in flow,
 * right-aligned to the target, so the card's clipping never cuts it and it never leaves the card.
 */
export function CalibratingInfo({ marks, note, palette }: CalibratingInfoProps) {
  const { x, y, size, corner } = marks.target
  const box = { width: size, height: size }
  return (
    <View
      style={{ position: 'absolute', left: x, top: y }}
      testID={`goal-trajectory-chart-calibrating-info-${corner}`}
    >
      <TipTrigger
        label={CALIBRATING_TIP_LABEL}
        content={<TipBody note={note} width={calibratingTipWidth(x + size)} />}
        placement={corner === 'top-right' ? 'bottom-end' : 'top-end'}
        usePortal={false}
        style={box}
        testID="goal-trajectory-chart-calibrating-target"
      >
        <View style={box} className="items-center justify-center">
          <InfoIcon size={ICON_SIZE} color={palette.axis} />
        </View>
      </TipTrigger>
    </View>
  )
}

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * What a calibrating chart adds to the plot (VW-433, human's pick D with B's
 * dashed ramp): the weeks after the latest reading hatched, with the reason there
 * is no band yet written in their lower-right corner, which the ramp climbs away
 * from. The dashed ramp itself is `BandLayer`'s `dashed` edge.
 *
 * The note block fits itself (functional review C2): the consumer's note wraps to
 * two lines at most, and the block stays inside the hatch and clear of the
 * readings, the next-target dot and the ramp. When it cannot, it becomes a caption under the plot.
 */
import { useId } from 'react'
import { Text, View } from 'react-native'
import { CHART_FONT, type GoalTrajectoryGeometry } from './GoalTrajectoryChartGeometry'
import type { TrajectoryPalette } from './GoalTrajectoryPlot'
import {
  collides,
  fitNote,
  marksAlong,
  textWidth,
  wrapWords,
  type PlottedMark,
  type Rect,
} from './calibratingNoteFit'

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
 * The note to draw: the consumer's, trimmed, or the default when it is empty. Given the
 * status label, a note that opens with it draws as given, with a dev-only warning.
 */
export function resolveCalibratingNote(note: string | undefined, statusLabel?: string): string {
  const trimmed = note?.trim() ?? ''
  if (trimmed === '') return DEFAULT_CALIBRATING_NOTE
  if (statusLabel && trimmed.toLowerCase().startsWith(statusLabel.toLowerCase())) {
    warnRepeatedStatus(trimmed, statusLabel)
  }
  return trimmed
}

export interface NoteLine {
  text: string
  kind: 'note' | 'explanation'
}

/** Inside the hatch, at its lower or upper right corner, or as a caption under the plot. */
export type NotePlacement = 'hatch-bottom' | 'hatch-top' | 'below'

/** The calibrating layer in the chart's own pixels. */
export interface CalibratingMarks {
  /** Left edge of the hatch: the far side of the latest reading's week column. */
  hatchX: number
  placement: NotePlacement
  lines: NoteLine[]
  /** Hatch placements: the lines' right edge and the first line's baseline. */
  anchor: { x: number; y: number }
  /** `below` only: the caption's box, the plot's width under the plot. */
  caption: { left: number; width: number }
}

const LABEL_OFFSET = 6
const LINE_HEIGHT = CHART_FONT + 5
// Dot radius plus its ring, and a gap, so no line touches a reading or the next target.
const MARK_CLEARANCE = 8
const LINE_CLEARANCE = 4

export interface CalibratingMarksInput {
  geometry: GoalTrajectoryGeometry
  wall: boolean
  note: string
}

/** The readings and the line between them, the next target, and the dashed ramp the note explains. */
function plottedMarks(g: GoalTrajectoryGeometry): PlottedMark[] {
  const readings = marksAlong(g.actuals, MARK_CLEARANCE, LINE_CLEARANCE)
  const ramp = marksAlong(g.bandPolygon, LINE_CLEARANCE, LINE_CLEARANCE)
  const next = g.nextTarget ? [{ ...g.nextTarget, radius: MARK_CLEARANCE }] : []
  return [...readings, ...ramp, ...next]
}

// Space kept clear around the text, so a slanted line never grazes its ascenders.
const BLOCK_PAD = 4

function blockRect(right: number, firstBaseline: number, lines: string[]): Rect {
  const width = Math.max(...lines.map((l) => textWidth(l, CHART_FONT)))
  const lastBaseline = firstBaseline + (lines.length - 1) * LINE_HEIGHT
  return {
    left: right - width - BLOCK_PAD,
    right: right + BLOCK_PAD,
    top: firstBaseline - CHART_FONT - BLOCK_PAD,
    bottom: lastBaseline + 3 + BLOCK_PAD,
  }
}

/** The block's first baseline in each hatch corner. */
function cornerBaselines(g: GoalTrajectoryGeometry, count: number) {
  const bottom = g.plot.bottom - LABEL_OFFSET * 2 - (count - 1) * LINE_HEIGHT
  return { 'hatch-bottom': bottom, 'hatch-top': g.plot.top + LABEL_OFFSET + CHART_FONT }
}

/** The first hatch corner where the whole block fits untruncated and clear of every mark. */
function hatchPlacement(g: GoalTrajectoryGeometry, hatchX: number, note: string, wall: boolean) {
  const right = g.plot.right - LABEL_OFFSET * 2
  const width = right - (hatchX + LABEL_OFFSET)
  const explanation = wall ? WALL_EXPLANATION : PHONE_EXPLANATION
  const noteLines = wrapWords(note, width, CHART_FONT, 2)
  if (!noteLines || explanation.some((l) => textWidth(l, CHART_FONT) > width)) return null
  const lines = [...noteLines, ...explanation]
  const marks = plottedMarks(g)
  const corners = cornerBaselines(g, lines.length)
  for (const placement of ['hatch-bottom', 'hatch-top'] as const) {
    if (!collides(blockRect(right, corners[placement], lines), marks)) {
      return { placement, noteLines, anchor: { x: right, y: corners[placement] } }
    }
  }
  return null
}

const asLines = (note: string[], wall: boolean): NoteLine[] => [
  ...note.map((text) => ({ text, kind: 'note' as const })),
  ...(wall ? WALL_EXPLANATION : PHONE_EXPLANATION).map((text) => ({
    text,
    kind: 'explanation' as const,
  })),
]

export function calibratingMarks(input: CalibratingMarksInput): CalibratingMarks {
  const { geometry: g, wall, note } = input
  const latest = g.actuals[g.actuals.length - 1]
  const span = Math.abs(g.toX(2) - g.toX(1))
  const hatchX = latest ? latest.x + span / 2 : g.plot.left
  const caption = { left: g.plot.left, width: g.plot.right - g.plot.left }
  const inHatch = hatchPlacement(g, hatchX, note, wall)
  if (inHatch) {
    const { placement, noteLines, anchor } = inHatch
    return { hatchX, placement, lines: asLines(noteLines, wall), anchor, caption }
  }
  const fitted = fitNote(note, caption.width - LABEL_OFFSET * 2, CHART_FONT)
  return {
    hatchX,
    placement: 'below',
    lines: asLines(fitted, wall),
    anchor: { x: 0, y: 0 },
    caption,
  }
}

const lineTestId = (i: number) => `goal-trajectory-chart-calibrating-note-${String(i)}`

const lineFill = (line: NoteLine, palette: TrajectoryPalette) =>
  line.kind === 'note' ? palette.rule : palette.axis

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

/** Over the plane, unclipped: the note, when it sits in the hatch. The ramp carries no label (VW-433 round 2). */
export function CalibratingLabels({ marks, palette }: Omit<LayerArgs, 'geometry'>) {
  if (marks.placement === 'below') return null
  return (
    <>
      {marks.lines.map((line, i) => (
        <text
          key={`${String(i)}-${line.text}`}
          data-testid={lineTestId(i)}
          data-placement={marks.placement}
          x={marks.anchor.x}
          y={marks.anchor.y + i * LINE_HEIGHT}
          fill={lineFill(line, palette)}
          fontSize={CHART_FONT}
          fontFamily="Inter, sans-serif"
          textAnchor="end"
        >
          {line.text}
        </text>
      ))}
    </>
  )
}

/** Under the plot, right-aligned to it: the note when the hatch has no room for it. */
export function CalibratingCaption({ marks, palette }: Omit<LayerArgs, 'geometry'>) {
  if (marks.placement !== 'below') return null
  const { left, width } = marks.caption
  return (
    <View
      testID="goal-trajectory-chart-calibrating-caption"
      style={{ marginLeft: left, width, paddingHorizontal: LABEL_OFFSET }}
    >
      {marks.lines.map((line, i) => (
        <Text
          key={`${String(i)}-${line.text}`}
          testID={lineTestId(i)}
          numberOfLines={1}
          style={{
            color: lineFill(line, palette),
            fontSize: CHART_FONT,
            lineHeight: LINE_HEIGHT,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'right',
          }}
        >
          {line.text}
        </Text>
      ))}
    </View>
  )
}

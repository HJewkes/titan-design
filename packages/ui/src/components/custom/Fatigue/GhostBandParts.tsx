import { primitiveColors } from '../../../theme/tokens/primitives'
import { FONT_UI, PHASE_AXIS_COLOR, PHASE_AXIS_BASE_COLOR } from './fatigue-tokens'
import { PHASE_LABEL, labelFits, type BandExtent, type GhostBandRun } from './ghostBandRuns'

/** The well shades toward black so it recesses every phase tone identically. */
const WELL_SHADE = primitiveColors.black
/** The faint light line on the well's floor — the far lip catching light. */
const WELL_FLOOR_LIGHT = primitiveColors.white

interface BandGeometry {
  top: number
  height: number
}

/** The clip silhouette and the recessed-well gradient. */
export function GhostBandDefs({
  clipId,
  wellId,
  extent,
  top,
  height,
}: BandGeometry & { clipId: string; wellId: string; extent: BandExtent }) {
  return (
    <defs>
      <clipPath id={clipId}>
        <rect x={extent.bandLeft} y={top} width={extent.bandW} height={height} rx={2} />
      </clipPath>
      {/* The WELL — dark under the top lip, falling off fast, with a faint light line on
          the floor. SVG has no `inset` box-shadow, so a recess is a gradient. */}
      <linearGradient id={wellId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={WELL_SHADE} stopOpacity={0.6} />
        <stop offset="42%" stopColor={WELL_SHADE} stopOpacity={0.12} />
        <stop offset="88%" stopColor={WELL_SHADE} stopOpacity={0.02} />
        <stop offset="100%" stopColor={WELL_FLOOR_LIGHT} stopOpacity={0.07} />
      </linearGradient>
    </defs>
  )
}

/** Each run: the muted base at FULL run width, then the well, then the earned fill. Both
 *  square inside the one clip — the fill is a fill, never an inset, so no boundary can open
 *  a seam. */
export function GhostBandRunRects({
  runs,
  top,
  height,
  wellId,
}: BandGeometry & { runs: GhostBandRun[]; wellId: string }) {
  return (
    <>
      {runs.map((run, i) => (
        <g key={i}>
          <rect
            x={run.left}
            y={top}
            width={run.width}
            height={height}
            fill={PHASE_AXIS_BASE_COLOR[run.phase]}
            data-testid="ghost-band-base"
          />
          <rect
            x={run.left}
            y={top}
            width={run.width}
            height={height}
            fill={`url(#${wellId})`}
            data-testid="ghost-band-well"
          />
          <rect
            x={run.left}
            y={top}
            width={run.fillWidth}
            height={height}
            fill={PHASE_AXIS_COLOR[run.phase]}
            data-testid="ghost-band-fill"
          />
        </g>
      ))}
    </>
  )
}

/** ECC / CON words, only in runs wide enough to hold them. */
export function GhostBandLabels({ runs, top, height }: BandGeometry & { runs: GhostBandRun[] }) {
  return (
    <>
      {runs.map((run, i) => {
        const label = PHASE_LABEL[run.phase]
        if (!label || !labelFits(label, run.width)) return null
        return (
          <text
            key={i}
            x={run.left + run.width / 2}
            y={top + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={run.labelTone}
            fontSize={8}
            fontWeight={800}
            letterSpacing={1}
            fontFamily={FONT_UI}
          >
            {label}
          </text>
        )
      })}
    </>
  )
}

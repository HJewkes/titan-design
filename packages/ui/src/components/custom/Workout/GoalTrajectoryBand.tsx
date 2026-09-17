/**
 * The expected band of {@link GoalTrajectoryChart}. Locked 2026-09-17: smoothed
 * edges, 28% on the centre line fading to 14% at both edges. The other fades stay
 * reachable for the Explore stories only.
 */
import { useId } from 'react'
import {
  bandColumns,
  bandPathAt,
  type BandCurve,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'

export type BandFade = 'none' | 'centre-20' | 'centre-14' | 'across-20'

/** Band opacity at its centre line (and everywhere, for `none`). */
export const BAND_OPACITY = 0.28

export const EDGE_OPACITY: Record<Exclude<BandFade, 'none'>, number> = {
  'centre-20': 0.2,
  'centre-14': 0.14,
  'across-20': 0.2,
}

interface BandLayerProps {
  geometry: GoalTrajectoryGeometry
  hue: string
  fade: BandFade
  curve: BandCurve
}

function useBandIds() {
  const base = useId().replace(/[^a-zA-Z0-9]/g, '')
  return { fill: `gtc-band-fill-${base}`, clip: `gtc-band-clip-${base}` }
}

/**
 * A continuous centre-to-edge fade. One bounding-box gradient is shared by 2px
 * columns that each span the band's local extent, so the gradient's midpoint
 * follows the centre line at every x; the clip trims each column to the band.
 */
function CentreFade({ geometry, hue, fade, curve }: BandLayerProps) {
  const ids = useBandIds()
  const edge = EDGE_OPACITY[fade as Exclude<BandFade, 'none'>]
  return (
    <>
      <defs>
        <linearGradient id={ids.fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity={edge} />
          <stop offset="0.5" stopColor={hue} stopOpacity={BAND_OPACITY} />
          <stop offset="1" stopColor={hue} stopOpacity={edge} />
        </linearGradient>
        <clipPath id={ids.clip}>
          <path d={bandPathAt(geometry.bandSlices, 1, curve)} />
        </clipPath>
      </defs>
      <g data-testid="goal-trajectory-chart-band" clipPath={`url(#${ids.clip})`}>
        {bandColumns(geometry.bandSlices, curve).map((column) => (
          <rect
            key={column.x}
            data-testid="goal-trajectory-chart-band-column"
            x={column.x}
            y={column.top}
            width={column.width}
            height={column.bottom - column.top}
            fill={`url(#${ids.fill})`}
            shapeRendering="crispEdges"
          />
        ))}
      </g>
    </>
  )
}

function AcrossFade({ geometry, hue, curve }: BandLayerProps) {
  const { fill } = useBandIds()
  return (
    <>
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={hue} stopOpacity={BAND_OPACITY} />
          <stop offset="1" stopColor={hue} stopOpacity={EDGE_OPACITY['across-20']} />
        </linearGradient>
      </defs>
      <path
        data-testid="goal-trajectory-chart-band"
        d={bandPathAt(geometry.bandSlices, 1, curve)}
        fill={`url(#${fill})`}
      />
    </>
  )
}

export function BandLayer(props: BandLayerProps) {
  if (!props.geometry.hasBand) return null
  if (props.fade === 'across-20') return <AcrossFade {...props} />
  if (props.fade !== 'none') return <CentreFade {...props} />
  return (
    <path
      data-testid="goal-trajectory-chart-band"
      d={props.geometry.bandPath}
      fill={props.hue}
      fillOpacity={BAND_OPACITY}
    />
  )
}

/**
 * The expected band of {@link GoalTrajectoryChart}, with the fade treatments under
 * review (VW-385 round 2). `none` is the locked flat band; the others are
 * explorations the human is choosing between, and the losers get deleted.
 */
import { useId } from 'react'
import {
  bandPathAt,
  type BandCurve,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'

export type BandFade = 'none' | 'centre-20' | 'centre-14' | 'across-20'

/** Band opacity at its centre line (and everywhere, for `none`). */
export const BAND_OPACITY = 0.28

const EDGE_OPACITY: Record<Exclude<BandFade, 'none'>, number> = {
  'centre-20': 0.2,
  'centre-14': 0.14,
  'across-20': 0.2,
}

/** Nested layers per centre fade; enough that no step reads as a stripe. */
export const FADE_LAYERS = 8

/**
 * Opacities for `count` nested bands, outermost first, so that stacking them
 * composites to `edge` at the band edge rising evenly to `centre` in the middle.
 * Each layer adds what the stack below it is missing: 1 - (1 - T_k) / (1 - T_k-1).
 */
export function fadeLayerOpacities(edge: number, centre: number, count: number): number[] {
  const targets = Array.from(
    { length: count },
    (_, k) => edge + ((centre - edge) * k) / Math.max(1, count - 1)
  )
  return targets.map((target, k) => (k === 0 ? target : 1 - (1 - target) / (1 - targets[k - 1])))
}

interface BandLayerProps {
  geometry: GoalTrajectoryGeometry
  hue: string
  fade: BandFade
  curve: BandCurve
}

function CentreFade({ geometry, hue, fade, curve }: BandLayerProps) {
  const edge = EDGE_OPACITY[fade as Exclude<BandFade, 'none'>]
  const opacities = fadeLayerOpacities(edge, BAND_OPACITY, FADE_LAYERS)
  return (
    <g data-testid="goal-trajectory-chart-band">
      {opacities.map((opacity, k) => (
        <path
          key={k}
          data-testid="goal-trajectory-chart-band-layer"
          d={bandPathAt(geometry.bandSlices, 1 - k / FADE_LAYERS, curve)}
          fill={hue}
          fillOpacity={opacity}
        />
      ))}
    </g>
  )
}

function AcrossFade({ geometry, hue, curve }: BandLayerProps) {
  const id = `gtc-band-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={hue} stopOpacity={BAND_OPACITY} />
          <stop offset="1" stopColor={hue} stopOpacity={EDGE_OPACITY['across-20']} />
        </linearGradient>
      </defs>
      <path
        data-testid="goal-trajectory-chart-band"
        d={bandPathAt(geometry.bandSlices, 1, curve)}
        fill={`url(#${id})`}
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

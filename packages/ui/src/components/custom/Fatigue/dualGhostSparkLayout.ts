import { ghostLineColor, clamp01 } from './fatigue-tokens'
import { BAND_H, BAND_GAP } from './GhostBand'
import type { Pt } from './GhostBloom'
import type { RepVelocityCurve } from './fatigue-model'

export interface DualSparkLayout {
  w: number
  h: number
  padL: number
  padTop: number
  padBot: number
  bandTop: number
  baseUp: number
  baseDown: number
  x: (ms: number) => number
  mag: (v: number) => number
}

export interface SparkWing {
  cur: RepVelocityCurve | undefined
  current: Pt[]
  ghosts: Pt[][]
  tint: string
}

/** Last sample time across a curve set, 0 when there is nothing to draw. */
export function lastTMs(curves: RepVelocityCurve[]): number {
  return Math.max(0, ...curves.map((c) => c.samples[c.samples.length - 1]?.tMs ?? 0))
}

/** Plot geometry plus the ONE time scale and ONE magnitude scale both wings share. */
export function dualSparkLayout(
  left: RepVelocityCurve[],
  right: RepVelocityCurve[],
  width: number,
  height: number
): DualSparkLayout {
  const w = width
  const h = height
  const padL = 14
  const padR = 14
  const padTop = 22
  const padBot = 22

  // The band sits on the vertical midline; each bloom's baseline is offset off a band edge
  // by BAND_GAP so a zero-velocity moment still sits clear of the band.
  const mid = padTop + (h - padTop - padBot) / 2
  const bandTop = mid - BAND_H / 2
  const baseUp = bandTop - BAND_GAP
  const baseDown = mid + BAND_H / 2 + BAND_GAP
  // ONE wing height for both sides — the second half of the shared magnitude scale.
  const wingH = Math.max(1, Math.min(baseUp - padTop, h - padBot - baseDown))

  const allSamples = [...left, ...right].flatMap((c) => c.samples)
  const vmax = Math.max(0.01, ...allSamples.map((s) => s.velocityMps)) * 1.06
  const axisMaxT = Math.max(1, lastTMs(left), lastTMs(right)) * 1.04
  const x = (ms: number) => padL + (ms / axisMaxT) * (w - padL - padR)
  const mag = (v: number) => clamp01(v / vmax) * wingH
  return { w, h, padL, padTop, padBot, bandTop, baseUp, baseDown, x, mag }
}

/** One device's current rep, ghost fan and line tint; `fallbackTint` stands in with no rep. */
export function sparkWing(
  curves: RepVelocityCurve[],
  { x, mag }: Pick<DualSparkLayout, 'x' | 'mag'>,
  fallbackTint: string
): SparkWing {
  const toPts = (c: RepVelocityCurve): Pt[] => c.samples.map((s) => [x(s.tMs), mag(s.velocityMps)])
  const cur = curves[curves.length - 1]
  return {
    cur,
    current: cur ? toPts(cur) : [],
    ghosts: curves.slice(0, -1).map(toPts),
    tint: cur ? ghostLineColor(cur.tempoDeviation, cur.grindSignature) : fallbackTint,
  }
}

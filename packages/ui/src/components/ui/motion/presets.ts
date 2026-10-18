// Evaluates a `motion.presets` entry at a tier. Pure: it reads no clock, so a main-entry component
// passing its own progress and a video beat passing cue time share one definition.
import { motion } from '../../../theme/tokens/semantic'
import { motionEase, springPreset, type EaseName, type SpringPresetName } from './curves'
import type { Easing } from './easing'
import { springEase, springSettleS } from './spring'

/** A motion tier: `video` for the video stage, `app` for UI. */
export type MotionTierName = keyof typeof motion.tiers
/** A preset's name in `motion.presets`. */
export type MotionPresetName = keyof typeof motion.presets
/** What reduced motion keeps: `fade` keeps only opacity, `jump` shows the end state at once. */
export type MotionReduced = 'fade' | 'jump'
/** Values for the endpoints a preset leaves to the caller, such as countUp's `from` and `to`. */
export type MotionPresetValues = Readonly<Record<string, number>>
/** A preset's values at one moment: one number per property it animates. */
export type MotionPresetFrame<N extends MotionPresetName> = {
  [K in keyof (typeof motion.presets)[N]['props']]: number
}

/** A preset's values under reduced motion: opacity alone for `fade`, every property for `jump`. */
export type MotionReducedFrame<N extends MotionPresetName> = Partial<MotionPresetFrame<N>> & {
  opacity?: number
}

/** A preset evaluated at one tier. */
export interface MotionPreset<N extends MotionPresetName> {
  /** Seconds the motion runs; for a spring preset, its settle time. */
  durationS: number
  /** Seconds item `index` of `count` waits, capped so the cascade fits the tier; 0 without stagger. */
  delayS(index: number, count: number): number
  /** The values at progress `p` through `durationS`, clamped to [0, 1]. */
  at(p: number, values?: MotionPresetValues): MotionPresetFrame<N>
  /** The values under reduced motion at progress `p`: opacity alone for `fade`, the end for `jump`. */
  reducedAt(p: number, values?: MotionPresetValues): MotionReducedFrame<N>
  /** The exit's length as a share of the entrance; undefined when the preset has no exit. */
  exitRatio: number | undefined
  /** The exit's length in seconds; undefined when the preset has no exit. */
  exitS: number | undefined
  /** What reduced motion keeps, as `reducedAt` applies it. */
  reduced: MotionReduced
}

type Tier = (typeof motion.tiers)[MotionTierName]
type Endpoint = number | string
type Frame = Record<string, number>

interface PresetSpec {
  readonly props: Readonly<Record<string, readonly [Endpoint, Endpoint]>>
  readonly duration?: 'enter' | 'emphasis' | 'hero' | 'count'
  readonly ease?: EaseName
  readonly spring?: SpringPresetName
  readonly allowOvershoot?: boolean
  readonly stagger?: boolean
  readonly exit?: { readonly ratio: number; readonly ease: EaseName }
  readonly reduced: MotionReduced
}

const specs: Record<MotionPresetName, PresetSpec> = motion.presets
const seconds = (ms: number) => ms / 1000
const clampUnit = (p: number) => Math.min(1, Math.max(0, p))

/** A string endpoint names a tier value first, then a caller value. */
function resolve(end: Endpoint, tier: Tier, values: MotionPresetValues): number {
  if (typeof end === 'number') return end
  const value = end in tier ? tier[end as keyof Tier] : values[end]
  if (value === undefined) throw new RangeError(`MOTION.preset: no value for '${end}'`)
  return value
}

/** `from * (1 - e) + to * e`, so a 0 endpoint drops out exactly. */
function frameAt(spec: PresetSpec, tier: Tier, eased: number, values: MotionPresetValues): Frame {
  return Object.fromEntries(
    Object.entries(spec.props).map(([prop, [from, to]]) => [
      prop,
      resolve(from, tier, values) * (1 - eased) + resolve(to, tier, values) * eased,
    ])
  )
}

function curveOf(spec: PresetSpec, tier: Tier): { ease: Easing; durationS: number } {
  if (spec.spring === undefined) {
    return {
      ease: motionEase[spec.ease ?? 'out'],
      durationS: seconds(tier[spec.duration ?? 'enter']),
    }
  }
  const physics = springPreset(spec.spring, { allowOvershoot: spec.allowOvershoot })
  return { ease: springEase(physics), durationS: springSettleS(physics) }
}

function staggerDelayS(tier: Tier, index: number, count: number): number {
  const each = seconds(tier.staggerEach)
  return index * (count > 1 ? Math.min(each, seconds(tier.staggerMax) / (count - 1)) : each)
}

/** Opacity alone under `fade`; a spring preset fades on `out`, since opacity must not overshoot. */
function reducedFrameAt(
  spec: PresetSpec,
  tier: Tier,
  ease: Easing,
  p: number,
  values: MotionPresetValues
): Frame {
  if (spec.reduced === 'jump') return frameAt(spec, tier, 1, values)
  const fade: PresetSpec = { ...spec, props: { opacity: spec.props.opacity ?? [0, 1] } }
  const fadeEase = spec.spring === undefined ? ease : motionEase.out
  return frameAt(fade, tier, fadeEase(clampUnit(p)), values)
}

/**
 * The preset `name` at `tier`: its duration, stagger and values at a progress, from the data in
 * `motion.presets` and `motion.tiers`. The same preset at `video` and `app` shares its curve and
 * ratios and differs only in the tier's durations and distances.
 *
 * @throws {RangeError} for an unknown name or tier, or an endpoint with no value.
 * @example
 * const rise = MOTION.preset('riseIn', 'app')
 * rise.at(0.5) // { opacity, translateY }
 */
export function motionPreset<N extends MotionPresetName>(
  name: N,
  tierName: MotionTierName
): MotionPreset<N> {
  const spec = specs[name] as PresetSpec | undefined
  const tier = motion.tiers[tierName] as Tier | undefined
  if (spec === undefined || tier === undefined) {
    throw new RangeError(
      `MOTION.preset: unknown preset '${String(name)}' or tier '${String(tierName)}'`
    )
  }
  const { ease, durationS } = curveOf(spec, tier)
  const exitRatio = spec.exit?.ratio
  return {
    durationS,
    delayS: (index, count) => (spec.stagger ? staggerDelayS(tier, index, count) : 0),
    at: (p, values = {}) => frameAt(spec, tier, ease(clampUnit(p)), values) as MotionPresetFrame<N>,
    reducedAt: (p, values = {}) =>
      reducedFrameAt(spec, tier, ease, p, values) as MotionReducedFrame<N>,
    exitRatio,
    exitS: exitRatio === undefined ? undefined : durationS * exitRatio,
    reduced: spec.reduced,
  }
}

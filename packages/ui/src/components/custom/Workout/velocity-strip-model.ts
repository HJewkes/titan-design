import type { Animated, ViewProps } from 'react-native'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import type { SetSlot } from '../charts/SetBarChart'
import {
  classifyBand,
  calculateMeanVelocity,
  velocityLossForRep,
  shownVelocityLoss,
  getVelocityZoneName,
  type VelocityLossThresholds,
  type VelocityZoneBandProp,
} from './velocity-scale'
import { deriveDoneVelocities, setAccessibilityLabel, type VelocitySet } from './velocity-slots'

/** The SetBarChart inputs every VelocityStrip variant shares, resolved by `VelocityStrip`. */
export interface VelocityStripChart {
  set?: VelocitySet
  columnSlots?: SetSlot[]
  /** The strip's own slots from `useVelocitySlots`. */
  slots: SetSlot[]
  barColorFor: (v: number) => string
  height: number
  scale: 'peak' | 'fixed'
  scaleMax?: number
  orientation: 'up' | 'down'
  liveRepIndex?: number
  targetReps?: number
  label?: string
  className?: string
  props: ViewProps
}

/** The done-velocity summary, measured once from the set's done reps. */
export interface VelocitySummary {
  doneVelocities: number[]
  repCount: number
  miniLabel: string
  maxVelocity: number
  meanVelocity: number
  meanZone: string
  lastLoss: number
  loss: number
  isNewPeak: boolean
}

/** The summary plus the loss scale and surface mode the variants paint it with. */
export interface VelocityStripSummary extends VelocitySummary {
  lossThresholds: VelocityLossThresholds
  lossBandsOn: boolean
  mode: ThemeMode
}

/** The `expanded` variant's chrome flags, handlers and collapse animation values. */
export interface VelocityStripChrome {
  framed: boolean
  expanded: boolean
  onToggle?: () => void
  onRepPress?: (index: number, velocity: number) => void
  showNumbers: boolean
  showInfo: boolean
  expandProgress: Animated.Value
  infoOpacity: Animated.Value
}

export interface VelocityStripVariantProps {
  chart: VelocityStripChart
  summary: VelocityStripSummary
  chrome: VelocityStripChrome
}

/** Measure a strip's done reps: mean, loss, zone and whether the live rep is a new best. */
export function summarizeVelocities(
  set: VelocitySet | undefined,
  velocities: number[] | undefined,
  zones: readonly VelocityZoneBandProp[] | undefined,
  liveRepIndex: number | undefined
): VelocitySummary {
  // A `set` descriptor derives its own done-velocity array; the legacy
  // `velocities` path stays the source of truth otherwise. Every summary calc
  // (mean / loss / zone) runs on this one array so the info row works either way.
  const doneVelocities = set ? deriveDoneVelocities(set) : (velocities ?? [])

  const maxVelocity = Math.max(...doneVelocities, 0)
  const meanVelocity = calculateMeanVelocity(doneVelocities)
  // The colour bands the last rep's exact loss, like its bar; the number is that loss rounded down.
  const lastLoss = velocityLossForRep(doneVelocities[doneVelocities.length - 1] ?? 0, maxVelocity)
  const loss = shownVelocityLoss(lastLoss)

  const hasZones = zones != null && zones.length > 0
  const meanZone = hasZones
    ? (classifyBand(meanVelocity, zones)?.label ?? '')
    : getVelocityZoneName(meanVelocity)

  // Newest-rep animation: pop for a normal rep, bounce when it sets a new peak.
  const liveVelocity = liveRepIndex != null ? doneVelocities[liveRepIndex] : undefined
  const isNewPeak = liveVelocity != null && maxVelocity > 0 && liveVelocity === maxVelocity

  const repCount = doneVelocities.length
  const miniLabel = set ? setAccessibilityLabel(set, repCount) : `Velocity strip, ${repCount} reps`
  return {
    doneVelocities,
    repCount,
    miniLabel,
    maxVelocity,
    meanVelocity,
    meanZone,
    lastLoss,
    loss,
    isNewPeak,
  }
}

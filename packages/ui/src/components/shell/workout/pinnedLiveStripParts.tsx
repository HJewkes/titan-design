// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { View, Text, Platform, type LayoutChangeEvent } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { Surface } from '../../ui/surface'
import { Indicator } from '../../ui/indicator'
import { Progress } from '../../ui/progress'
import { Typography } from '../../ui/typography'
import { ChevronRightIcon } from '../../icons'
import { liveStripMs, liveStripRestReadout, type LiveStripState } from './liveStripModel'

// The wall row is fixed (round 2 chose 72px); the phone form grows when a long title wraps.
const WALL_HEIGHT = 72
const PHONE_MIN_HEIGHT = 88

export type PinnedLiveStripLayout = 'wall' | 'phone'

/** Below this container width the strip stacks into its phone form. */
export const PINNED_LIVE_STRIP_PHONE_MAX = 640

export interface Scale {
  title: string
  sub: string
  hero: string
  heroUnit: string
  /** The hero's font size in px, for centring the reduced rest digits. */
  heroPx: number
  /** Rest seconds from 100s: one smaller step, centred on the full-size digits (VW-429 round 7). */
  reducedRest: { size: string; unit: string; px: number }
  /** Fits "99s" at full size and "999s" at the reduced size (measured: 83 / 71px). */
  secondsSlot: number
  /** Gap between numeral, velocity and bars. */
  valueGap: string
  /** Line-height for the numerals: the wall drops the leading so its overline row fits above them. */
  leading: string
  /** Slot widths (px) measured in the heading face for the rep count, by digits. */
  slot: { oneDigitReps: number; twoDigitReps: number }
  velocity: string
  barHeight: number
  barPitch: number
}

// Type steps come from the tailwind scale; no Typography variant reaches the wall's numeral sizes.
export const SCALES: Record<PinnedLiveStripLayout, Scale> = {
  wall: {
    title: 'text-xl',
    sub: 'text-base',
    hero: 'text-4xl',
    heroUnit: 'text-xl',
    heroPx: 48,
    reducedRest: { size: 'text-3xl', unit: 'text-lg', px: 36 },
    secondsSlot: 83,
    valueGap: 'gap-section-md',
    leading: 'leading-none',
    slot: { oneDigitReps: 56, twoDigitReps: 101 },
    velocity: 'text-3xl',
    barHeight: 48,
    barPitch: 24,
  },
  phone: {
    title: 'text-base',
    sub: 'text-sm',
    hero: 'text-3xl',
    heroUnit: 'text-lg',
    heroPx: 36,
    reducedRest: { size: 'text-2xl', unit: 'text-base', px: 32 },
    secondsSlot: 71,
    valueGap: 'gap-inline-md',
    leading: '',
    slot: { oneDigitReps: 43, twoDigitReps: 76 },
    velocity: 'text-2xl',
    barHeight: 32,
    barPitch: 12,
  },
}

// Digit ink spans 0.714em above the baseline to 0.014em below it, so its centre sits 0.35em up.
const DIGIT_INK_CENTRE_EM = 0.35

/** The rest readout's type: seconds, their size and unit classes, and the raise that centres them. */
export function liveStripRestType(layout: PinnedLiveStripLayout, remainingMs: number | undefined) {
  const scale = SCALES[layout]
  const { seconds, step } = liveStripRestReadout(remainingMs)
  if (step === 'full') return { seconds, size: scale.hero, unit: scale.heroUnit, raisePx: 0 }
  const { size, unit, px } = scale.reducedRest
  return { seconds, size, unit, raisePx: DIGIT_INK_CENTRE_EM * (scale.heroPx - px) }
}

export type Tone = 'live' | 'rest' | 'fatigue'

const LIVE_TAG = { dot: 'status-live', text: 'status-success', label: 'Live set' } as const

// Fatigue changes only the edge and the wash; its tag stays the live tag (VW-429 round 2).
export const TONE = {
  live: { edge: 'status-live', tag: LIVE_TAG },
  rest: {
    edge: 'brand-primary',
    tag: { dot: 'brand-primary', text: 'status-warning', label: 'Resting' },
  },
  fatigue: { edge: 'status-error', tag: LIVE_TAG },
} as const

export interface SetLineProps {
  state: LiveStripState
  setNumber: number
  setCount: number
  loadLabel?: string
  targetSource?: LiveStripTargetSource
}

/** Where the set's targets came from: the lifter's plan, or derived from last time's sets. */
export type LiveStripTargetSource = 'plan' | 'last-time'

export function setLine(props: SetLineProps, short: boolean): string {
  const { state, setNumber, setCount, loadLabel, targetSource } = props
  const isRest = state === 'rest'
  const source = targetSource === 'last-time' ? ' · last time' : ''
  if (short) return `${isRest ? 'Next' : 'Set'} ${setNumber}/${setCount}${source}`
  const base = `${isRest ? 'Next: set' : 'Set'} ${setNumber} of ${setCount}${source}`
  return loadLabel ? `${base} · ${loadLabel}` : base
}

export function StateTag({ tone }: { tone: Tone }) {
  const t = TONE[tone].tag
  return (
    <View className="flex-row items-baseline gap-inline-sm" testID="live-strip-tag">
      <Indicator
        size="md"
        customColor={resolveColor(t.dot)}
        pulse={tone === 'rest' ? false : 'ping'}
        testID="live-strip-tag-dot"
      />
      <Typography variant="overline" style={{ color: resolveColor(t.text) }}>
        {t.label}
      </Typography>
    </View>
  )
}

export function Title({ name, scale, lines }: { name: string; scale: Scale; lines: number }) {
  return (
    <Text
      testID="live-strip-title"
      numberOfLines={lines}
      className={cn('font-heading font-bold text-text-primary', scale.title)}
    >
      {name}
    </Text>
  )
}

export function Overline({ label, width }: { label: string; width?: number }) {
  return (
    <View style={width != null ? { width } : null}>
      <Typography variant="overline" color="tertiary" className="leading-none" numberOfLines={1}>
        {label}
      </Typography>
    </View>
  )
}

export function BackToLive() {
  return (
    <View className="flex-row items-center gap-inline-sm rounded-lg bg-interactive-active px-control-x-md py-control-y-md">
      <Text className="font-heading text-lg font-bold text-text-primary">Back to live</Text>
      <ChevronRightIcon size={22} color={resolveColor('text-primary')} />
    </View>
  )
}

export function StripPlane({
  tone,
  isPhone,
  children,
}: {
  tone: Tone
  isPhone: boolean
  children: ReactNode
}) {
  return (
    <Surface
      elevation={4}
      rounded
      testID="live-strip-plane"
      className="overflow-hidden rounded-xl border-l-4"
      style={[
        { borderLeftColor: resolveColor(TONE[tone].edge) },
        isPhone ? { minHeight: PHONE_MIN_HEIGHT } : { height: WALL_HEIGHT },
      ]}
    >
      {tone === 'fatigue' ? (
        <View
          testID="live-strip-fatigue-wash"
          pointerEvents="none"
          className="absolute inset-0 bg-status-error-subtle"
        />
      ) : null}
      {children}
    </Surface>
  )
}

export function RestBar({
  restRemainingMs,
  restDurationMs,
}: {
  restRemainingMs?: number
  restDurationMs?: number
}) {
  const max = liveStripMs(restDurationMs)
  if (max === 0) return null
  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="none">
      <Progress
        value={Math.min(max, liveStripMs(restRemainingMs))}
        max={max}
        size="sm"
        accessibilityLabel="Rest remaining"
        testID="live-strip-rest-bar"
      />
    </View>
  )
}

// Server rendering has no layout to read, and React 18 warns on a server-side useLayoutEffect.
const useLayoutEffectOnClient = typeof window === 'undefined' ? useEffect : useLayoutEffect

const layoutFor = (width: number): PinnedLiveStripLayout =>
  width < PINNED_LIVE_STRIP_PHONE_MAX ? 'phone' : 'wall'

/**
 * The forced layout, else the measured one; null until the first measurement, so the strip never
 * paints the wall form for a frame on a phone. On the web the frame is measured before the first
 * paint, and `onLayout` (which react-native-web defers to a timer) follows resizes. On React
 * Native the first frame is empty rather than wrong, and `onLayout` fires on the next.
 * Server-rendered HTML carries only the empty frame: the strip appears once the client measures it.
 */
export function useStripLayout(forced?: PinnedLiveStripLayout) {
  const ref = useRef<View>(null)
  const [measured, setMeasured] = useState<PinnedLiveStripLayout | null>(null)
  // A zero width is a frame not laid out yet (jsdom, display: none), not a phone.
  const measure = (width: number) => {
    if (width > 0) setMeasured(layoutFor(width))
  }
  useLayoutEffectOnClient(() => {
    if (Platform.OS !== 'web' || forced || measured) return
    const node = ref.current as unknown as HTMLElement | null
    measure(node?.getBoundingClientRect().width ?? 0)
  })
  const onLayout = (e: LayoutChangeEvent) => measure(e.nativeEvent.layout.width)
  return { layout: forced ?? measured, onLayout, ref }
}

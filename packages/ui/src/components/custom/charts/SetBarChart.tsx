// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * SetBarChart — the generic per-rep value-height bar chart both the velocity hero and the
 * ROM progression compose. It OWNS the chart geometry (value→height scaling, the shared
 * `scaleMax` override, the plot-width-driven adaptive bar width / gap stepping / value-label
 * thinning) and the shared bar language (paper treatment, grow-from-bottom live rep, up/down
 * orientation, the set-type slot vocabulary). Everything domain-specific — bar COLOR, the
 * reference overlay (velocity VL bands / ROM working+short lines) — is passed in, so an
 * improvement to the chart (spacing, paper, live-grow) lands once for every consumer.
 *
 * VALUE-HEIGHT ONLY: the flat 3px `mini` strip stays its own thin strip in VelocityStrip.
 */
import { useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Animated,
  type ViewProps,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { barPaper } from '../../../theme/bar-paper'
import { useOnSurfaceColor, useSurface, surfaceBackground } from '../../ui/surface/SurfaceContext'
import { useLiveRepGrowth } from './live-rep-growth'

/** Linear-blend two #RRGGBB hexes (`t`=0 → a, 1 → b) — the surface-relative solid to-do tone. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] => {
    const s = h.replace('#', '')
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const ch = (x: number, y: number): string =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}

/** The cyan variable-window fill — the range set's `floor..max` window (shared with SetStrip). */
const VARIABLE_FILL = primitiveRamps.cyan[900]
/** The thin cyan-800 outline on the open-ended "continue" slot — reads as "keep going". */
const CONTINUE_OUTLINE = primitiveRamps.cyan[800]

/**
 * One drawn cell of the chart. `rep` carries a `value` and draws a value-height bar;
 * `todo` / `variable` / `continue` are the set-type window stubs (planned remainder, the
 * range floor..max window, the AMRAP/myo open tail); `empty` is a rep COLUMN a side didn't
 * log — a faint constant-contrast placeholder that keeps the two diverging wings index-locked
 * (a lagging side's missing rep sits at the SAME column index as the other side's rep).
 * `leadingGap` adds spacing BEFORE the cell beyond the uniform inter-bar gap — the WIDE
 * chunk-notch that splits drop sub-loads / myo clusters / cluster intra-rests. Absent
 * `leadingGap` = the ordinary rep gap.
 */
export interface SetSlot {
  kind: 'rep' | 'todo' | 'variable' | 'continue' | 'empty'
  value?: number
  leadingGap?: number
}

/** The geometry SetBarChart hands a {@link SetBarChartProps.renderReference} overlay painter. */
export interface SetBarGeometry {
  /** The height-scaling denominator (a value `v` sits `yOf(v)` px up from the baseline). */
  scaleDenom: number
  /** The drawable plot height (px) — `height` minus the value-label headroom when labels show. */
  plotHeight: number
  /** px UP from the baseline for a value. */
  yOf: (value: number) => number
  /** The tallest performed value — the running-best reps are measured against. */
  best: number
  /** The plot is vertically mirrored (a `down` wing) — counter-flip any text in the overlay. */
  flip: boolean
}

export interface SetBarChartProps {
  /** Ordered cells — performed reps + any set-type window stubs. */
  slots: SetSlot[]
  /** value → bar fill color. Reps only; window stubs use the fixed set-type tones. */
  colorFor: (value: number) => string
  /** Plot height (px). Bars scale into this (minus the value-label headroom when labels show). */
  height: number
  /**
   * Height scaling. `peak` (default) scales to the performed max (+headroom); `fixed` scales
   * to a fixed velocity ceiling so heights read the same absolute value across sets. Overridden
   * by {@link scaleMax}.
   */
  scale?: 'peak' | 'fixed'
  /**
   * OVERRIDE the height denominator with `scaleMax * headroom` (BAR HEIGHT ONLY; color + the
   * reference `best` still read this chart's own values). The diverging dual passes the pair's
   * shared max so a stronger side reads TALLER against one common scale.
   */
  scaleMax?: number
  /** `up` (default) grows bars UP from a bottom baseline; `down` mirrors the plot (grows DOWN, text upright). */
  orientation?: 'up' | 'down'
  /** Index (into the rep slots) of the newest rep — that bar grows up from the baseline as it lands. */
  liveRepIndex?: number
  /** The live rep set a new peak — its entrance overshoots then settles (a small bounce). */
  isNewPeak?: boolean
  /**
   * Append dashed todo placeholders so the chart reads "3 of N done". Ignored when the `slots`
   * already run to (or past) this count — a caller that supplies its own todo slots omits this.
   */
  targetReps?: number
  /**
   * Inter-bar gap as a fraction of bar width (gap ≈ gapRatio·barWidth, floored at 2px). Default
   * {@link GAP_RATIO}. Lower = denser (toward the near-touching expanded density); narrow screens
   * floor to 2px regardless. Exposed mainly for a spacing-density comparison.
   */
  gapRatio?: number
  /** Top-corner radius on the bars (px). Default 5. */
  barRadius?: number
  /**
   * FLAT height mode (the `compact` resting form). Every rep bar renders at ONE uniform short height
   * ({@link FLAT_BAR_FRACTION} of the plot) instead of value-height — EVERYTHING else identical
   * (colors, paper, the proportional spacing + chunk-notch, todo/variable/continue slots, gutter).
   * Value labels are suppressed. Same x-positions/widths/gaps as value mode, so a compact↔expanded
   * toggle only changes bar HEIGHTS in place (no horizontal reflow).
   */
  flat?: boolean
  /**
   * Draw a per-rep value label. Default false. When on, every label pins to one aligned row at the
   * plot TOP (not offset per bar height) in the muted on-surface-secondary tone. Ignored in {@link flat} mode.
   */
  showValueLabels?: boolean
  /** Format a rep value for its label. Default `String`. */
  formatValue?: (value: number) => string
  /**
   * To-do placeholder treatment. `solid` (default) — a solid surface-relative section (the plane
   * blended toward the on-surface neutral). `dashed` — a dashed outline stub. Exists so ROM can keep
   * its dashed to-do while the hero (and the dual that composes it) take the solid section.
   */
  todoVariant?: 'solid' | 'dashed'
  /**
   * Pad the rendered columns to at least this many with placeholder to-do cells. The diverging dual
   * passes the union column count of both wings so bars line up top↔bottom across the centre axis.
   */
  minColumns?: number
  /** Paint a reference overlay (VL bands / working-standard lines) given the chart geometry. */
  renderReference?: (geometry: SetBarGeometry) => ReactNode
  /** Suppress the plot's own 2px baseline border (the dual draws ONE shared centre axis instead). */
  hideBaseline?: boolean
  /** Container testID. */
  testID?: string
  /** Prefix for the per-cell testIDs: `${prefix}-bar-N`, `${prefix}-label-N`, `${prefix}-slot-KIND`. Default `setbar`. */
  testIDPrefix?: string
  /** When set, the container reads as an `image` with this label; omit for a plain (unlabeled) plot. */
  accessibilityLabel?: string
  /**
   * Optional stream / slot NAME (e.g. "Left Arm") rendered as a rotated vertical edge label down a
   * left gutter — the same treatment the diverging dual gives each wing. Font size scales to `height`
   * so it fits without truncation. Omitted → no gutter.
   */
  label?: string
  className?: string
  /** Rest View props (style is merged onto the container). */
  viewProps?: ViewProps
}

/** The `scale="fixed"` velocity ceiling (m/s) — a bar height reads the same absolute value across sets. */
const FIXED_MAX_VALUE = 1.15
/** Headroom above the peak bar: just enough to seat its value label without a big empty band on top. */
export const PEAK_HEADROOM = 1.06

/** The height-scaling denominator for `scale` at the given performed max (guarded ≥ 0 by callers). */
export function scaleDenominator(scale: 'peak' | 'fixed', maxValue: number): number {
  return scale === 'fixed' ? FIXED_MAX_VALUE : maxValue * PEAK_HEADROOM
}

/**
 * The per-bar value-label font size (px), scaled to chart `height` (floored at 8) so the numbers stay
 * proportionate to the bars at small heights instead of reading oversized. Hits the full 12px at the
 * standard single-hero (220px) and dual-wing (~110px) scales; shrinks toward the floor on tiny charts.
 */
export function valueLabelFontSize(height: number): number {
  return Math.round(Math.max(8, Math.min(12, height * 0.11)))
}

// --- Hero geometry -----------------------------------------------------------
/** Default plot height (px) — tall enough to read a set's shape across a room. */
export const SET_BAR_DEFAULT_HEIGHT = 220
/** Value-label row height (px) — the only headroom reserved above the bars when labels show. */
const LABEL_ROW_HEIGHT = 16
/** Gap between the value-label row and the peak bar top (px). */
const LABEL_GAP = 3
/** Inter-bar gap as a fraction of bar width — the locked dense default (near expanded density). */
const GAP_RATIO = 0.08
/** Floor on the proportional inter-bar gap (px) — narrow plots tighten to ~expanded density. */
const MIN_BAR_GAP = 2
/**
 * The EXTRA margin at a chunk boundary (drop sub-load / myo cluster / cluster intra-rest), as a
 * fraction of bar width — proportional so it scales with the dense spacing and reads as a clear
 * cluster break (total boundary gap ≈ this + the normal gapRatio ≈ ⅓ of a bar). Floored so small
 * charts still separate clusters.
 */
const CHUNK_NOTCH_RATIO = 0.25
/** Floor on the chunk-boundary extra margin (px). */
const CHUNK_NOTCH_MIN_PX = 10
/** Cap on a single bar's width so a 2–3 rep set doesn't render slab-wide bars (px). */
const BAR_MAX_WIDTH = 120
/** Below this per-bar width the value labels collide, so all but the peak + live rep are dropped. */
const LABEL_MIN_BAR_WIDTH = 30
/** Default top-corner radius on bars (px). */
const DEFAULT_BAR_RADIUS = 5
/** Minimum drawn height of a performed bar (px) — a near-zero rep still reads as a rep. */
const MIN_BAR_HEIGHT = 4
/** In `flat` (compact) mode every rep bar is this fraction of the plot height — a uniform short bar. */
const FLAT_BAR_FRACTION = 0.5
/** The stub height for a window cell (todo / variable / continue / empty) — a short, clear placeholder. */
const STUB_HEIGHT = 9
/** The ordinary rep gap the per-slot `leadingGap` is measured against (extra margin = leadingGap − this). */
const REP_GAP = 2

/** Is this cell a performed rep (carries a value)? */
function isRep(slot: SetSlot): boolean {
  return slot.kind === 'rep'
}

/**
 * The performed-rep index for each cell (`-1` for a window stub) — reps are contiguous from 0 in
 * every set type, so this maps `liveRepIndex` / peak / label-thinning (rep-indexed) onto cells.
 */
function repIndexByCell(cells: SetSlot[]): number[] {
  let count = 0
  return cells.map((slot) => (isRep(slot) ? count++ : -1))
}

export function SetBarChart({
  slots,
  colorFor,
  height,
  scale = 'peak',
  scaleMax,
  orientation = 'up',
  liveRepIndex,
  isNewPeak = false,
  targetReps,
  gapRatio = GAP_RATIO,
  barRadius = DEFAULT_BAR_RADIUS,
  flat = false,
  showValueLabels: showValueLabelsProp = false,
  formatValue = String,
  todoVariant = 'solid',
  minColumns,
  renderReference,
  hideBaseline = false,
  testID,
  testIDPrefix = 'setbar',
  accessibilityLabel,
  label,
  className,
  viewProps = {},
}: SetBarChartProps) {
  // Append todo placeholders up to `targetReps` (a caller that builds its own todo slots omits it),
  // then pad to `minColumns` so a diverging wing aligns column-for-column with its sibling.
  const targetPadded = Math.max(slots.length, targetReps ?? 0, minColumns ?? 0)
  const cells: SetSlot[] =
    targetPadded > slots.length
      ? [
          ...slots,
          ...Array.from({ length: targetPadded - slots.length }, () => ({ kind: 'todo' as const })),
        ]
      : slots

  const repValues = cells.filter(isRep).map((s) => s.value ?? 0)
  const best = repValues.length > 0 ? Math.max(...repValues) : 0

  // The whole plot mirrors for `down`; text nodes counter-flip so they read upright.
  const flip = orientation === 'down'
  const flipStyle = flip ? ({ transform: [{ scaleY: -1 as number }] } as const) : null

  // Planned/to-do reps + the baseline draw in a SURFACE-relative neutral (on-surface tertiary)
  // so they stay legible on every plane instead of a fixed charcoal.
  const placeholderColor = useOnSurfaceColor('tertiary')
  // The expanded strip's solid to-do tone: the surface plane blended toward the neutral (the same
  // relative model), so a `todoVariant="solid"` section holds ~constant contrast on every plane.
  const surface = useSurface()
  const surfaceBg = surfaceBackground(surface.level, surface.mode)
  const solidTodoColor = mixHex(surfaceBg, placeholderColor, 0.55)
  // An `empty` cell (a rep the diverging side didn't log) is fainter than a planned to-do.
  const emptyColor = mixHex(surfaceBg, placeholderColor, 0.28)

  // `scaleMax` (the diverging dual's shared pair-max) overrides the height denominator so both
  // sides share ONE height scale; color + the reference still read this chart's own values.
  const scaleDenom =
    scaleMax != null && scaleMax > 0 ? scaleMax * PEAK_HEADROOM : scaleDenominator(scale, best)

  // `flat` (compact) mode suppresses value labels and renders every rep at one uniform short height.
  const showValueLabels = showValueLabelsProp && !flat
  // Reserve ONLY the value-label row (+ its gap to the peak bar) as headroom — not a fat fixed
  // band — so the bars fill the plot and, at small heights, aren't over-stubbed.
  const plotHeight = Math.max(0, height - (showValueLabels ? LABEL_ROW_HEIGHT + LABEL_GAP : 0))
  const yOf = (value: number): number => (scaleDenom > 0 ? (value / scaleDenom) * plotHeight : 0)
  const flatBarHeight = Math.max(MIN_BAR_HEIGHT, FLAT_BAR_FRACTION * plotHeight)
  const barHeight = (value: number): number =>
    flat
      ? flatBarHeight
      : scaleDenom > 0
        ? Math.max(MIN_BAR_HEIGHT, Math.min(1, value / scaleDenom) * plotHeight)
        : MIN_BAR_HEIGHT

  // Live-rep grow-from-bottom (rep index → cell index; reps are contiguous from 0 in every set type).
  const liveValue =
    liveRepIndex != null && liveRepIndex < repValues.length ? repValues[liveRepIndex] : undefined
  const liveGrowth = useLiveRepGrowth(true, liveRepIndex, liveValue, isNewPeak)

  // Measure the plot so per-bar value labels can thin on a narrow chart (they collide once bars
  // get thin). Width 0 (unmeasured) → show all, so test/server renders are unchanged.
  const [plotW, setPlotW] = useState(0)
  const onPlotLayout = (e: LayoutChangeEvent) => setPlotW(e.nativeEvent.layout.width)

  // Inter-bar gap is PROPORTIONAL to bar width (gap ≈ gapRatio·barWidth, floored at MIN_BAR_GAP).
  // Solve N·bw + (N−1)·(gapRatio·bw) = plotW → bw = plotW / (N + (N−1)·gapRatio); the bars tighten to
  // ~expanded density on narrow plots (the floor) and the ratio sets how dense they read at wall scale.
  const totalCells = cells.length
  const rawBarWidth =
    plotW > 0 && totalCells > 0 ? plotW / (totalCells + (totalCells - 1) * gapRatio) : BAR_MAX_WIDTH
  const barWidth = Math.min(BAR_MAX_WIDTH, rawBarWidth)
  const labelsCrowded = plotW > 0 && barWidth < LABEL_MIN_BAR_WIDTH
  const gap = plotW === 0 ? MIN_BAR_GAP : Math.max(MIN_BAR_GAP, gapRatio * barWidth)

  // Peak rep index (over rep values) — its label always survives label-thinning.
  const peakRepIndex = repValues.reduce((b, v, i) => (v > repValues[b] ? i : b), 0)
  const showBarLabel = (repIndex: number): boolean =>
    !labelsCrowded || repIndex === peakRepIndex || repIndex === liveRepIndex

  const geometry: SetBarGeometry = { scaleDenom, plotHeight, yOf, best, flip }

  const { style: externalStyle, ...restProps } = viewProps
  const a11y =
    accessibilityLabel != null ? { accessibilityRole: 'image' as const, accessibilityLabel } : {}

  // Which performed rep each cell is (window stubs → -1) — for live-grow / peak / label thinning.
  const repIndices = repIndexByCell(cells)

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'row' }, externalStyle]}
      testID={testID}
      {...a11y}
      {...restProps}
    >
      {label ? (
        <ChartSideRail
          sections={[{ label, testID: `${testIDPrefix}-side-label` }]}
          sectionExtent={height}
        />
      ) : null}
      <View
        onLayout={onPlotLayout}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap,
          position: 'relative',
          borderBottomWidth: hideBaseline ? 0 : 2,
          borderBottomColor: placeholderColor,
          ...flipStyle,
        }}
      >
        {renderReference?.(geometry)}

        {cells.map((slot, i) => {
          // A chunk boundary (leadingGap > the ordinary rep gap) gets extra margin PROPORTIONAL to
          // bar width (floored) so the cluster break scales with the dense spacing and stays clear;
          // ordinary cells add nothing beyond the container's flex gap.
          const isChunkBoundary = (slot.leadingGap ?? REP_GAP) > REP_GAP
          const extraGap = isChunkBoundary
            ? Math.max(CHUNK_NOTCH_MIN_PX, CHUNK_NOTCH_RATIO * barWidth)
            : 0
          const column: ViewStyle = {
            flex: 1,
            maxWidth: BAR_MAX_WIDTH,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginLeft: extraGap,
          }

          if (!isRep(slot)) {
            return (
              <View key={i} accessibilityElementsHidden style={column}>
                {renderStub(
                  slot.kind,
                  barRadius,
                  placeholderColor,
                  testIDPrefix,
                  todoVariant,
                  solidTodoColor,
                  emptyColor
                )}
              </View>
            )
          }

          const repIndex = repIndices[i]
          const value = slot.value ?? 0
          const isLive = liveRepIndex === repIndex
          const color = colorFor(value)
          return (
            <View key={i} accessibilityElementsHidden style={column}>
              {showValueLabels && showBarLabel(repIndex) && (
                // All labels pin to one aligned row JUST ABOVE THE PEAK BAR (not the container top),
                // in the muted on-surface-secondary tone — so the row hugs the bars, no floating void.
                <View
                  style={{
                    position: 'absolute',
                    bottom: barHeight(best) + LABEL_GAP,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                  }}
                  pointerEvents="none"
                >
                  <Text
                    className="text-text-secondary"
                    style={[{ fontSize: valueLabelFontSize(height), fontWeight: '700' }, flipStyle]}
                    testID={`${testIDPrefix}-label-${repIndex}`}
                  >
                    {formatValue(value)}
                  </Text>
                </View>
              )}
              <Animated.View
                style={[
                  {
                    width: '100%',
                    height: isLive
                      ? liveGrowth.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, barHeight(value)],
                        })
                      : barHeight(value),
                    borderTopLeftRadius: barRadius,
                    borderTopRightRadius: barRadius,
                    backgroundColor: color,
                  },
                  barPaper(color, flip),
                ]}
                testID={`${testIDPrefix}-bar-${repIndex}`}
              />
            </View>
          )
        })}
      </View>
    </View>
  )
}

/** A window cell (planned / variable / continue / empty) — a fixed-height stub in its set-type tone. */
function renderStub(
  kind: SetSlot['kind'],
  barRadius: number,
  placeholderColor: string,
  testIDPrefix: string,
  todoVariant: 'dashed' | 'solid',
  solidTodoColor: string,
  emptyColor: string
): ReactNode {
  const base: ViewStyle = {
    width: '100%',
    height: STUB_HEIGHT,
    borderTopLeftRadius: barRadius,
    borderTopRightRadius: barRadius,
  }
  if (kind === 'variable') {
    return (
      <View
        style={{ ...base, backgroundColor: VARIABLE_FILL }}
        testID={`${testIDPrefix}-slot-variable`}
      />
    )
  }
  if (kind === 'continue') {
    return (
      <View
        style={{ ...base, borderWidth: 1, borderColor: CONTINUE_OUTLINE }}
        testID={`${testIDPrefix}-slot-continue`}
      />
    )
  }
  if (kind === 'empty') {
    // A rep column the diverging side did NOT log — a faint constant-contrast section, quieter than
    // a planned to-do (it's a hole in this side's data, index-locked to the other side's rep).
    return (
      <View
        style={{ ...base, backgroundColor: emptyColor }}
        testID={`${testIDPrefix}-slot-empty`}
      />
    )
  }
  // todo — a solid surface-relative section (expanded language) or a dashed outline (hero language).
  const todoStyle: ViewStyle =
    todoVariant === 'solid'
      ? { ...base, backgroundColor: solidTodoColor }
      : { ...base, borderWidth: 1, borderStyle: 'dashed', borderColor: placeholderColor }
  return <View style={todoStyle} testID={`${testIDPrefix}-slot-todo`} />
}

/** Side/stream-name label font size (px), scaled to chart height so a long name fits un-truncated. */
export function sideLabelFontSize(height: number): number {
  return Math.round(Math.max(7, Math.min(13, height * 0.06)))
}

/**
 * Below this vertical extent (px) the side label collapses to initials rather than shrink further.
 * A 120px dual (60px per wing) sits below this, so its wings degrade to "L" / "R"; the compact `rail`
 * is exempted at its call site (it keeps its own tuned full-name treatment).
 */
export const SIDE_LABEL_INITIALS_BELOW = 70

/**
 * The side-label text for the available vertical `extent`: the full name when there's room, else it
 * degrades to INITIALS — the first letter of each word ("Left Arm" → "L A", "Left" → "L", "Right" →
 * "R") — so a slot name stays legible at tiny chart heights instead of shrinking into a smear.
 */
export function sideLabelText(label: string, extent: number): string {
  if (extent >= SIDE_LABEL_INITIALS_BELOW) return label
  return label
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join(' ')
    .toUpperCase()
}

/** One section of the shared {@link ChartSideRail} — a wing's rotated stream/slot-name label. */
export interface SideRailSection {
  label?: string
  testID: string
}

/**
 * The ONE shared gutter/side-rail lockup used by BOTH the single hero and the diverging dual, so a
 * single chart is pixel-identical to the dual's upper half — going dual only adds a lower section.
 * A fixed-width gutter (34px hero / 18px rail) with the `border-border` right hairline (the vertical
 * axis) and one rotated, height-responsive, initials-collapsing label per section (each `sectionExtent`
 * tall). The single passes ONE section; the dual passes two (up + down wings). Rendered null when no
 * section carries a label. The rotate lives on a wrapper sized to `sectionExtent` so `numberOfLines`
 * resolves against the tall vertical extent — a long name only ellipsizes when it exceeds the section.
 */
export function ChartSideRail({
  sections,
  sectionExtent,
  variant = 'hero',
}: {
  sections: SideRailSection[]
  sectionExtent: number
  variant?: 'hero' | 'rail'
}) {
  if (!sections.some((s) => s.label)) return null
  const isRail = variant === 'rail'
  const labelLength = Math.max(0, sectionExtent - (isRail ? 0 : 6))
  // Font scales to the SECTION (wing) height so a slot name fits without truncating; the compact rail
  // keeps its own tuned 7px full-name treatment (hero + single collapse to initials at small heights).
  const fontSize = isRail ? 7 : sideLabelFontSize(sectionExtent)
  const textStyle = {
    maxWidth: '100%' as const,
    textAlign: 'center' as const,
    fontSize,
    fontWeight: '700' as const,
    letterSpacing: isRail || fontSize < 10 ? 0 : 2,
    textTransform: 'uppercase' as const,
  }
  return (
    <View
      className={isRail ? undefined : 'border-border'}
      style={{ width: isRail ? 18 : 34, borderRightWidth: isRail ? 0 : 1 }}
      accessibilityElementsHidden
    >
      {sections.map((s) => (
        <View
          key={s.testID}
          style={{ height: sectionExtent, alignItems: 'center', justifyContent: 'center' }}
        >
          {s.label ? (
            <View
              style={{
                width: labelLength,
                alignItems: 'center',
                transform: [{ rotate: '-90deg' }],
              }}
            >
              <Text
                className="text-text-tertiary"
                style={textStyle}
                numberOfLines={1}
                testID={s.testID}
              >
                {isRail ? s.label : sideLabelText(s.label, sectionExtent)}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

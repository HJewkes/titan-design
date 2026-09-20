// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, Pressable } from 'react-native'
import { Typography } from '../../ui/typography'
import { cn } from '../../../utils/cn'
import { roundWeight } from '../../../utils/workout-format'
import { useSurfaceMode } from '../../ui/surface/SurfaceContext'
import { SetsRepsLoad } from './SetsRepsLoad'
import { TempoDisplay } from './TempoDisplay'
import { ExerciseIndicator, type ExerciseIndicatorKind } from './ExerciseIndicator'
import { exerciseLiveColor } from './exerciseRowState'

/** Dim depth for a not-yet-reached exercise, when the block dims itself. */
const DIMMED_OPACITY = 0.55

/** `stacked` puts the prescription on its own line under the name; `inline` keeps one row. */
export type ExerciseHeadingLayout = 'stacked' | 'inline'

interface ExerciseHeadingBaseProps {
  name: string
  unit?: 'lbs' | 'kg'
  /** Tempo tuple [eccentric, pauseBottom, concentric, pauseTop]. `stacked` layout only. */
  tempo?: [number, number, number, number]
  /** Small PR / issue / info chip in the title row. */
  indicator?: ExerciseIndicatorKind
  /** Dim the block as a not-yet-reached exercise (standalone use). */
  dimmed?: boolean
  /** Row shape. Default `stacked`. */
  layout?: ExerciseHeadingLayout
  /**
   * Render the structured `sets × reps @ load` prescription in one dimmer, regular
   * tone instead of the rail's bright/bold value cells. `stacked` (rail) never sets
   * this; `inline` (compact, upcoming) always does.
   */
  mutedPrescription?: boolean
  /** Trailing right-edge caption (a previous best). `inline` layout only. */
  previousBest?: string
  /** This exercise is being performed right now — the name takes the live tone, never animated. */
  isLive?: boolean
  /**
   * Who owns the press. `self` (default) makes the name row the button. `ancestor`
   * renders it as a plain row, for a wrapper that presses as a whole — legal only in
   * `inline` layout, since `stacked`'s TempoDisplay sibling is itself a Pressable.
   */
  pressTarget?: 'self' | 'ancestor'
  /** Press target for the name row (expand / select). */
  onPress?: () => void
  onPressIn?: () => void
  onPressOut?: () => void
  /** Web-only; on a touch surface these never fire and the row has no hover state. */
  onHoverIn?: () => void
  onHoverOut?: () => void
}

/**
 * The prescription is EITHER the structured `sets × reps @ load` triple, OR a
 * free-text line for an exercise whose numbers aren't loaded yet, OR absent.
 * Mixing the two is a type error rather than a silently half-rendered line.
 */
type ExerciseHeadingPrescription =
  | { sets: number; reps: number | string; load: number | string; prescription?: never }
  | { prescription: string; sets?: never; reps?: never; load?: never }
  | { sets?: never; reps?: never; load?: never; prescription?: never }

export type ExerciseHeadingProps = ExerciseHeadingBaseProps & ExerciseHeadingPrescription

function prescriptionText(p: ExerciseHeadingProps, unit: string): string | undefined {
  if (p.prescription !== undefined) return p.prescription
  if (p.sets === undefined) return undefined
  const loadLabel = typeof p.load === 'number' ? roundWeight(p.load) : p.load
  return `${p.sets}×${p.reps} @ ${loadLabel} ${unit}`
}

/** The row's accessible name. Exported so a wrapper that owns the press can reuse it. */
export function exerciseHeadingLabel(p: ExerciseHeadingProps, unit: string = p.unit ?? 'lbs') {
  const prescription = prescriptionText(p, unit)
  return prescription ? `${p.name}, ${prescription}` : p.name
}

function pressProps(p: ExerciseHeadingProps, unit: string) {
  return {
    onPress: p.onPress,
    onPressIn: p.onPressIn,
    onPressOut: p.onPressOut,
    onHoverIn: p.onHoverIn,
    onHoverOut: p.onHoverOut,
    accessibilityRole: 'button' as const,
    accessibilityLabel: exerciseHeadingLabel(p, unit),
  }
}

interface NameStyle {
  color: string
}

function HeadingName({
  name,
  nameStyle,
  className,
}: {
  name: string
  nameStyle?: NameStyle
  className?: string
}) {
  return (
    // The row is a button label, not a heading, so `boldLabel` carries the weight and
    // no header role has to be undone. Size and the Space Grotesk face are pinned.
    <Typography
      variant="boldLabel"
      color={nameStyle ? 'inherit' : 'primary'}
      style={nameStyle}
      className={cn('font-heading text-sm leading-[normal]', className)}
      testID="exercise-card-name"
    >
      {name}
    </Typography>
  )
}

function prescriptionNode(p: ExerciseHeadingProps, unit: string): ReactNode {
  if (p.prescription !== undefined) {
    return (
      <Typography
        variant="caption"
        color="secondary"
        maxLines={1}
        className="font-sans shrink leading-[normal]"
        testID="exercise-card-prescription"
      >
        {p.prescription}
      </Typography>
    )
  }
  if (p.sets === undefined) return null
  return (
    <SetsRepsLoad
      sets={p.sets}
      reps={p.reps}
      load={p.load}
      unit={unit}
      muted={p.mutedPrescription}
    />
  )
}

interface LayoutProps {
  heading: ExerciseHeadingProps
  nameStyle?: NameStyle
}

function StackedHeading({ heading, nameStyle }: LayoutProps) {
  const { unit = 'lbs', tempo, indicator } = heading
  return (
    <>
      <Pressable
        {...pressProps(heading, unit)}
        className="flex-row items-center gap-inline-md"
        testID="exercise-card-header"
      >
        <HeadingName name={heading.name} nameStyle={nameStyle} />
        <View className="flex-1" />
        {indicator && <ExerciseIndicator kind={indicator} />}
      </Pressable>

      <View
        className="flex-row items-center gap-inline-md"
        // optical: 1px lifts the prescription line off the name's descenders.
        style={{ marginTop: 1 }}
        testID="exercise-card-summary"
      >
        {prescriptionNode(heading, unit)}
        <View className="flex-1" />
        {tempo && <TempoDisplay tempo={tempo} size="sm" showLabel={false} showInfo={false} />}
      </View>
    </>
  )
}

function InlineHeading({ heading, nameStyle }: LayoutProps) {
  const { unit = 'lbs', indicator, previousBest } = heading
  const Row = heading.pressTarget === 'ancestor' ? View : Pressable
  return (
    <Row
      {...(heading.pressTarget === 'ancestor' ? {} : pressProps(heading, unit))}
      className="flex-row items-center gap-inline-md"
      testID="exercise-card-header"
    >
      {/* Name never truncates (no numberOfLines); prescription + previousBest ellipsize first. */}
      <HeadingName name={heading.name} nameStyle={nameStyle} className="shrink-0" />
      <View className="shrink flex-row items-center" testID="exercise-card-summary">
        {prescriptionNode(heading, unit)}
      </View>
      <View className="flex-1" style={{ minWidth: 8 }} />
      {indicator && <ExerciseIndicator kind={indicator} />}
      {previousBest && (
        <Typography
          variant="caption"
          color="tertiary"
          maxLines={1}
          className="font-sans shrink text-2xs leading-[normal]"
          testID="exercise-card-previous-best"
        >
          {previousBest}
        </Typography>
      )}
    </Row>
  )
}

/**
 * The exercise-heading info block (no strip): the name + {@link ExerciseIndicator}
 * title row, its prescription line, and — `inline` only — a trailing previous-best
 * caption. The name row is the sole press target: TempoDisplay and the previous-best
 * caption are siblings of it, never descendants, since TempoDisplay is itself a
 * Pressable (nesting would be an a11y nested-interactive violation).
 *
 * `layout` is the one axis that separates the session-rail row (`stacked`) from the
 * collapsed and upcoming card rows (`inline`) — same parts, same vocabulary, one row
 * instead of two. `inline` drops the tempo: it has no room for a second metric lockup.
 */
export function ExerciseHeading(props: ExerciseHeadingProps) {
  const mode = useSurfaceMode()
  const nameStyle = props.isLive ? { color: exerciseLiveColor(mode) } : undefined

  return (
    <View style={{ opacity: props.dimmed ? DIMMED_OPACITY : 1 }} testID="exercise-heading">
      {props.layout === 'inline' ? (
        <InlineHeading heading={props} nameStyle={nameStyle} />
      ) : (
        <StackedHeading heading={props} nameStyle={nameStyle} />
      )}
    </View>
  )
}

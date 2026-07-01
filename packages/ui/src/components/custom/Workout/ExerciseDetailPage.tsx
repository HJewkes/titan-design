// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { MesoStatusCard, type MesoStatusCardProps } from './MesoStatusCard'
import {
  StrengthTrendChart,
  type StrengthTrendDataPoint,
  type StrengthTrendChartMesoBoundary,
} from './StrengthTrendChart'
import {
  CapacityBandChart,
  type CapacityBandDataPoint,
  type CapacityBandProjection,
  type WorkoutDot,
} from './CapacityBandChart'
import { ExerciseCard, type ExerciseCardProps } from './ExerciseCard'
import { type SetRowProps } from './SetRow'
import { VelocityStrip, calculateMeanVelocity, calculateVelocityLoss } from './VelocityStrip'

const SURFACE_ELEVATED = WORKOUT_TOKENS.surface.elevated
const BORDER_DEFAULT = WORKOUT_TOKENS.border.default
const BRAND_PRIMARY = '#FF7900'
const TEXT_PRIMARY = '#F3F4F6'
const TEXT_SECONDARY = '#9CA3AF'
const TEXT_TERTIARY = '#6B7280'
const PAGE_BG = '#0E0E0E'

/** Inner plot width: page width 390 − 16 page padding − 12 card padding on each side. */
const CHART_WIDTH = 326
const CHART_HEIGHT = 150

/** Which tab of the exercise detail view is showing. */
export type ExerciseDetailTab = 'progress' | 'history' | 'advanced'

/** Tabs in display order. */
export const EXERCISE_DETAIL_TABS: Array<{ key: ExerciseDetailTab; label: string }> = [
  { key: 'progress', label: 'Progress' },
  { key: 'history', label: 'History' },
  { key: 'advanced', label: 'Advanced' },
]

/** Identity + headline stats for the exercise being inspected. */
export interface ExerciseDetailHeader {
  /** Exercise name, e.g. "Barbell Bench Press". */
  name: string
  /** Context line, e.g. "Chest · Barbell". */
  subtitle: string
  /** Unit used across the page. */
  unit: 'lbs' | 'kg'
  /** Current estimated one-rep max, shown as a header pill. */
  currentE1rm?: number
}

/**
 * A single expandable entry — one progression week or one logged session.
 * Projected onto an `ExerciseCard`, so it collapses to a summary and expands
 * to its `SetRow` breakdown.
 */
export interface ExerciseDetailEntry {
  /** Stable id for inline-expansion selection. */
  id: string
  /** Row title, e.g. "Week 3" or "Mon, Jun 16". */
  title: string
  /** Collapsed summary (sets × reps @ weight). */
  summary?: ExerciseCardProps['summary']
  /** Estimated one-rep max badge. */
  e1rm?: ExerciseCardProps['e1rm']
  /** Flags a personal-record entry. */
  isPR?: boolean
  /** Prescribed tempo, revealed when expanded. */
  tempo?: ExerciseCardProps['tempo']
  /** Per-set breakdown revealed when expanded. */
  sets: SetRowProps[]
}

/** Strength-trend inputs for the Progress tab chart. */
export interface ExerciseTrend {
  /** Measured e1RM data points, chronological. */
  data: StrengthTrendDataPoint[]
  /** Planned/projected trajectory (dashed line). */
  projection?: StrengthTrendDataPoint[]
  /** Mesocycle boundary guides. */
  mesoBoundaries?: StrengthTrendChartMesoBoundary[]
}

/** One set's velocity trace for the Advanced tab breakdown. */
export interface ExerciseVbtSet {
  /** Row label, e.g. "Set 1". */
  label: string
  /** Per-rep mean concentric velocities (m/s). */
  velocities: number[]
}

/** Velocity-based-training inputs for the Advanced tab. */
export interface ExerciseVbt {
  /** Capacity band shape over time. */
  band: CapacityBandDataPoint[]
  /** Sessions plotted against the band. */
  workouts: WorkoutDot[]
  /** Optional forward band projection. */
  projection?: CapacityBandProjection
  /** Per-set velocity traces for the most recent session. */
  sets: ExerciseVbtSet[]
}

/** Page-level roll-up of the logged sessions. */
export interface ExerciseDetailStats {
  /** Number of logged sessions. */
  sessions: number
  /** Best estimated one-rep max seen, or null if none recorded. */
  bestE1rm: number | null
  /** Count of PR entries. */
  prCount: number
}

/** Aggregate velocity readout for the Advanced tab. */
export interface VbtSummary {
  /** Mean concentric velocity across every logged rep. */
  meanVelocity: number
  /** Worst within-set velocity loss (%), i.e. the most-fatigued set. */
  velocityLoss: number
}

export interface ExerciseDetailPageProps extends ViewProps {
  /** Exercise identity + headline stats. */
  exercise: ExerciseDetailHeader
  /** Mesocycle context banner (Progress tab). */
  meso: MesoStatusCardProps
  /** Strength trend inputs (Progress tab). */
  trend: ExerciseTrend
  /** Week-by-week progression entries (Progress tab). */
  progression: ExerciseDetailEntry[]
  /** All logged sessions (History tab). */
  history: ExerciseDetailEntry[]
  /** Velocity-based-training inputs (Advanced tab). */
  vbt: ExerciseVbt
  className?: string
}

/** Roll up logged sessions into the page summary (pure, testable). */
export function deriveExerciseStats(entries: ExerciseDetailEntry[]): ExerciseDetailStats {
  let bestE1rm: number | null = null
  let prCount = 0
  for (const entry of entries) {
    if (entry.e1rm != null && (bestE1rm == null || entry.e1rm.value > bestE1rm)) {
      bestE1rm = entry.e1rm.value
    }
    if (entry.isPR) prCount += 1
  }
  return { sessions: entries.length, bestE1rm, prCount }
}

/** Project an entry onto ExerciseCard props, wiring inline expansion (pure). */
export function toExerciseCardProps(
  entry: ExerciseDetailEntry,
  expanded: boolean,
  onToggle: () => void
): ExerciseCardProps {
  return {
    name: entry.title,
    state: expanded ? 'expanded' : 'collapsed',
    onToggle,
    summary: entry.summary,
    e1rm: entry.e1rm,
    isPR: entry.isPR,
    tempo: entry.tempo,
    sets: expanded ? entry.sets : undefined,
  }
}

/** Aggregate per-set velocity traces into the Advanced readout (pure). */
export function summarizeVbt(sets: ExerciseVbtSet[]): VbtSummary {
  const allReps = sets.flatMap((set) => set.velocities)
  const meanVelocity = calculateMeanVelocity(allReps)
  let velocityLoss = 0
  for (const set of sets) {
    velocityLoss = Math.max(velocityLoss, calculateVelocityLoss(set.velocities))
  }
  return { meanVelocity, velocityLoss }
}

interface TabBarProps {
  active: ExerciseDetailTab
  onSelect: (tab: ExerciseDetailTab) => void
}

function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <View
      className="flex-row"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: BORDER_DEFAULT,
      }}
      accessibilityRole={'tablist' as ViewProps['accessibilityRole']}
      testID="exercise-detail-page-tabs"
    >
      {EXERCISE_DETAIL_TABS.map(({ key, label }) => {
        const isActive = key === active
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? BRAND_PRIMARY : 'transparent',
            }}
            testID={`exercise-detail-page-tab-${key}`}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? TEXT_PRIMARY : TEXT_TERTIARY,
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const STAT_CARDS: Array<{ key: keyof ExerciseDetailStats; label: string }> = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'bestE1rm', label: 'Best e1RM' },
  { key: 'prCount', label: 'PRs' },
]

function StatStrip({ stats, unit }: { stats: ExerciseDetailStats; unit: 'lbs' | 'kg' }) {
  return (
    <View className="flex-row" style={{ gap: 8 }} testID="exercise-detail-page-stats">
      {STAT_CARDS.map(({ key, label }) => {
        const raw = stats[key]
        const value = key === 'bestE1rm' ? (raw == null ? '—' : `${raw} ${unit}`) : `${raw}`
        return (
          <View
            key={key}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor: SURFACE_ELEVATED,
              borderWidth: 1,
              borderColor: BORDER_DEFAULT,
            }}
            testID={`exercise-detail-page-stat-${key}`}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: '700',
                color: TEXT_PRIMARY,
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: TEXT_TERTIARY,
              }}
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function SectionCard({
  title,
  children,
  testID,
}: {
  title: string
  children: React.ReactNode
  testID: string
}) {
  return (
    <View
      style={{
        backgroundColor: SURFACE_ELEVATED,
        borderWidth: 1,
        borderColor: BORDER_DEFAULT,
        borderRadius: 12,
        padding: 12,
        gap: 10,
      }}
      testID={testID}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: TEXT_TERTIARY,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

interface EntryListProps {
  entries: ExerciseDetailEntry[]
  expandedId: string | null
  onToggle: (id: string) => void
  emptyLabel: string
  testID: string
}

function EntryList({ entries, expandedId, onToggle, emptyLabel, testID }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <Text
        style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: TEXT_TERTIARY }}
        testID={`${testID}-empty`}
      >
        {emptyLabel}
      </Text>
    )
  }
  return (
    <View style={{ gap: 8 }} testID={testID}>
      {entries.map((entry) => (
        <ExerciseCard
          key={entry.id}
          {...toExerciseCardProps(entry, entry.id === expandedId, () => onToggle(entry.id))}
        />
      ))}
    </View>
  )
}

function VbtBreakdown({ sets }: { sets: ExerciseVbtSet[] }) {
  return (
    <View style={{ gap: 10 }} testID="exercise-detail-page-vbt-breakdown">
      {sets.map((set) => {
        const mean = calculateMeanVelocity(set.velocities)
        const loss = calculateVelocityLoss(set.velocities)
        return (
          <View
            key={set.label}
            className="flex-row items-center"
            style={{ gap: 10 }}
            testID="exercise-detail-page-vbt-set"
          >
            <Text
              style={{
                width: 44,
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                color: TEXT_SECONDARY,
              }}
            >
              {set.label}
            </Text>
            <View className="flex-1" style={{ height: 8, justifyContent: 'center' }}>
              <VelocityStrip velocities={set.velocities} variant="mini" />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                fontVariant: ['tabular-nums'],
                color: TEXT_TERTIARY,
              }}
            >
              {`${mean.toFixed(2)} · -${loss}%`}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function VbtSummaryRow({ summary }: { summary: VbtSummary }) {
  const cells = [
    { label: 'Mean Velocity', value: `${summary.meanVelocity.toFixed(2)} m/s` },
    { label: 'Peak Vel. Loss', value: `-${summary.velocityLoss}%` },
  ]
  return (
    <View className="flex-row" style={{ gap: 8 }} testID="exercise-detail-page-vbt-summary">
      {cells.map((cell) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            backgroundColor: SURFACE_ELEVATED,
            borderWidth: 1,
            borderColor: BORDER_DEFAULT,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              color: TEXT_PRIMARY,
            }}
          >
            {cell.value}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              color: TEXT_TERTIARY,
            }}
          >
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

/**
 * ExerciseDetailPage — a tabbed per-exercise view. A shared header (name,
 * context line, current e1RM pill) sits above a Progress / History / Advanced
 * tab bar. Progress composes the `MesoStatusCard` context banner, a stats
 * strip, a `StrengthTrendChart`, and a week-by-week progression list with
 * inline `ExerciseCard` expansion. History lists every logged session with the
 * same inline expansion. Advanced surfaces VBT data via a `CapacityBandChart`,
 * a velocity summary, and a per-set `VelocityStrip` breakdown. Tab and
 * per-list expansion are page-level state; children keep their own styles.
 *
 * @example
 * <ExerciseDetailPage
 *   exercise={exercise}
 *   meso={meso}
 *   trend={trend}
 *   progression={progression}
 *   history={history}
 *   vbt={vbt}
 * />
 */
export function ExerciseDetailPage({
  exercise,
  meso,
  trend,
  progression,
  history,
  vbt,
  className,
  ...props
}: ExerciseDetailPageProps) {
  const [tab, setTab] = useState<ExerciseDetailTab>('progress')
  const [expandedProgressId, setExpandedProgressId] = useState<string | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  const stats = useMemo(() => deriveExerciseStats(history), [history])
  const vbtSummary = useMemo(() => summarizeVbt(vbt.sets), [vbt.sets])

  const toggle =
    (setId: (updater: (current: string | null) => string | null) => void) => (id: string) =>
      setId((current) => (current === id ? null : id))

  return (
    <View
      className={className}
      style={{ width: 390, backgroundColor: PAGE_BG }}
      accessibilityRole={'main' as ViewProps['accessibilityRole']}
      aria-label={exercise.name}
      testID="exercise-detail-page"
      {...props}
    >
      <View style={{ padding: 16, gap: 14 }} testID="exercise-detail-page-content">
        <View
          className="flex-row items-start justify-between"
          style={{ gap: 8 }}
          testID="exercise-detail-page-header"
        >
          <View style={{ flexShrink: 1 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 20,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: '700',
                color: TEXT_PRIMARY,
              }}
              testID="exercise-detail-page-title"
            >
              {exercise.name}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                color: TEXT_SECONDARY,
              }}
              testID="exercise-detail-page-subtitle"
            >
              {exercise.subtitle}
            </Text>
          </View>
          {exercise.currentE1rm != null && (
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 6,
                backgroundColor: 'rgba(255,121,0,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(255,121,0,0.25)',
              }}
              testID="exercise-detail-page-e1rm"
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: TEXT_TERTIARY,
                }}
              >
                e1RM
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: '700',
                  color: BRAND_PRIMARY,
                }}
              >
                {`${exercise.currentE1rm} ${exercise.unit}`}
              </Text>
            </View>
          )}
        </View>

        <TabBar active={tab} onSelect={setTab} />

        {tab === 'progress' && (
          <View style={{ gap: 14 }} testID="exercise-detail-page-panel-progress">
            <MesoStatusCard {...meso} />
            <StatStrip stats={stats} unit={exercise.unit} />
            <SectionCard title="Strength Trend" testID="exercise-detail-page-trend">
              <StrengthTrendChart
                data={trend.data}
                projection={trend.projection}
                mesoBoundaries={trend.mesoBoundaries}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                unit={exercise.unit}
                animateOnMount={false}
              />
            </SectionCard>
            <SectionCard title="Week-by-Week" testID="exercise-detail-page-progression">
              <EntryList
                entries={progression}
                expandedId={expandedProgressId}
                onToggle={toggle(setExpandedProgressId)}
                emptyLabel="No progression logged yet"
                testID="exercise-detail-page-progression-list"
              />
            </SectionCard>
          </View>
        )}

        {tab === 'history' && (
          <View style={{ gap: 14 }} testID="exercise-detail-page-panel-history">
            <SectionCard title="All Sessions" testID="exercise-detail-page-history">
              <EntryList
                entries={history}
                expandedId={expandedHistoryId}
                onToggle={toggle(setExpandedHistoryId)}
                emptyLabel="No sessions logged yet"
                testID="exercise-detail-page-history-list"
              />
            </SectionCard>
          </View>
        )}

        {tab === 'advanced' && (
          <View style={{ gap: 14 }} testID="exercise-detail-page-panel-advanced">
            <SectionCard title="Capacity Band" testID="exercise-detail-page-capacity">
              <CapacityBandChart
                band={vbt.band}
                workouts={vbt.workouts}
                projection={vbt.projection}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
              />
            </SectionCard>
            <VbtSummaryRow summary={vbtSummary} />
            <SectionCard title="Velocity Breakdown" testID="exercise-detail-page-velocity">
              <VbtBreakdown sets={vbt.sets} />
            </SectionCard>
          </View>
        )}
      </View>
    </View>
  )
}

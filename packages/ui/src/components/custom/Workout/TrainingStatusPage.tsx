// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { BodyMap, type BodyMapData } from './BodyMap'
import {
  BodyMapDetailPanel,
  type ContributingExercise,
  type UpcomingExercise,
} from './BodyMapDetailPanel'
import { MesoStatusCard, type MesoStatusCardProps } from './MesoStatusCard'
import {
  MuscleGroup,
  VOLUME_STATUS_LABELS,
  getHeatmapColor,
  type VolumeLandmarks,
  type VolumeStatus,
} from './muscleTaxonomy'

/** Volume statuses in display order for the legend and summary cards. */
const STATUS_ORDER: VolumeStatus[] = ['under', 'maintenance', 'productive', 'over']

/** One muscle's full volume picture — feeds the body maps and the detail panel. */
export interface TrainingStatusMuscle {
  /** Detailed muscle group (drives the SVG heatmap + panel identity). */
  muscleGroup: MuscleGroup
  /** Human-readable name for the legend, summary, and panel title. */
  displayName: string
  /** Which body-map view the muscle belongs to. */
  side: 'front' | 'back'
  /** Heatmap intensity 0-1. */
  intensity: number
  /** Weekly-volume status relative to the landmarks. */
  volumeStatus: VolumeStatus
  /** Weekly effective sets logged. */
  weeklySets: number
  /** Volume landmarks (weekly working sets). */
  landmarks: VolumeLandmarks
  /** Last trained label, e.g. "2 days ago". */
  lastTrained?: string
  /** Weekly volume history for the panel sparkline. */
  weeklyHistory?: number[]
  /** Exercises contributing to this muscle's volume. */
  contributingExercises?: ContributingExercise[]
  /** Upcoming exercises targeting this muscle. */
  upcomingExercises?: UpcomingExercise[]
}

/** Derived, page-level roll-up of the tracked muscles. */
export interface TrainingStatusSummary {
  /** Total weekly effective sets across all tracked muscles. */
  totalWeeklySets: number
  /** Number of muscles being tracked. */
  trackedMuscles: number
  /** Count of muscles per volume status. */
  statusCounts: Record<VolumeStatus, number>
}

export interface TrainingStatusPageProps extends ViewProps {
  /** Page heading. */
  title?: string
  /** Mesocycle context banner shown at the top. */
  meso: MesoStatusCardProps
  /** Muscles tracked this week. */
  muscles: TrainingStatusMuscle[]
  className?: string
}

/** Roll up per-muscle rows into the page summary (pure, testable). */
export function deriveTrainingSummary(muscles: TrainingStatusMuscle[]): TrainingStatusSummary {
  const statusCounts: Record<VolumeStatus, number> = {
    under: 0,
    maintenance: 0,
    productive: 0,
    over: 0,
  }
  let totalWeeklySets = 0
  for (const muscle of muscles) {
    totalWeeklySets += muscle.weeklySets
    statusCounts[muscle.volumeStatus] += 1
  }
  return { totalWeeklySets, trackedMuscles: muscles.length, statusCounts }
}

/** Project the muscle rows for one side into `BodyMap` heatmap data. */
export function toBodyMapData(
  muscles: TrainingStatusMuscle[],
  side: 'front' | 'back'
): BodyMapData[] {
  return muscles
    .filter((muscle) => muscle.side === side)
    .map(({ muscleGroup, intensity, volumeStatus, weeklySets }) => ({
      muscleGroup,
      intensity,
      volumeStatus,
      weeklySets,
    }))
}

const SUMMARY_CARDS: Array<{
  key: keyof TrainingStatusSummary['statusCounts'] | 'total'
  label: string
}> = [
  { key: 'total', label: 'Weekly Sets' },
  { key: 'productive', label: 'Productive' },
  { key: 'under', label: 'Under' },
  { key: 'over', label: 'Over' },
]

function SummaryCards({ summary }: { summary: TrainingStatusSummary }) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }} testID="training-status-page-summary">
      {SUMMARY_CARDS.map(({ key, label }) => {
        const value = key === 'total' ? summary.totalWeeklySets : summary.statusCounts[key]
        return (
          <View
            key={key}
            className="bg-surface-elevated border-hairline"
            style={{
              flexGrow: 1,
              flexBasis: '46%',
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
            }}
            testID={`training-status-page-summary-${key}`}
          >
            <Text
              className="text-text-primary"
              style={{
                fontSize: 22,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: '700',
              }}
            >
              {value}
            </Text>
            <Text
              className="text-text-tertiary"
              style={{
                marginTop: 2,
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
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

function StatusLegend() {
  return (
    <View
      className="flex-row flex-wrap"
      style={{ gap: 10, justifyContent: 'center' }}
      testID="training-status-page-legend"
    >
      {STATUS_ORDER.map((status) => (
        <View
          key={status}
          className="flex-row items-center"
          style={{ gap: 5 }}
          testID={`training-status-page-legend-${status}`}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              backgroundColor: getHeatmapColor(status, 0.6),
            }}
            accessibilityElementsHidden
          />
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'capitalize',
            }}
          >
            {VOLUME_STATUS_LABELS[status]}
          </Text>
        </View>
      ))}
    </View>
  )
}

interface BodyMapColumnProps {
  side: 'front' | 'back'
  muscles: TrainingStatusMuscle[]
  selected: MuscleGroup | null
  onSelect: (muscle: MuscleGroup) => void
}

function BodyMapColumn({ side, muscles, selected, onSelect }: BodyMapColumnProps) {
  const data = useMemo(() => toBodyMapData(muscles, side), [muscles, side])
  return (
    <View style={{ flexGrow: 1, flexBasis: '46%' }} testID={`training-status-page-bodymap-${side}`}>
      <BodyMap
        data={data}
        view={side}
        onMusclePress={onSelect}
        highlightedMuscle={selected}
        mode="detailed"
      />
    </View>
  )
}

/**
 * TrainingStatusPage — a body-map training dashboard that composes the
 * mesocycle context banner (`MesoStatusCard`), side-by-side front/back
 * `BodyMap`s with a shared heatmap legend, per-status summary cards, and a
 * tap-to-detail `BodyMapDetailPanel`. Tapping any muscle (SVG or legend chip)
 * opens the slide-up panel for that group; the summary is derived from the
 * supplied muscle rows.
 *
 * @example
 * <TrainingStatusPage meso={meso} muscles={muscles} />
 */
export function TrainingStatusPage({
  title = 'Training Status',
  meso,
  muscles,
  className,
  ...props
}: TrainingStatusPageProps) {
  const [selected, setSelected] = useState<MuscleGroup | null>(null)
  const summary = useMemo(() => deriveTrainingSummary(muscles), [muscles])
  const active = selected != null ? (muscles.find((m) => m.muscleGroup === selected) ?? null) : null

  return (
    <View
      className={['bg-background-base', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: 390 }}
      accessibilityRole={'main' as ViewProps['accessibilityRole']}
      aria-label={title}
      testID="training-status-page"
      {...props}
    >
      <View style={{ padding: 16, gap: 16 }} testID="training-status-page-content">
        <Text
          accessibilityRole="header"
          className="text-text-primary"
          style={{
            fontSize: 20,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
          }}
          testID="training-status-page-title"
        >
          {title}
        </Text>

        <MesoStatusCard {...meso} />

        <SummaryCards summary={summary} />

        <View
          className="bg-surface-elevated border-hairline"
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            gap: 12,
          }}
          testID="training-status-page-bodymaps"
        >
          <View className="flex-row" style={{ gap: 8 }}>
            <BodyMapColumn
              side="front"
              muscles={muscles}
              selected={selected}
              onSelect={setSelected}
            />
            <BodyMapColumn
              side="back"
              muscles={muscles}
              selected={selected}
              onSelect={setSelected}
            />
          </View>
          <StatusLegend />
        </View>
      </View>

      {active != null && (
        <BodyMapDetailPanel
          muscleGroup={active.muscleGroup}
          displayName={active.displayName}
          weeklySets={active.weeklySets}
          landmarks={active.landmarks}
          volumeStatus={active.volumeStatus}
          lastTrained={active.lastTrained}
          weeklyHistory={active.weeklyHistory}
          contributingExercises={active.contributingExercises}
          upcomingExercises={active.upcomingExercises}
          isOpen
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  )
}

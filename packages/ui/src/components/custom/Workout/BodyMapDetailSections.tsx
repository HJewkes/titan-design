// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type TextStyle } from 'react-native'
import { DataRow } from '../../ui/data-row'
import { PrBadge } from './PrBadge'
import { StrengthTrendChart } from './StrengthTrendChart'
import { roundWeight } from '../../../utils/workout-format'
import {
  AGREEMENT_LABELS,
  bandLabel,
  prRows,
  slopeLabel,
  strengthRowTitle,
  type MusclePlanExerciseRow,
  type MusclePlanSection,
  type MuscleStrengthSection,
  type StrengthExerciseRow,
} from './muscleReadModels'

/** testID prefix, shared with the panel that hosts these sections. */
const ID = 'body-map-detail-panel'

/** The mini trend chart: wide enough for the 26px y-axis gutter, short enough to be a row. */
const MINI_CHART_WIDTH = 150
const MINI_CHART_HEIGHT = 60

/** Section caption: the 10px uppercase label the sheet titles every block with. */
const CAPTION: TextStyle = { fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: '600' }
const ROW_NAME: TextStyle = { fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: '600' }
const ROW_DETAIL: TextStyle = { fontSize: 12, fontFamily: 'Inter, sans-serif' }

/** A row's two-column header line: flex lives in the style object, spacing in classes. */
const SPLIT_ROW = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const

function Caption({ children, testID }: { children: string; testID?: string }) {
  return (
    <Text className="mb-stack-md text-text-tertiary" style={CAPTION} testID={testID}>
      {children}
    </Text>
  )
}

/** One (exercise, side) strength row: e1RM headline, mini trend, band and slope. */
function StrengthRow({ row, index }: { row: StrengthExerciseRow; index: number }) {
  const id = `${ID}-strength-${index}`
  const history = row.history ?? []
  const e1rm = row.bestE1rm === null ? '—' : `${roundWeight(row.bestE1rm.value)} lb`
  return (
    <View
      className="mb-stack-sm gap-stack-sm px-inset-md py-2 bg-surface-raised border-hairline"
      style={{ borderRadius: 8, borderWidth: 1 }}
      testID={id}
    >
      <View className="gap-inline-md" style={SPLIT_ROW}>
        <Text
          className="text-text-primary"
          style={{ ...ROW_NAME, flexShrink: 1 }}
          testID={`${id}-name`}
        >
          {strengthRowTitle(row)}
        </Text>
        <Text className="text-text-primary" style={ROW_DETAIL} testID={`${id}-e1rm`}>
          {e1rm}
        </Text>
      </View>
      {history.length > 0 && (
        <StrengthTrendChart
          data={history}
          width={MINI_CHART_WIDTH}
          height={MINI_CHART_HEIGHT}
          unit="lbs"
          animateOnMount={false}
          testID={`${id}-chart`}
        />
      )}
      <View className="gap-inline-md" style={SPLIT_ROW}>
        <Text
          className="text-text-tertiary"
          style={{ ...ROW_DETAIL, flexShrink: 1 }}
          testID={`${id}-band`}
        >
          {bandLabel(row.bestE1rm)}
        </Text>
        <Text className="text-text-secondary" style={ROW_DETAIL} testID={`${id}-slope`}>
          {slopeLabel(row)}
        </Text>
      </View>
    </View>
  )
}

/**
 * Per-exercise strength rows for one muscle (B3). `agreement` is the concordance
 * of signs between separate exercises, never a magnitude verdict, so it is
 * captioned rather than rendered as a value.
 */
export function StrengthSection({ section }: { section: MuscleStrengthSection }) {
  if (section.exercises.length === 0) return null
  return (
    <View className="mt-stack-lg" testID={`${ID}-strength`}>
      <Caption>{'STRENGTH'}</Caption>
      {section.exercises.map((row, index) => (
        <StrengthRow key={`${row.exerciseId}-${row.side ?? 'none'}`} row={row} index={index} />
      ))}
      <Text className="text-text-tertiary" style={ROW_DETAIL} testID={`${ID}-strength-agreement`}>
        {section.earlyPhase
          ? `${AGREEMENT_LABELS[section.agreement]} · early training phase`
          : AGREEMENT_LABELS[section.agreement]}
      </Text>
    </View>
  )
}

/** One PR: the shared badge, the exercise it was set on, and what it beat. */
function PrRow({ row, index }: { row: StrengthExerciseRow; index: number }) {
  const id = `${ID}-pr-${index}`
  const best = row.bestE1rm === null ? '—' : `${roundWeight(row.bestE1rm.value)} lb`
  const prior = row.priorBest === null ? 'no prior best' : `prev ${roundWeight(row.priorBest)} lb`
  return (
    <View className="mb-stack-sm gap-inline-md" style={SPLIT_ROW} testID={id}>
      <View className="gap-inline-md" style={{ ...SPLIT_ROW, flexShrink: 1 }}>
        <PrBadge type="e1rm" animate={false} testID={`${id}-badge`} />
        <Text
          className="text-text-primary"
          style={{ ...ROW_NAME, flexShrink: 1 }}
          testID={`${id}-name`}
        >
          {strengthRowTitle(row)}
        </Text>
      </View>
      <Text className="text-text-secondary" style={ROW_DETAIL} testID={`${id}-detail`}>
        {`${best} · ${prior}`}
      </Text>
    </View>
  )
}

/**
 * The PR rows of a strength section: every row the read model flagged `isPR`.
 * An e1RM PR inside the estimate's own error band is still a PR to
 * `evaluateE1RMPr`, which is why each strength row carries its band above.
 */
export function PrSection({ section }: { section: MuscleStrengthSection }) {
  const rows = prRows(section.exercises)
  if (rows.length === 0) return null
  return (
    <View className="mt-stack-lg" testID={`${ID}-prs`}>
      <Caption>{'PERSONAL RECORDS'}</Caption>
      {rows.map((row, index) => (
        <PrRow key={`${row.exerciseId}-${row.side ?? 'none'}`} row={row} index={index} />
      ))}
    </View>
  )
}

function PlanRows({ rows, kind }: { rows: MusclePlanExerciseRow[]; kind: 'done' | 'upcoming' }) {
  if (rows.length === 0) return null
  return (
    <View className="mt-stack-md" testID={`${ID}-plan-${kind}`}>
      <Caption testID={`${ID}-plan-${kind}-caption`}>
        {kind === 'done' ? 'DONE' : 'UPCOMING'}
      </Caption>
      {rows.map((row, index) => (
        <DataRow
          key={`${row.exerciseId}-${row.workoutName}`}
          label={row.exerciseName}
          value={`${row.sets} sets · ${row.workoutName}`}
          labelClassName={kind === 'done' ? undefined : 'text-text-primary'}
          testID={`${ID}-plan-${kind}-${index}`}
        />
      ))}
    </View>
  )
}

/**
 * This week's plan for one muscle (B4): the planned-vs-done set count, then the
 * planned exercises split by whether their workout has been trained yet.
 */
export function PlanSection({ section }: { section: MusclePlanSection }) {
  return (
    <View className="mt-stack-lg" testID={`${ID}-plan`}>
      <Caption>{'THIS WEEK'}</Caption>
      <DataRow
        label="Sets"
        value={`${section.doneSetsThisWeek} / ${section.plannedSetsThisWeek}`}
        testID={`${ID}-plan-counts`}
      />
      <PlanRows rows={section.exercises.filter((row) => row.done)} kind="done" />
      <PlanRows rows={section.exercises.filter((row) => !row.done)} kind="upcoming" />
    </View>
  )
}

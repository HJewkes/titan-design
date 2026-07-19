// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import { RestTimer, ExerciseCard, Metric, MetricGroup, type SetRowProps } from '../../components'
import { type DashboardModel, meanVelocity, verdictFromLoss } from './fixtures'
import { paperSheet, insetWell } from './surfaces'

/** Project the fixture's completed + current sets onto the recap card's set rows. */
function deriveRecapSets(model: DashboardModel): SetRowProps[] {
  const { session, live } = model
  const done: SetRowProps[] = session.completedSets.map((set, i) => ({
    state: 'done',
    setNumber: i + 1,
    unit: session.unit,
    reps: set.repCount,
    weight: set.weightLbs,
    rpe: 8 + i * 0.5,
    velocities: set.reps,
  }))
  const current: SetRowProps = {
    state: 'done',
    setNumber: session.completedSets.length + 1,
    unit: session.unit,
    reps: live.repVelocities.length,
    weight: session.weightLbs,
    rpe: 9,
    velocities: live.repVelocities,
  }
  return [...done, current]
}

/**
 * Lab specimen — the REST stage of the North Star wall dashboard.
 *
 * A rest read-out: the countdown, a recap of the set just finished, the set's verdict
 * metrics, and a preview of what's next. NOT a published component — lab-scoped only.
 */
export function RestView({ model }: { model: DashboardModel }) {
  const { live, session } = model
  const verdict = verdictFromLoss(live.velocityLossPct)
  const meanCon = meanVelocity(live.repVelocities)
  const peakCon = Math.max(...live.repVelocities)

  return (
    <View className="flex-row" style={{ flex: 1, padding: 20, gap: 20 }}>
      {/* left: the countdown + the just-completed exercise recap. */}
      <View style={{ flex: 2, gap: 20 }}>
        {/* Rest countdown — ring variant (across-the-room wall treatment). */}
        <RestTimer
          variant="ring"
          size={220}
          totalSeconds={120}
          elapsedMs={47_000}
          visible
          nextSetInfo={`Next · ${session.exerciseName} · set ${session.completedSets.length + 2} of ${session.plannedSets}`}
          onSkip={() => {}}
          onAddTime={() => {}}
        />

        <View style={{ gap: 8 }}>
          <Text
            className="text-text-tertiary"
            style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1 }}
          >
            SET JUST COMPLETED
          </Text>
          {/* Hero recap on a matte PAPER sheet, canted a hair so it reads as a laid sheet
              (paper tone == ExerciseCard's own raised plane → one continuous surface). */}
          <View
            style={{
              ...paperSheet(),
              borderRadius: 14,
              padding: 6,
              transform: [{ rotate: '-0.4deg' }],
            }}
          >
            <ExerciseCard
              name={session.exerciseName}
              expanded
              summary={{
                sets: session.plannedSets,
                reps: 8,
                weight: session.weightLbs,
                unit: session.unit,
              }}
              tempo={session.tempo}
              indicator="velocity-loss"
              sets={deriveRecapSets(model)}
            />
          </View>
        </View>
      </View>

      {/* right: the set verdict + the next-set preview (mock). */}
      <View style={{ flex: 1, gap: 24 }}>
        <View style={{ gap: 6 }}>
          <Text
            className="text-text-tertiary"
            style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1 }}
          >
            SET VERDICT
          </Text>
          {/* The read-once summary sits in a single recessed INSET well — the metrics
              read as pressed into the frame, one grouped panel rather than 8 loose cards. */}
          <View style={{ ...insetWell(), borderRadius: 12, padding: 12, gap: 10 }}>
            <MetricGroup>
              <Metric size="md" value={meanCon.toFixed(2)} unit="m/s" label="Mean con" />
              <Metric size="md" value={peakCon.toFixed(2)} unit="m/s" label="Peak con" />
            </MetricGroup>
            <MetricGroup>
              <Metric size="md" value={`${live.velocityLossPct}%`} label="Vel loss" trend="down" />
              <Metric size="md" value={String(live.repVelocities.length)} label="Reps" />
            </MetricGroup>
            <MetricGroup>
              <Metric size="md" value={String(session.weightLbs)} unit="lbs" label="Load" />
              <Metric size="md" value={String(live.peakForce)} unit="lbs" label="Peak force" />
            </MetricGroup>
            <MetricGroup>
              <Metric
                size="md"
                value={verdict === 'threshold' ? 'MOD' : verdict === 'stop' ? 'HIGH' : 'LOW'}
                label="Fatigue"
                trend={verdict === 'productive' ? 'up' : 'neutral'}
              />
              <Metric
                size="md"
                value={String(live.lastRep.rom.toFixed(2))}
                unit="m"
                label="Avg ROM"
              />
            </MetricGroup>
          </View>
        </View>

        {/* mock "next set" block — a recessed INSET well reads as an empty slot AWAITING
            data, which is exactly its NO-DATA/mock status (was a dashed outline). */}
        <View style={{ ...insetWell(), borderRadius: 10, padding: 16, gap: 4 }}>
          <Text
            className="text-text-tertiary"
            style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1 }}
          >
            NEXT SET · MOCK (NO DATA)
          </Text>
          <Text className="text-text-primary" style={{ fontSize: 18, fontWeight: '700' }}>
            {session.exerciseName}
          </Text>
          <Text className="text-text-secondary" style={{ fontSize: 13 }}>
            {`Set ${session.completedSets.length + 2} · target 8 × ${session.weightLbs} ${session.unit}`}
          </Text>
        </View>
      </View>
    </View>
  )
}

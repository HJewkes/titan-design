/**
 * Row Inventory — a READ-ONLY survey of every existing way the Workout library renders
 * "an exercise / set / workout / week / mesocycle" as a row / list-entry / card.
 *
 * Built from the 2026-07-08 duplication audit (S3 SessionRail reuse question). This pane only
 * NAMES and DISPLAYS what exists — no extraction, no changes to the components. It's here so we
 * can eyeball the overlapping row representations together before deciding a reuse strategy.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Component, type ReactNode } from 'react'
import { View, Text } from 'react-native'
import { ExerciseCard } from './ExerciseCard'
import { SetRow } from './SetRow'
import { WorkoutCard } from './WorkoutCard'
import { WorkoutPill } from './WorkoutPill'
import { WeekRow } from './WeekRow'
import { MesoCard } from './MesoCard'
import { MesoProgressBar } from './MesoProgressBar'
import { MuscleGroupChip } from './MuscleGroupChip'
import { StatusDot } from './StatusDot'
import { WeightBadge } from './WeightBadge'
import { PrBadge } from './PrBadge'
import { PlaceholderStrip } from './PlaceholderStrip'
import { SupersetWrapper } from './SupersetWrapper'

// ----------------------------------------------------------------------------- gallery scaffold
class Boundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null }
  static getDerivedStateFromError(e: Error) {
    return { err: e.message }
  }
  render() {
    if (this.state.err)
      return (
        <div style={{ color: '#ff6b6b', fontFamily: 'monospace', fontSize: 11, padding: 8 }}>
          render error: {this.state.err}
        </div>
      )
    return this.props.children
  }
}

function Cell({
  name,
  entity,
  expand,
  width = 340,
  children,
}: {
  name: string
  entity: string
  expand: string
  width?: number
  children: ReactNode
}) {
  return (
    <div
      style={{
        width,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        border: '1px solid #24262d',
        background: '#131418',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#E8EAED' }}>{name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#5b616d', letterSpacing: 0.3 }}>
          {entity} · {expand}
        </span>
      </div>
      <div style={{ marginTop: 2 }}>
        <Boundary>{children}</Boundary>
      </div>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#FF7900',
          }}
        >
          {title}
        </span>
        {note && <span style={{ fontSize: 11, color: '#8D95A3' }}>{note}</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- sample data
const setVel = [
  [0.6, 0.58, 0.55, 0.52],
  [0.58, 0.55, 0.53, 0.5],
  [0.55, 0.52, 0.5, 0.47],
]
const exSets = [1, 2, 3, 4].map((n) => ({
  mode: 'completed' as const,
  setNumber: n,
  previous: { reps: 8, weight: 145 },
  reps: 8,
  weight: 145,
  rpe: 6.5 + n * 0.5,
  unit: 'lbs' as const,
  velocities: setVel[(n - 1) % 3],
}))
const weeks = [
  { weekNumber: 1, workouts: [{ name: 'Upper', status: 'completed' as const }, { name: 'Lower', status: 'completed' as const }] },
  { weekNumber: 2, workouts: [{ name: 'Upper', status: 'current' as const }, { name: 'Lower', status: 'upcoming' as const }] },
  { weekNumber: 3, workouts: [{ name: 'Upper', status: 'upcoming' as const }, { name: 'Lower', status: 'upcoming' as const }] },
]
const mesos = [
  { id: 'm1', name: 'Accumulation', weekCount: 4, status: 'completed' as const },
  { id: 'm2', name: 'Intensification', weekCount: 3, status: 'current' as const, currentWeek: 2 },
  { id: 'm3', name: 'Peak', weekCount: 2, status: 'upcoming' as const },
]

// ----------------------------------------------------------------------------- the pane
const meta: Meta = {
  title: 'Custom/Workout/Row Inventory',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const AllRows: Story = {
  name: 'All row representations',
  render: () => (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c0d0f',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 34,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#E8EAED' }}>
          Workout library · row representations
        </span>
        <span style={{ fontSize: 12, color: '#8D95A3', maxWidth: 720 }}>
          Every existing component that draws an exercise / set / workout / week / meso as a list entry.
          Read-only survey for the S3 reuse decision — names + entity + expand behavior, no code changes.
        </span>
      </div>

      <Section title="Exercise" note="3 overlapping representations (ExerciseCard is the library primitive; the rail specimen adds a 4th fork)">
        <Cell name="ExerciseCard" entity="exercise" expand="expandable · state enum">
          <ExerciseCard
            name="Seated Cable Row"
            state="collapsed"
            onToggle={() => {}}
            summary={{ sets: 4, reps: 8, weight: 145, unit: 'lbs' }}
            e1rm={{ value: 205, unit: 'lbs' }}
            isPR
            totalPlannedSets={5}
            setVelocities={setVel}
          />
        </Cell>
        <Cell name="ExerciseCard" entity="exercise" expand="state='expanded' → reveals SetRows">
          <ExerciseCard
            name="Seated Cable Row"
            state="expanded"
            onToggle={() => {}}
            summary={{ sets: 4, reps: 8, weight: 145, unit: 'lbs' }}
            e1rm={{ value: 205, unit: 'lbs' }}
            tempo={[3, 1, 2, 0]}
            sets={exSets}
          />
        </Cell>
        <Cell name="ExerciseCard" entity="exercise" expand="state='upcoming' (static)">
          <ExerciseCard
            name="Face Pull"
            state="upcoming"
            onToggle={() => {}}
            prescription="3 × 12-15 @ RPE 7"
            previousBest="15 × 35 lb"
          />
        </Cell>
      </Section>

      <Section title="Set" note="SetRow is the primitive; the rail specimen adds a denser fork (adds velocity-loss %)">
        <Cell name="SetRow" entity="set · completed" expand="no (velocity strip toggles)" width={360}>
          <SetRow
            mode="completed"
            setNumber={1}
            previous={{ reps: 8, weight: 145 }}
            reps={8}
            weight={145}
            rpe={8}
            unit="lbs"
            velocities={[0.6, 0.58, 0.55, 0.52]}
          />
        </Cell>
        <Cell name="SetRow" entity="set · active" expand="no" width={360}>
          <SetRow
            mode="active"
            setNumber={4}
            reps={null}
            weight={null}
            unit="lbs"
            isNextSet
            targets={{ reps: 8, weight: 145 }}
          />
        </Cell>
      </Section>

      <Section title="Workout" note="WorkoutCard (full) and WorkoutPill (chip) = two legit densities; ExerciseDetailPage overloads ExerciseCard as a 3rd">
        <Cell name="WorkoutCard" entity="workout" expand="expandable · expanded+onToggle → ExerciseCards" width={380}>
          <WorkoutCard
            name="Push Day A"
            date="Mon · Jul 6"
            duration="52 min"
            status="today"
            muscleGroups={[
              { group: 'chest', label: 'Chest', volumeStatus: 'productive' },
              { group: 'delts', label: 'Delts', volumeStatus: 'maintenance' },
              { group: 'triceps', label: 'Triceps', volumeStatus: 'under' },
            ]}
            totalSets={18}
            totalVolume={7340}
            unit="lbs"
            onToggle={() => {}}
          />
        </Cell>
        <Cell name="WorkoutPill" entity="workout · chip" expand="no">
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <WorkoutPill name="Push" status="completed" />
            <WorkoutPill name="Pull" status="current" />
            <WorkoutPill name="Legs" status="upcoming" />
            <WorkoutPill name="Deload" status="deload" />
          </View>
        </Cell>
      </Section>

      <Section title="Week" note="WeekRow is the primitive; ExerciseDetailPage overloads ExerciseCard as a competing week row">
        <Cell name="WeekRow" entity="week" expand="no · row of WorkoutPills + intensity bar" width={380}>
          <WeekRow
            weekNumber={3}
            totalWeeks={4}
            isCurrent
            intensityLevel={0.55}
            intensityThreshold={0.8}
            workouts={weeks[1].workouts}
          />
        </Cell>
      </Section>

      <Section title="Mesocycle" note="3 views for different jobs (list card / timeline / detail) — each with its own status enum">
        <Cell name="MesoCard" entity="meso" expand="expandable · expanded+onToggle → WeekRows" width={380}>
          <MesoCard
            name="Accumulation"
            goal="Hypertrophy"
            split="Upper/Lower"
            weekRange="Weeks 1-4"
            currentWeek={2}
            totalWeeks={4}
            weeks={weeks}
            volumeHeatmap={[
              { group: 'chest', percentage: 80 },
              { group: 'back', percentage: 70 },
              { group: 'legs', percentage: 90 },
            ]}
          />
        </Cell>
        <Cell name="MesoProgressBar" entity="meso · timeline" expand="no · segments" width={380}>
          <MesoProgressBar mesos={mesos} />
        </Cell>
      </Section>

      <Section title="Shared sub-parts" note="appear inside the rows above — not entity rows themselves">
        <Cell name="MuscleGroupChip" entity="muscle-group" expand="no">
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <MuscleGroupChip name="Chest" volumeStatus="ontrack" />
            <MuscleGroupChip name="Quads" volumeStatus="behind" />
            <MuscleGroupChip name="Lats" volumeStatus="over" />
          </View>
        </Cell>
        <Cell name="StatusDot" entity="status glyph" expand="no">
          <StatusDot variant="success" label="On track" />
        </Cell>
        <Cell name="WeightBadge" entity="badge" expand="no">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <WeightBadge value={205} unit="lbs" />
            <WeightBadge value={217} unit="lbs" isPr />
          </View>
        </Cell>
        <Cell name="PrBadge" entity="badge" expand="no">
          <PrBadge type="e1rm" animate={false} />
        </Cell>
        <Cell name="PlaceholderStrip" entity="pending-set strip" expand="no">
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PlaceholderStrip />
            <PlaceholderStrip />
            <PlaceholderStrip />
          </View>
        </Cell>
        <Cell name="SupersetWrapper" entity="grouping bracket" expand="no">
          <SupersetWrapper label="SS1" color="#FF7900">
            <View style={{ padding: 10, backgroundColor: '#1C1C1C', borderRadius: 8 }}>
              <Text style={{ color: '#F3F4F6' }}>Exercise A</Text>
            </View>
            <View style={{ padding: 10, backgroundColor: '#1C1C1C', borderRadius: 8 }}>
              <Text style={{ color: '#F3F4F6' }}>Exercise B</Text>
            </View>
          </SupersetWrapper>
        </Cell>
      </Section>

      <Section
        title="Page-level organisms"
        note="composition roots (390px+), not rows — listed for reference, see their own stories"
      >
        {[
          ['ActiveWorkoutPage', 'renders ExerciseCards + SupersetWrapper + InputBar/RestTimer'],
          ['ProgramPlanningPage', 'MesoProgressBar + MesoCard → WeekRow → WorkoutCard drill-down'],
          ['ExerciseDetailPage', 'EntryList overloads ExerciseCard as week AND session rows'],
          ['MesoStatusCard', 'per-exercise meso detail card (StatusDot + metric grid + gauges)'],
          ['ReadinessCheck', 'pre-workout factor rows + score gauge'],
        ].map(([n, d]) => (
          <div
            key={n}
            style={{
              width: 340,
              padding: 14,
              borderRadius: 12,
              border: '1px dashed #31343d',
              background: '#0f1012',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#E8EAED' }}>{n}</div>
            <div style={{ fontSize: 11, color: '#8D95A3', marginTop: 4 }}>{d}</div>
          </div>
        ))}
      </Section>
    </div>
  ),
}

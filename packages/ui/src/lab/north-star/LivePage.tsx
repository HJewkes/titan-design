// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { ScrollView, View } from 'react-native'
import { SessionRail } from '../../components'
import { ExerciseHeader, LiveView } from './LiveView'
import { RestView } from './RestView'
import { EmptyLiveView, type EmptyKind } from './EmptyLiveView'
import {
  dashboardFixture,
  deriveDualModel,
  deriveRailExercises,
  type DashboardModel,
} from './fixtures'

export type LivePageVariant =
  | 'live'
  | 'live-dual'
  | 'rest'
  | 'idle'
  | 'ready'
  | 'ready-unnamed'
  | 'no-device'

/** The idle-stage variants (VW-68) → the {@link EmptyLiveView} kind they render, or null. */
function emptyKindFor(variant: LivePageVariant): EmptyKind | null {
  if (variant === 'idle') return 'no-session'
  if (variant === 'ready' || variant === 'ready-unnamed') return 'ready'
  if (variant === 'no-device') return 'no-device'
  return null
}

/** Floor the live panel around phone width so it stops collapsing on a narrow window. */
const PANEL_MIN_WIDTH = 390

export interface LivePageProps {
  /** Which stage to show in the main region. */
  variant?: LivePageVariant
  /** The dashboard store snapshot. Defaults to the built-in fixture. */
  model?: DashboardModel
}

/**
 * Lab specimen — the North Star wall-dashboard CONTENT (mounts inside `DashboardShell`'s
 * children slot): the persistent {@link SessionRail} context beside a swappable stage
 * ({@link LiveView} mid-set / {@link RestView} between sets).
 *
 * `live-dual` renders a dual-mode (bilateral) exercise as TWO stacked {@link LiveView}
 * layers — one per voltra (left/right) — the v1 treatment for two-device sets. A
 * unified split-bar view is a later exploration.
 *
 * NOT a published component — lab-scoped composition of production primitives only.
 * The rail footer pace read-out is intentionally OMITTED (NO-DATA — no store field yet).
 */
export function LivePage({ variant = 'live', model = dashboardFixture }: LivePageProps) {
  const emptyKind = emptyKindFor(variant)
  // Idle stages (VW-68): the stage would otherwise be a blank RestView. Render the designed
  // EmptyLiveView beside an EMPTY rail (no stub row for a session that does not exist). The
  // `ready` case keeps the header + rollup context because a session IS open (first set not
  // begun); `idle`/`no-device` drop the header — there is no exercise to name.
  if (emptyKind) {
    const sessionOpen = emptyKind === 'ready'
    // `ready-unnamed` models an open session whose exercise has not resolved a name — the
    // EmptyLiveView then shows the neutral `Exercise 1` ordinal (VW-68), and the header hides
    // (no name to title yet).
    const named = variant !== 'ready-unnamed'
    return (
      <View className="flex-1 flex-row bg-surface-base">
        <SessionRail
          title={sessionOpen ? model.session.title : 'Session'}
          exercises={[]}
          setsDone={0}
          running={false}
          width={272}
        />
        <View className="flex-1" style={{ minWidth: PANEL_MIN_WIDTH }}>
          {sessionOpen && named && <ExerciseHeader session={model.session} />}
          <View className="flex-1">
            <EmptyLiveView
              kind={emptyKind}
              exerciseName={named ? model.session.exerciseName : undefined}
              weightLbs={sessionOpen ? model.session.weightLbs : undefined}
              unit={model.session.unit}
            />
          </View>
        </View>
      </View>
    )
  }

  const exercises = deriveRailExercises(model)
  const completedSets = model.session.completedSets.length
  const isLive = variant === 'live' || variant === 'live-dual'

  return (
    <View className="flex-1 flex-row bg-surface-base">
      <SessionRail
        title={model.session.title}
        exercises={exercises}
        setsDone={isLive ? completedSets + 0.75 : completedSets}
        elapsedMs={18 * 60_000}
        budgetMs={45 * 60_000}
        running={isLive}
        width={272}
        metrics={[
          { label: 'Volume', value: '76%' },
          { label: 'Load', value: '7.3k' },
          { label: 'Fatigue', value: 'MOD' },
        ]}
      />
      {/* footer pace strip — STUB / NO-DATA: intentionally omitted (no store field yet). */}

      {/* Panel floors at ~phone width so the live view stops collapsing; rail-aware
          breakpoints below this are a later pass. */}
      <View className="flex-1" style={{ minWidth: PANEL_MIN_WIDTH }}>
        {/* workout title + targets — page-level, always visible, independent of single/dual. */}
        <ExerciseHeader session={model.session} />
        <View className="flex-1">
          {variant === 'live-dual' ? (
            <DualLiveStage model={model} />
          ) : variant === 'live' ? (
            // `slot` names the active voltra — the shell has two connected, so the live view
            // flags which one it is reading from (the multi-device single-view case).
            <LiveView model={model} slot="L" />
          ) : (
            <RestView model={model} />
          )}
        </View>
      </View>
    </View>
  )
}

/**
 * Dual-mode stage: two stacked live layers, one per voltra (left dominant, right lags).
 *
 * The stage SCROLLS so two full live read-outs never clip on a height-restricted wall.
 * Each layer also compresses its height-drivers (shorter hero, tighter gaps — see
 * {@link LiveView}'s `side`/`dual` handling) so a tall wall fits both with little or no
 * scroll; a trimmed-per-layer treatment is a later option if scrolling proves awkward.
 */
function DualLiveStage({ model }: { model: DashboardModel }) {
  const { left, right } = deriveDualModel(model)
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, minHeight: 340 }}>
        <LiveView model={left} side="left" />
      </View>
      <View style={{ flex: 1, minHeight: 340 }}>
        <LiveView model={right} side="right" />
      </View>
    </ScrollView>
  )
}

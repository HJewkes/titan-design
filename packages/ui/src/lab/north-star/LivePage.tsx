// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { SessionRail } from '../../components'
import { ExerciseHeader, LiveView, DualLiveView } from './LiveView'
import { RestView } from './RestView'
import {
  dashboardFixture,
  deriveDualModel,
  deriveRailExercises,
  type DashboardModel,
} from './fixtures'

export type LivePageVariant = 'live' | 'live-dual' | 'rest'

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
 * `live-dual` renders a dual-mode (bilateral) exercise as ONE {@link DualLiveView} — a
 * diverging velocity chart with a shared centre axis (LEFT grows up, RIGHT grows down),
 * so the left/right asymmetry reads as a single silhouette instead of two stacked heroes.
 *
 * NOT a published component — lab-scoped composition of production primitives only.
 * The rail footer pace read-out is intentionally OMITTED (NO-DATA — no store field yet).
 */
export function LivePage({ variant = 'live', model = dashboardFixture }: LivePageProps) {
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
 * Dual-mode stage: ONE diverging live layer for both voltras (left dominant, right lags).
 * The two per-voltra streams share a centre axis — LEFT reps grow up, RIGHT grow down — so
 * the whole bilateral set reads in one hero's vertical space instead of two stacked heroes.
 */
function DualLiveStage({ model }: { model: DashboardModel }) {
  const { left, right } = deriveDualModel(model)
  return <DualLiveView left={left} right={right} />
}

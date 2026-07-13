// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { SessionRail } from '../../components'
import { LiveView } from './LiveView'
import { RestView } from './RestView'
import { dashboardFixture, deriveRailExercises, type DashboardModel } from './fixtures'

export type LivePageVariant = 'live' | 'rest'

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
 * NOT a published component — lab-scoped composition of production primitives only.
 * The rail footer pace read-out is intentionally OMITTED (NO-DATA — no store field yet).
 */
export function LivePage({ variant = 'live', model = dashboardFixture }: LivePageProps) {
  const exercises = deriveRailExercises(model)
  const completedSets = model.session.completedSets.length

  return (
    <View className="flex-1 flex-row bg-surface-base">
      <SessionRail
        title={model.session.title}
        exercises={exercises}
        setsDone={variant === 'live' ? completedSets + 0.75 : completedSets}
        elapsedMs={18 * 60_000}
        budgetMs={45 * 60_000}
        running={variant === 'live'}
        width={272}
        metrics={[
          { label: 'Volume', value: '76%' },
          { label: 'Load', value: '7.3k' },
          { label: 'Fatigue', value: 'MOD' },
        ]}
      />
      {/* footer pace strip — STUB / NO-DATA: intentionally omitted (no store field yet). */}

      <View className="flex-1">
        {variant === 'live' ? <LiveView model={model} /> : <RestView model={model} />}
      </View>
    </View>
  )
}

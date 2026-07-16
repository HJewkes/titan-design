// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { EmptyState, Metric, MetricGroup, DumbbellIcon, BluetoothIcon } from '../../components'

/**
 * Lab specimen — the IDLE stage of the North Star wall dashboard (VW-68).
 *
 * The live page's stage is blank whenever no set is streaming, none is logged, and no rest
 * clock is running: a fresh connect with no session, a session whose first set has not begun,
 * or a disconnected device. This is the DESIGNED replacement for that blank box — an honest
 * "waiting" hero built from {@link EmptyState}, shown here as its own story so the empty states
 * are reviewable design artifacts alongside the live/rest stages.
 *
 * READ-ONLY WALL: sets start on the machine / via MCP, never from this mirror, so there is no
 * button — the affordance is an instruction line. Real device facts only (loaded weight when
 * known); never a fabricated number.
 */
export type EmptyKind = 'no-session' | 'ready' | 'no-device'

export interface EmptyLiveViewProps {
  kind: EmptyKind
  /** The active exercise name, shown in the `ready` copy. */
  exerciseName?: string
  /** Loaded plate weight (real device echo), shown when known and connected. */
  weightLbs?: number
  unit?: 'lbs' | 'kg'
}

const COPY: Record<
  EmptyKind,
  { icon: typeof DumbbellIcon; title: (name?: string) => string; description: string }
> = {
  'no-device': {
    icon: BluetoothIcon,
    title: () => 'No Voltra connected',
    description:
      'Connect a Voltra — live velocity, tempo and fatigue appear here once a set begins.',
  },
  ready: {
    icon: DumbbellIcon,
    title: (name) => `Ready · ${name ?? 'Session'}`,
    description: 'Start the first set — live velocity, tempo and fatigue will appear here.',
  },
  'no-session': {
    icon: DumbbellIcon,
    title: () => 'Waiting for a set',
    description: 'Start a set on the machine or from the MCP to see live velocity here.',
  },
}

export function EmptyLiveView({ kind, exerciseName, weightLbs, unit = 'lbs' }: EmptyLiveViewProps) {
  const copy = COPY[kind]
  const showWeight = kind !== 'no-device' && weightLbs != null
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <EmptyState
        icon={copy.icon}
        title={copy.title(exerciseName)}
        description={copy.description}
      />
      {showWeight && (
        <MetricGroup>
          <Metric size="md" value={String(weightLbs)} unit={unit} label="Loaded" />
        </MetricGroup>
      )}
    </View>
  )
}

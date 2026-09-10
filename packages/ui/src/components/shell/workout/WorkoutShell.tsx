import type { ReactNode } from 'react'
import { AppShell } from '../AppShell'
import { type SideNavItem } from '../SideNav'
import { WorkoutTopBar } from './WorkoutTopBar'
import { workoutNavItems } from './workoutNavItems'
import { type Device } from './DeviceRow'
import { type SessionState } from './SessionStatePill'

/**
 * `WorkoutShell` — the workout wall-dashboard chrome. Composes the generic
 * {@link AppShell} and fills its top-bar slot with the workout's own
 * {@link WorkoutTopBar} (session state + device menu) and its nav slot with the
 * four workout categories. The generic shell knows none of this; this component
 * is the whole workout-specific surface. Driven entirely by props.
 */
export interface WorkoutShellProps {
  /** Active nav category key. */
  activeKey?: string
  /** Nav categories, top → bottom. Defaults to the four workout categories. */
  navItems?: SideNavItem[]
  /** A category with off-view live activity → a quiet cue on that item. */
  liveKey?: string | null
  /** Global session state → the TopBar status pill. */
  state?: SessionState
  /** Connected devices → the TopBar connection glyph + dropdown. */
  devices?: Device[]
  /** TopBar brand subtitle. */
  subtitle?: string
  onNavigate?: (key: string) => void
  onSelectDevice?: (device: Device) => void
  /** Main content region. A placeholder renders when omitted. */
  children?: ReactNode
  className?: string
}

const DEMO_DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
]

export function WorkoutShell({
  activeKey = 'live',
  navItems = workoutNavItems,
  liveKey = null,
  state = 'live',
  devices = DEMO_DEVICES,
  subtitle = 'wall dashboard',
  onNavigate,
  onSelectDevice,
  children,
  className,
}: WorkoutShellProps) {
  return (
    <AppShell
      className={className}
      navItems={navItems}
      activeKey={activeKey}
      liveKey={liveKey}
      onNavigate={onNavigate}
      topBar={
        <WorkoutTopBar
          state={state}
          devices={devices}
          subtitle={subtitle}
          onSelectDevice={onSelectDevice}
        />
      }
    >
      {children}
    </AppShell>
  )
}

/** @deprecated Renamed to `WorkoutShell` — same props (AW-132). Removed after consumer migration. */
export const DashboardShell = WorkoutShell
/** @deprecated Renamed to `WorkoutShellProps` (AW-132). */
export type DashboardShellProps = WorkoutShellProps

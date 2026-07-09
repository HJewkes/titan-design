import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { cn } from '../../utils/cn'
import { SideNav, type SideNavItem } from './SideNav'
import { TopBar } from './TopBar'
import { type Device } from './DeviceRow'
import { type SessionState } from './SessionStatePill'

/**
 * `DashboardShell` — the wall-dashboard chrome: a persistent {@link SideNav} rail +
 * {@link TopBar} over a main content region. A thin frame that wires the shell-nav
 * organisms together and exposes a `children` content slot, so the dashboard app
 * mounts one component instead of re-assembling the chrome. Driven entirely by props.
 */
export interface DashboardShellProps {
  /** Active nav category key. */
  activeKey?: string
  /** Nav categories, top → bottom. Defaults to SideNav's four dashboard categories. */
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

function ContentPlaceholder() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-heading text-sm text-text-tertiary">main content region</Text>
    </View>
  )
}

export function DashboardShell({
  activeKey = 'live',
  navItems,
  liveKey = null,
  state = 'live',
  devices = DEMO_DEVICES,
  subtitle = 'wall dashboard',
  onNavigate,
  onSelectDevice,
  children,
  className,
}: DashboardShellProps) {
  return (
    <View className={cn('flex-1 flex-row bg-surface-base', className)}>
      <SideNav activeKey={activeKey} items={navItems} liveKey={liveKey} onNavigate={onNavigate} />
      <View className="flex-1">
        <TopBar
          state={state}
          devices={devices}
          subtitle={subtitle}
          onSelectDevice={onSelectDevice}
        />
        <View className="flex-1">{children ?? <ContentPlaceholder />}</View>
      </View>
    </View>
  )
}

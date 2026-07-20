import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { cn } from '../../utils/cn'
import { Surface } from '../ui/surface'
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

// The content well recesses INTO the frame: an inner shadow on the frame-facing
// edges only — stronger at the TOP opening (α.90), quieter down the LEFT (α.68),
// nothing on the screen-edge (right/bottom) sides. Painted as a pointer-transparent
// overlay ON TOP of the content so an opaque rail/stage can't hide it (an inset
// box-shadow renders below a container's children). Matches Lab "Frame Recess · 2-deep".
const RECESS_SHADOW =
  'inset 0 8px 12px -7px rgba(0,0,0,0.9), inset 8px 0 12px -7px rgba(0,0,0,0.68)'

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
    // Column: the TopBar spans the FULL width across the top, and the SideNav sits BELOW it
    // in the content row (not a full-height left rail). This keeps the brand/status band
    // unbroken edge-to-edge and lets the nav align under it. The shell is the outermost
    // Surface — it owns the base plane and seeds the on-surface colour context (mode) for
    // the whole dashboard tree.
    <Surface level="base" className={cn('flex-1', className)}>
      <TopBar state={state} devices={devices} subtitle={subtitle} onSelectDevice={onSelectDevice} />
      <View className="flex-1 flex-row">
        <SideNav activeKey={activeKey} items={navItems} liveKey={liveKey} onNavigate={onNavigate} />
        <View className="flex-1" style={{ position: 'relative' }}>
          {children ?? <ContentPlaceholder />}
          {/* Recess overlay — renders AFTER children (so it's on top) and is
              pointer-transparent, letting the frame-facing inner shadow read
              over an opaque rail/stage without intercepting interaction. */}
          <View
            pointerEvents="none"
            style={
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                boxShadow: RECESS_SHADOW,
              } as object
            }
          />
        </View>
      </View>
    </Surface>
  )
}

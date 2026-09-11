import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { cn } from '../../utils/cn'
import { Surface } from '../ui/surface'
import { SideNav, type SideNavItem } from './SideNav'
import { TopBar } from './TopBar'
import { brandPresets, type BrandKey } from './brands'

export interface AppShellProps {
  /** Which app identity the default {@link TopBar} and nav accent render. */
  brand?: BrandKey
  /** Brand subtitle on the default top bar. */
  subtitle?: string
  /** App chrome for the default top bar's right cluster (divider-separated). */
  topBarTrailing?: ReactNode | ReactNode[]
  /** Replace the whole top bar. Wins over `brand` / `subtitle` / `topBarTrailing`. */
  topBar?: ReactNode
  /** Nav categories, top → bottom. */
  navItems?: SideNavItem[]
  /** Active nav category key. */
  activeKey?: string
  /** A category with off-view live activity → a quiet cue on that item. */
  liveKey?: string | null
  onNavigate?: (key: string) => void
  /** Replace the whole left rail. Wins over `navItems` / `activeKey` / `liveKey`. */
  nav?: ReactNode
  /** Main content region. A placeholder renders when omitted. */
  children?: ReactNode
  className?: string
}

function ContentPlaceholder() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-heading text-sm text-text-tertiary">main content region</Text>
    </View>
  )
}

/**
 * `AppShell` — the generic dashboard chrome: a {@link TopBar} band over a
 * {@link SideNav} rail and a `children` content region. It knows nothing about
 * any one app: chrome arrives through the `topBarTrailing` slot (or the whole
 * `topBar` / `nav` slots), and categories through `navItems`. An app builds its
 * own shell by composing this one — see `shell/workout/WorkoutShell`.
 *
 * @example
 * <AppShell brand="brain" navItems={brainNavItems} activeKey={key} onNavigate={go}>
 *   <BrainPage />
 * </AppShell>
 */
export function AppShell({
  brand = 'voltras',
  subtitle,
  topBarTrailing,
  topBar,
  navItems = [],
  activeKey = '',
  liveKey = null,
  onNavigate,
  nav,
  children,
  className,
}: AppShellProps) {
  const { accentClassName, accentBarClassName } = brandPresets[brand]

  return (
    // Column: the TopBar spans the FULL width across the top, and the SideNav sits BELOW it
    // in the content row (not a full-height left rail). This keeps the brand/status band
    // unbroken edge-to-edge and lets the nav align under it. The shell is the outermost
    // Surface — it owns the base plane and seeds the on-surface colour context (mode) for
    // the whole dashboard tree.
    <Surface level="base" className={cn('flex-1', className)}>
      {topBar ?? <TopBar brand={brand} subtitle={subtitle} trailing={topBarTrailing} />}
      <View className="flex-1 flex-row">
        {nav ?? (
          <SideNav
            items={navItems}
            activeKey={activeKey}
            liveKey={liveKey}
            accentClassName={accentClassName}
            accentBarClassName={accentBarClassName}
            onNavigate={onNavigate}
          />
        )}
        <View className="flex-1">{children ?? <ContentPlaceholder />}</View>
      </View>
    </Surface>
  )
}

import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../utils/cn'
import { ActivityIcon, HistoryIcon, LayersIcon, PersonStandingIcon } from '../icons'
import { NavItem } from './NavItem'

export interface SideNavItem {
  /** Stable category key — matches `activeKey` / `liveKey`. */
  key: string
  /** Micro-label shown under the glyph. */
  label: string
  /** The glyph node (rendered ~20px via `currentColor`). */
  icon: ReactNode
}

export interface SideNavProps {
  /** Category items, top → bottom. Defaults to the four dashboard categories. */
  items?: SideNavItem[]
  /** Key of the active category. */
  activeKey: string
  /** Called with the tapped item's key. */
  onNavigate?: (key: string) => void
  /**
   * Key of a category with live activity while it is NOT active (e.g. a set
   * running off its view) → a quiet green cue on that item's label.
   */
  liveKey?: string | null
  className?: string
}

/** The four dashboard categories with their locked S2 glyphs (activity · history · layers · figure). */
export const defaultNavItems: SideNavItem[] = [
  { key: 'live', label: 'Live', icon: <ActivityIcon size={20} color="currentColor" /> },
  { key: 'review', label: 'Review', icon: <HistoryIcon size={20} color="currentColor" /> },
  { key: 'program', label: 'Plan', icon: <LayersIcon size={20} color="currentColor" /> },
  { key: 'body', label: 'Body', icon: <PersonStandingIcon size={20} color="currentColor" /> },
]

/**
 * Shell S2 · SideNav — the persistent 60px left rail that switches the main
 * viewport between categories (Live · Review · Program · Body). Presentational:
 * it renders `items` and reports taps via `onNavigate`; the app owns routing and
 * which key is `live`. Active item shows a left accent bar; `liveKey` (when not
 * the active view) tints that item's label a muted green. Fixed 60px at every
 * width — labels sit under the glyph, so they never change the rail width.
 */
export function SideNav({
  items = defaultNavItems,
  activeKey,
  onNavigate,
  liveKey = null,
  className,
}: SideNavProps) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn(
        'w-[60px] items-center gap-[6px] border-r border-hairline bg-background-base py-3',
        className
      )}
    >
      {items.map((item) => (
        <NavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          active={item.key === activeKey}
          live={item.key === liveKey && item.key !== activeKey}
          onPress={() => onNavigate?.(item.key)}
        />
      ))}
    </View>
  )
}

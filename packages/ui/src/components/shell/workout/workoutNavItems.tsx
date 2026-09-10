import { ActivityIcon, HistoryIcon, LayersIcon, PersonStandingIcon } from '../../icons'
import { type SideNavItem } from '../SideNav'

/** The four workout-dashboard categories with their locked S2 glyphs (activity · history · layers · figure). */
export const workoutNavItems: SideNavItem[] = [
  { key: 'live', label: 'Live', icon: <ActivityIcon size={20} color="currentColor" /> },
  { key: 'review', label: 'Review', icon: <HistoryIcon size={20} color="currentColor" /> },
  { key: 'program', label: 'Plan', icon: <LayersIcon size={20} color="currentColor" /> },
  { key: 'body', label: 'Body', icon: <PersonStandingIcon size={20} color="currentColor" /> },
]

/**
 * @deprecated Use `workoutNavItems` — these are the workout app's categories,
 * not a generic shell default. `SideNav.items` is required now (AW-132).
 */
export const defaultNavItems = workoutNavItems

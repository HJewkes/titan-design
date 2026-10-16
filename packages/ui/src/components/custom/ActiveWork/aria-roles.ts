import type { ViewProps } from 'react-native'

/**
 * React Native's `Role` union omits `'list'`, `'listitem'`, `'listbox'` and
 * `'group'` (it has `'option'`), even though RNW passes all four straight
 * through to the DOM. Cast once here rather than drop the ARIA parents that
 * make the family's item rows valid.
 */
export const LIST_ROLE = 'list' as ViewProps['role']
export const LISTITEM_ROLE = 'listitem' as ViewProps['role']
export const LISTBOX_ROLE = 'listbox' as ViewProps['role']
export const GROUP_ROLE = 'group' as ViewProps['role']

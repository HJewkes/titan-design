import type { ViewProps } from 'react-native'

/** Hides a painted subtree from assistive tech on web and native; its words live in the row name. */
export const hiddenFromAssistiveTech = {
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
}

// RN's Role union omits 'listitem'; RNW passes it through to the DOM.
export const LISTITEM_ROLE = 'listitem' as ViewProps['role']

// Digits of equal width, so a column does not jitter between rows.
export const TABULAR = { fontVariant: ['tabular-nums' as const] }

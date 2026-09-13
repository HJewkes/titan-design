import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

/** The interaction washes an exercise row can wear, beyond its resting look. */
export type ExerciseRowState = 'hovered' | 'selected' | 'pressed'

const ROW_STATE_TOKEN = {
  hovered: 'interactive-hover',
  selected: 'interactive-selected',
  pressed: 'interactive-active',
} as const satisfies Record<ExerciseRowState, keyof ReturnType<typeof getSemanticColors>>

/**
 * Literal-hex wash for one interaction state, in the same shape as
 * `onSurfaceColors`. Uses `getSemanticColors` rather than `resolveColor` so the
 * value survives where there are no CSS custom properties (the raw-RN wall SPA,
 * native) and stays assertable in tests.
 */
export function exerciseRowStateColor(state: ExerciseRowState, mode: ThemeMode = 'dark'): string {
  return getSemanticColors(mode)[ROW_STATE_TOKEN[state]]
}

/**
 * The tone for an exercise being performed right now. Static by construction —
 * a live row sits on a wall display, where titan's "the grain never animates"
 * rule applies just as much to a heading.
 */
export function exerciseLiveColor(mode: ThemeMode = 'dark'): string {
  return getSemanticColors(mode)['status-live']
}

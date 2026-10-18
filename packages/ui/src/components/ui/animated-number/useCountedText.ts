// AnimatedNumber's count for a component that keeps its own text: Metric, StatCard and Gauge.
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { countText } from './animated-number-model'

/** Style for a counting figure: tabular digits, so the text does not shift as they change. */
export const TABULAR_STYLE = { fontVariant: ['tabular-nums' as const] }

/** `progress` as a component should draw it: `undefined` (settled) for a reader who prefers reduced motion. */
export function useMotionProgress(progress?: number): number | undefined {
  const reducedMotion = usePrefersReducedMotion()
  return reducedMotion ? undefined : progress
}

/**
 * The text to show for `finalText` at `progress`. No progress, or a reader who prefers reduced
 * motion, gets `finalText` unchanged.
 */
export function useCountedText(finalText: string, progress?: number, from?: number): string {
  const shown = useMotionProgress(progress)
  return shown === undefined ? finalText : countText(finalText, shown, from)
}

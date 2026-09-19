/**
 * Depth and material values as CSS custom properties, for consumers that render
 * plain HTML and cannot call the React Native style helpers (static prototypes,
 * headless-Chrome video renders). Every value is read from the module that owns
 * it, so a retune there reaches `tokens.css` on the next build.
 */
import { ELEVATION_PLANE, GLOW_CONFIG, type GlowIntensity } from './elevation-planes'
import { liftShadow, type LiftStep } from './lift-shadow'
import { grainForTone, insetWell, paperSheet } from './materials'
import { SURFACE_LEVEL_TOKEN } from './surface-planes'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

const LIFT_STEPS: readonly LiftStep[] = [1, 2, 3, 4, 5]

const boxShadowOf = (style: object): string => (style as { boxShadow: string }).boxShadow

function elevationVars(mode: ThemeMode): Array<[string, string]> {
  return LIFT_STEPS.flatMap((step) => [
    [`--elevation-${step}-surface`, `var(--color-${SURFACE_LEVEL_TOKEN[ELEVATION_PLANE[step]]})`],
    [`--lift-${step}`, liftShadow(step, mode)],
  ])
}

function materialVars(mode: ThemeMode): Array<[string, string]> {
  const paperTone = getSemanticColors(mode)['surface-raised']
  return [
    ['--material-paper-grain', grainForTone(paperTone)],
    ['--material-paper-shadow', boxShadowOf(paperSheet(paperTone))],
    ['--material-inset-shadow', boxShadowOf(insetWell())],
  ]
}

// The colour is a channel triple so a caller can retint one glow by setting
// `--glow-rgb` on the element; brand primary is the default.
function glowVars(): Array<[string, string]> {
  return (Object.keys(GLOW_CONFIG) as GlowIntensity[]).map((intensity) => {
    const { blur, spread, opacity } = GLOW_CONFIG[intensity]
    const color = `rgba(var(--glow-rgb, var(--color-brand-primary-rgb)), ${opacity})`
    return [`--glow-${intensity}`, `0 0 ${blur}px ${spread}px ${color}`]
  })
}

export function depthCSSVars(mode: ThemeMode): Record<string, string> {
  return Object.fromEntries([...elevationVars(mode), ...materialVars(mode), ...glowVars()])
}

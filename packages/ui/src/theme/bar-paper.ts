// The matte "paper" treatment for a colored bar — a brightness-scaled fractal-noise
// grain + a crisp top rim-light + a soft contact shadow, so filled bars read as one
// tactile material across the system (velocity bars, ROM bars, …). Web-only CSS
// (backgroundImage + boxShadow) — harmless on native (ignored), styled for RNW/web.
//
// Promoted out of VelocityStrip so every colored-bar family composes ONE treatment
// instead of re-rolling it. Consumers spread it onto a bar's style: `...barPaper(hex)`.
import type { ViewStyle } from 'react-native'

/**
 * Grain opacity scaled by a color's perceived brightness: a bright bar keeps full
 * texture, a darker bar carries proportionally less so the grain never reads hot on a
 * dark tone. Anchored so lum ≈ 0.13 → ≈ 0.06 and lum ≈ 0.58 → ≈ 0.20.
 */
function grainOpacityForColor(hex: string): number {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return 0.14
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return Math.min(0.24, Math.max(0.04, 0.02 + 0.31 * lum))
}

/** The matte paper grain tile (fractalNoise), opacity brightness-scaled to `color`. */
function barGrain(color: string): string {
  const op = grainOpacityForColor(color).toFixed(3)
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='120' height='120' filter='url(%23n)' opacity='${op}'/%3E%3C/svg%3E")`
  )
}

/**
 * Paper/raised treatment for a colored bar of the given `color`: brightness-scaled
 * matte grain + a crisp top rim-light + a defined contact shadow. Spread onto a bar's
 * style. Presentation-only; scoped to filled bars (not shared strips/dividers).
 *
 * `flip` = a vertically-mirrored (`scaleY(-1)`) plot — a `down` wing of the diverging
 * chart. The contact shadow's y-offset is pre-inverted so the mirror lands it pointing
 * AWAY from the shared axis (not up across it), and the top rim-light is DROPPED (mirrored
 * it would sit on the axis edge and read wrong; grain + shadow alone carry the material).
 */
export function barPaper(color: string, flip = false): ViewStyle {
  return {
    backgroundImage: barGrain(color),
    boxShadow: flip
      ? '0 -6px 16px rgba(0,0,0,0.45)'
      : 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 16px rgba(0,0,0,0.45)',
  } as unknown as ViewStyle
}

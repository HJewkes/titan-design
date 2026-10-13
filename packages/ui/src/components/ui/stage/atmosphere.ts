/** One radial wash: a `backgroundImage` gradient from a brand token, painted at `opacity`. */
export interface StageWash {
  /** A `radial-gradient(…)` from the token to transparent. */
  image: string
  /** The wash strength. */
  opacity: number
}

// A full-strength token gradient on a layer at `opacity` paints the same pixels as the
// `.atmosphere-warm` rgba(…, a) gradient, without restating the token's channels here.
function wash(shape: string, at: string, token: string, opacity: number): StageWash {
  return {
    image: `radial-gradient(${shape} at ${at}, var(--color-${token}) 0%, transparent 45%)`,
    opacity,
  }
}

/**
 * The two `.atmosphere-warm` washes from `global.css`: brand-primary light from the top left at 0.06,
 * brand-secondary from the bottom right at 0.04.
 */
export function atmosphereWashes(): [StageWash, StageWash] {
  return [
    wash('ellipse 140% 100%', '15% 5%', 'brand-primary', 0.06),
    wash('ellipse 120% 80%', '85% 95%', 'brand-secondary', 0.04),
  ]
}

/**
 * The `.grain` page-root tile from `global.css` as a `backgroundImage` url. A non-zero `seed` picks a
 * different, equally static, noise field. Paint it at 0.015 opacity with an `overlay` blend.
 */
export function stageGrain(seed = 0): string {
  const seedAttr = seed === 0 ? '' : ` seed='${seed}'`
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E` +
    `%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' ` +
    `stitchTiles='stitch'${seedAttr}/%3E%3C/filter%3E` +
    `%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
  )
}

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { greyRamp, SURFACE_PLANE_STEPS } from './tokens/primitives'
import { semanticColorsDark } from './tokens/semantic'

/**
 * Drift guard for the Foundations/Color stories (VW-33).
 *
 * The color stories are the documentation of record for the token layer, and
 * they have drifted twice: once when the categorical palette replaced the
 * Paul-Tol scale, and again when the v0.10.0 surface redesign added four
 * planes (`surface-overlay`, `background-frame`,
 * `background-subtle`) that no story rendered. Both times the values stayed
 * correct while the *coverage* silently fell behind — which a screenshot test
 * cannot catch, because a story that was never written renders nothing.
 *
 * Two invariants, deliberately different in kind:
 *
 *  1. STRUCTURAL — every `surface-*`/`background-*` token resolves to a plane
 *     in the shipped ramp. Catches a token added off-ramp (an arbitrary fill),
 *     which is the failure the ordered-ramp story exists to prevent.
 *  2. COVERAGE — every other semantic token is named somewhere in the color
 *     stories, so a new token cannot ship without a swatch.
 *
 * The story files are read as TEXT, never imported: they pull in react-native
 * and nativewind, which throw under the node test environment. (They are also
 * outside the `stories-smoke` glob, which only composes `components/**` — so
 * this text guard is the only automated check on the color stories.)
 *
 * Both halves of Foundations/Color are scanned as one corpus: `Primitives`
 * documents the raw scales, `Palettes` the assignments of them. A token is
 * covered if EITHER names it — which is right, because the sidebar split is an
 * organising choice and coverage is about the token having a swatch at all.
 */

const themeDir = path.dirname(fileURLToPath(import.meta.url))
const storySources = ['ColorPrimitives.stories.tsx', 'ColorPalettes.stories.tsx']
  .map((f) => readFileSync(path.join(themeDir, f), 'utf8'))
  .join('\n')

/** Every plane a surface/background token is allowed to land on. */
const RAMP_PLANES = new Set<string>(
  Object.values(SURFACE_PLANE_STEPS).map((step) => greyRamp[step])
)

/**
 * Token families the color stories are NOT the documentation of record for,
 * with the story that owns them instead. Add here only with a real owner —
 * the point of this list is that nothing falls through unowned.
 */
const DOCUMENTED_ELSEWHERE: Record<string, string> = {
  hairline: 'Components/Atoms/Surface (rendered as separators, not swatches)',
  on: 'Components/Atoms/Surface — OnSurfaceText (paired with their surface)',
  interactive: 'Components/* (state colors are shown on the components themselves)',
  avatar: 'Components/Atoms/Avatar',
}

const isSurfaceToken = (name: string) => /^(surface|background)-/.test(name)

/** Must mirror VARIANT_SUFFIXES in ColorPalettes.stories.tsx (asserted below). */
const VARIANT_SUFFIXES = ['light', 'dark', 'subtle', 'hover', 'active', 'muted'] as const

describe('Foundations/Color story coverage', () => {
  it('every surface/background token resolves to a plane in the shipped ramp', () => {
    const offRamp = Object.entries(semanticColorsDark)
      .filter(([name]) => isSurfaceToken(name))
      .filter(([, value]) => !RAMP_PLANES.has(value as string))
      .map(([name, value]) => `${name}=${value as string}`)

    expect(
      offRamp,
      'surface/background tokens whose value is not one of the greyRamp steps ' +
        'named in SURFACE_PLANE_STEPS. Either fold the value into the ramp, or add ' +
        'the plane to SURFACE_PLANES in ColorPalettes.stories.tsx and document why ' +
        'it sits outside the ramp.'
    ).toEqual([])
  })

  it("the test's VARIANT_SUFFIXES mirror still matches the story", () => {
    // The coverage rule below depends on this list matching the one the story
    // renders from; if they drift, coverage silently over- or under-reports.
    const declared = storySources.match(/const VARIANT_SUFFIXES = \[([^\]]*)\]/)
    expect(declared, 'VARIANT_SUFFIXES not found in ColorPalettes.stories.tsx').not.toBeNull()
    const fromStory = [...declared![1].matchAll(/'([a-z]+)'/g)].map((m) => m[1])
    expect(fromStory).toEqual([...VARIANT_SUFFIXES])
  })

  it('the surface story renders every ramp plane', () => {
    // Each plane is a greyRamp step now, so the ladder must reference the step
    // rather than a named member of a separate ramp object.
    const missing = Object.values(SURFACE_PLANE_STEPS)
      .map((step) => `greyRamp[${step}]`)
      .filter((ref) => !storySources.includes(ref))

    expect(missing, 'ramp planes absent from the SURFACE_PLANES ladder').toEqual([])
    // Guard the count too: a plane added to the ramp must gain a row.
    expect(Object.keys(SURFACE_PLANE_STEPS)).toHaveLength(6)
  })

  it('every other semantic token is named in a color story', () => {
    // A token is covered if the story names it literally, or if it is the
    // `-light`/`-subtle`/… variant of a base the story feeds to VariantMatrix
    // (which builds those names at runtime, so they never appear as literals).
    const namedLiterally = (token: string) => storySources.includes(`'${token}'`)
    const coveredByMatrix = (token: string) =>
      VARIANT_SUFFIXES.some(
        (suffix) =>
          token.endsWith(`-${suffix}`) && namedLiterally(token.slice(0, -(suffix.length + 1)))
      )

    const undocumented = Object.keys(semanticColorsDark)
      .filter((name) => !isSurfaceToken(name))
      .filter((name) => !DOCUMENTED_ELSEWHERE[name.split('-')[0]])
      .filter((name) => !namedLiterally(name) && !coveredByMatrix(name))

    expect(
      undocumented,
      'semantic tokens with no swatch in Foundations/Color. Add one (a plain ' +
        'ColorSwatch, or the base to a VariantMatrix), or add the family to ' +
        'DOCUMENTED_ELSEWHERE with the story that owns it.'
    ).toEqual([])
  })
})

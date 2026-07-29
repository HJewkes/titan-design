/**
 * Surface MATERIALS — the treatments layered on top of the flat grey ramp.
 *
 * The ramp says how deep a plane sits. This says what it is made of. Two
 * materials, deliberately: a matte PAPER sheet for hero surfaces, and a recessed
 * INSET WELL for grouped or awaiting-data regions.
 *
 * SCOPE, and it is a hard rule rather than a preference: paper goes on hero
 * surfaces only — the live card, the LOAD/verdict chip, the rest hero. The
 * "everything is a paper card" look is explicitly NOT the model; it was an
 * over-application built to find the ceiling. There are no LEVELS of paper. One
 * treatment, used sparingly, or the texture stops meaning anything.
 *
 * Second hard rule: paper fills take DEEP/MUTED tones only (a ramp step, or a
 * categorical `dark` variant). Vivid and neon colours are ink ON paper — never
 * the paper itself.
 *
 * PLATFORM: `backgroundImage` and multi-layer `boxShadow` are web/RNW only. On
 * native these are ignored and the surface falls back to its flat fill, which is
 * why every material here keeps `backgroundColor` load-bearing on its own. A
 * material must never be the only thing carrying meaning.
 *
 * ── THE TONAL FILL IS GONE (VW-99, S-6 wall calibration) ───────────────────
 *
 * `paperSheet` used to carry a vertical ΔL* 3 gradient, sized "just under seen
 * as a gradient". On the wall panel at ~3 m it could not be told from a flat
 * sheet of the same tone, and the full material still read as — the operator's
 * words — "a flat digital rectangle". It failed its own stated purpose, which
 * was precisely to stop that.
 *
 * Raising it was not available. The design ceiling is ~ΔL* 4 (past that it reads
 * decorative, which the exploration rejected), and the same run showed why the
 * headroom would not have helped: the 0.025 ELEVATION step — a comparable ΔL*
 * — was called instantly, because it sits at a hard edge between two flat
 * fields. The fill spread the same amount smoothly over ~300 px, where vision is
 * genuinely poor. It is a spatial-frequency problem, not an amplitude one, so
 * the band between "invisible" and "decorative" may simply not exist here.
 *
 * ── AND THE DITHER WENT WITH IT (VW-99 run 2) ──────────────────────────────
 *
 * `ditherTile` was held back one run on the grounds that "probably dead weight"
 * is not a measurement. Run 1 could not measure it: with the fill invisible
 * there was no gradient to band, so the panel returned a guaranteed clean sheet.
 *
 * Run 2 settled it by adding a hand-quantised REFERENCE beside the smooth
 * control — the same tone span drawn as five hard-edged 1-level steps, which is
 * what the artefact looks like when it happens. The reference banded plainly and
 * the smooth gradient did not. So the panel can resolve banding; this render
 * path simply does not produce it. A mitigation for an artefact that does not
 * occur is cost with no benefit, and it is gone.
 *
 * That is a claim about THIS display, which is the one the product ships on and
 * the reason `paperSheet` is hero-surface-only. A phone is a separate question.
 *
 * Kept: grain, rim-light, contact shadow.
 *
 * See sources/design/surface-system-north-star.md §4 and
 * sources/runbooks/VW-99-depth-wall-calibration.md.
 */
import type { ViewStyle } from 'react-native'
import { getSemanticColors } from './tokens/semantic'

const c = getSemanticColors('dark')

// ── colour math ─────────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const rgb: [number, number, number] = [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
  return rgb.some(Number.isNaN) ? null : rgb
}

/** sRGB perceived luminance (0 dark … 1 bright), Rec.601 weights. */
function perceivedLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0.5
  const [r, g, b] = rgb
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// The CIELAB conversion chain (srgb2lin/lin2srgb/fLab/fInv, hexToLab/labToHex,
// shiftL) lived here so the tonal fill could be specified in ΔL*. It had no
// other caller, so it went with the fill — see the module header.

// ── grain ───────────────────────────────────────────────────────────────────

/**
 * Grain opacity for a tone, scaled by perceived brightness.
 *
 * A fixed opacity reads hot on a dark plane and vanishes on a bright one, so
 * darker tones get a whisper and brighter tones keep full texture. Anchored so a
 * dark chip (lum ≈ 0.13) lands ≈ 0.06 and a bright bar (lum ≈ 0.58) lands ≈ 0.20.
 * Above roughly 0.05α on a mid tone it starts reading as "dirty" rather than
 * matte, which is what the clamp is protecting.
 *
 * This is the ONE curve all grain goes through — a card and a bar carry
 * proportional, not identical, texture. That is what makes them read as the same
 * material.
 */
export function grainOpacityForTone(baseColor: string): number {
  return Math.min(0.24, Math.max(0.04, 0.02 + 0.31 * perceivedLuminance(baseColor)))
}

/**
 * The matte grain tile as a `backgroundImage` url — one shared `feTurbulence`
 * fractal-noise tile, painted once, NEVER animated. Pair with
 * `backgroundColor: baseColor`.
 */
export function grainForTone(baseColor: string): string {
  const op = grainOpacityForTone(baseColor).toFixed(3)
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='120' height='120' filter='url(%23n)' opacity='${op}'/%3E%3C/svg%3E")`
  )
}

// `tonalFill` and `ditherTile` both lived here until VW-99 measured them on the
// wall. Deleted rather than left exported-but-unused; the reasoning is in the
// module header, which is the part worth keeping.

// ── the materials ───────────────────────────────────────────────────────────

/**
 * A matte PAPER hero sheet: brightness-scaled grain + a crisp top rim-light +
 * one soft contact shadow.
 *
 * The contact shadow is the ONE place a drop-shadow is still correct on a dark
 * surface: it is large, soft, and describes a sheet lying on a plane rather than
 * trying to encode hierarchy. Inline depth is the hairline's job.
 *
 * Defaults to `surface-raised` so a same-toned card laid inside reads as one
 * continuous sheet rather than a seam.
 *
 * THE RIM-LIGHT IS A HAIRLINE. Run 2 of VW-99 called it "weak at distance" on
 * both the card and the hero sheet, and the reason is visible in the number: it
 * was `rgba(255,255,255,0.10)`, a 1px white line on a dark plane — physically
 * the same cue as `hairline-*`, but set BELOW `hairline-default`, which the same
 * run had just had to raise twice. It is not a subtler species of edge, it was
 * simply mistuned. Raised to `0.20`, between `hairline-default` and
 * `hairline-strong`: this edge defines a hero surface, so it earns more than the
 * default separator, and unlike a separator there is no fallback behind it.
 *
 * Deliberately NOT wired to the token, though the values now agree in spirit: a
 * box-shadow rim and a border hairline are retuned by different evidence, and
 * coupling them means a hairline run silently restyles every hero sheet.
 *
 * HERO SURFACES ONLY, MUTED TONES ONLY — see the module header.
 */
export function paperSheet(tone: string = c['surface-raised']): ViewStyle {
  return {
    backgroundColor: tone,
    // Grain alone. The dither went with the gradient it protected — see header.
    backgroundImage: grainForTone(tone),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20), 0 8px 22px rgba(0,0,0,0.50)',
  } as unknown as ViewStyle
}

/**
 * A recessed INSET WELL: a tone pressed BELOW the surrounding plane, cut in by an
 * inner top shadow with a faint light line on the floor.
 *
 * The bottom rim is the load-bearing half. A dark inset alone just reads as a
 * darker rectangle; it is the light catching the floor that says "this is below
 * the surface" — which is why the treatment survives at 16px where a full paper
 * treatment does not.
 *
 * The floor light was `0.04` and is now `0.12`, chosen on the wall in VW-99 run
 * 2 against a `.04`-vs-`.12`-vs-none forced choice. Worth recording that `.04`
 * was NOT invisible — the no-line decoy was correctly rejected and both real
 * values were seen, so this is a preference between two working values, not a
 * rescue. The rim-light next door was a genuine miss; this one was only thin.
 *
 * Note this is a MATERIAL, and independent of the surface LEVEL named `inset`
 * that was retired in TD-07.14. A well is something you apply; a level is
 * somewhere you sit.
 */
export function insetWell(tone: string = c['surface-input']): ViewStyle {
  return {
    backgroundColor: tone,
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.12)',
  } as unknown as ViewStyle
}

/**
 * Paper for a COLORED BAR — the same material as {@link paperSheet}, tuned for a
 * small saturated element: grain + top rim-light + a contact shadow cast past the
 * bar's leading edge, so a filled bar reads as a physical block that has travelled.
 *
 * No tonal fill or dither here: a bar is too narrow for a ΔL* 3 gradient to read,
 * and too narrow to band.
 *
 * `flip` = a vertically mirrored (`scaleY(-1)`) plot, i.e. the `down` wing of a
 * diverging chart. The contact shadow's y-offset is pre-inverted so the mirror
 * lands it pointing AWAY from the shared axis rather than up across it, and the
 * top rim-light is DROPPED — mirrored it would sit on the axis edge and read
 * wrong, so grain and shadow carry the material alone.
 */
export function barPaper(color: string, flip = false): ViewStyle {
  return {
    backgroundImage: grainForTone(color),
    boxShadow: flip
      ? '0 -6px 16px rgba(0,0,0,0.45)'
      : 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 16px rgba(0,0,0,0.45)',
  } as unknown as ViewStyle
}

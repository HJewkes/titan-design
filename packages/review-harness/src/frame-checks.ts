import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import {
  THEME_MODES,
  isImageVariant,
  type Manifest,
  type ThemeMode,
  type Variant,
} from '@titan-design/review-schema'
import type { MeasuredFrame } from './contrast-gate.ts'
import { TRACK_FLOOR_DELTA_L, toneOf, type MarkProbe, type Tone } from './frame-probe.ts'
import { declaredTheme, type FramesIndex } from './frames.ts'

// The checks a round passes before it is served (TD-962). Each returns one line per fault,
// naming the frame, and the build refuses a round with any.

/** Below the perceptual midpoint between black and white (CIE L* 50) a plane or face reads dark. */
export const DARK_LSTAR = 50

const KEY_SUFFIX: Record<ThemeMode, RegExp> = {
  light: /(^|[-_])(l|light)$/i,
  dark: /(^|[-_])(d|dark)$/i,
}

/**
 * The theme a frame is shown as: its declared theme, else what its key (`-l`, `-light`) or
 * label (the word "light") says. An image or an undeclared story is labelled, not themed.
 */
export function labelledTheme(variant: Variant): ThemeMode | undefined {
  return (
    declaredTheme(variant) ??
    THEME_MODES.find(
      (mode) =>
        KEY_SUFFIX[mode].test(variant.key) || new RegExp(`\\b${mode}\\b`, 'i').test(variant.label)
    )
  )
}

const isLight = (variant: Variant | undefined) =>
  variant !== undefined && labelledTheme(variant) === 'light'

const dark = (tone: Tone) => `(L* ${tone.lstar} ${tone.hex})`

/** A light frame measured in light whose plane, or a grey control face, reads dark. */
export function lightFrameProblems(manifest: Manifest, frames: MeasuredFrame[]): string[] {
  const byKey = new Map(manifest.variants.map((v) => [v.key, v]))
  return frames
    .filter((f) => f.mode === 'light' && f.probe && isLight(byKey.get(f.variant)))
    .flatMap((f) => {
      const at = `light frame ${f.variant} light @${f.width}`
      const { plane, faces } = f.probe!
      return [
        ...(plane && plane.lstar < DARK_LSTAR
          ? [`${at}: its plane reads dark ${dark(plane)}`]
          : []),
        ...faces
          .filter((face) => face.neutral && face.lstar < DARK_LSTAR)
          .map((face) => `${at}: control face [${face.selector}] reads dark ${dark(face)}`),
      ]
    })
}

const count = (items: unknown[], of: number) =>
  items.length === of ? `all ${of}` : `${items.length} of ${of}`

/** Why a named mark does not show, one line per fault. */
function markFaults(mark: MarkProbe): string[] {
  const named = `mark ${mark.name} (${mark.selector})`
  if (mark.invalid) return [`${named} is not a valid selector`]
  if (mark.count === 0) return [`${named} matches nothing`]
  const weakest = Math.min(...mark.faint.map((f) => f.deltaL))
  return [
    ...(mark.zero.length ? [`${named}: ${count(mark.zero, mark.count)} have a zero box`] : []),
    ...(mark.faint.length
      ? [
          `${named}: ${count(mark.faint, mark.count)} paint under the TD-490 track floor ` +
            `(ΔL* ${weakest} < ${TRACK_FLOOR_DELTA_L}), first [${mark.faint[0].selector}]`,
        ]
      : []),
  ]
}

/** A frame in the theme it is shown in: unlabelled, it could be shown in either. */
const shownIn = (variant: Variant | undefined, mode: ThemeMode) => {
  const theme = variant && labelledTheme(variant)
  return theme === undefined || theme === mode
}

/** A frame that renders blank, or whose named marks have no box or paint too faintly to see. */
export function renderProblems(manifest: Manifest, frames: MeasuredFrame[]): string[] {
  const byKey = new Map(manifest.variants.map((v) => [v.key, v]))
  return frames
    .filter((f) => f.probe && shownIn(byKey.get(f.variant), f.mode))
    .flatMap((f) => {
      const at = `frame ${f.variant} ${f.mode} @${f.width}`
      const { box, painted, marks } = f.probe!
      if (box.width === 0 || box.height === 0) return [`${at}: renders blank (its root has no box)`]
      if (painted === 0) return [`${at}: renders blank (no text or mark is painted)`]
      return marks.flatMap(markFaults).map((fault) => `${at}: ${fault}`)
    })
}

/** The median of a PNG's outer one-pixel ring: what the frame sits on, read from the pixels. */
export async function pngPlane(file: string): Promise<Tone> {
  const png = PNG.sync.read(await readFile(file))
  const { width, height, data } = png
  const ring: Tone[] = []
  const at = (x: number, y: number) => {
    const i = (y * width + x) * 4
    ring.push(toneOf([data[i], data[i + 1], data[i + 2], data[i + 3] / 255]))
  }
  for (let x = 0; x < width; x++) [0, height - 1].forEach((y) => at(x, y))
  for (let y = 1; y < height - 1; y++) [0, width - 1].forEach((x) => at(x, y))
  ring.sort((a, b) => a.lstar - b.lstar)
  return ring[Math.floor(ring.length / 2)]
}

interface ServedPng {
  /** The frame as the page names it: the variant key, or the static frame's key. */
  name: string
  variant: Variant | undefined
  file: string
  /** The file as the round names it, relative to the round directory. */
  shown: string
}

async function darkPlanes(pngs: ServedPng[]): Promise<string[]> {
  const problems: string[] = []
  for (const png of pngs.filter((p) => isLight(p.variant))) {
    const plane = await pngPlane(png.file)
    if (plane.lstar < DARK_LSTAR)
      problems.push(`light frame ${png.name}: its plane reads dark ${dark(plane)} in ${png.shown}`)
  }
  return problems
}

/** Every image labelled light whose PNG sits on a dark plane; `images` holds each one's path. */
export function imagePlaneProblems(
  manifest: Manifest,
  images: Record<string, string>
): Promise<string[]> {
  return darkPlanes(
    manifest.variants
      .filter(isImageVariant)
      .map((v) => ({ name: v.key, variant: v, file: images[v.key], shown: v.image }))
  )
}

/** Every static frame of a light-labelled story that rendered on a dark plane, as it is served. */
export function servedPlaneProblems(
  manifest: Manifest,
  roundDir: string,
  index: FramesIndex
): Promise<string[]> {
  const byKey = new Map(manifest.variants.map((v) => [v.key, v]))
  return darkPlanes(
    index.frames.map((f) => ({
      name: f.key,
      variant: byKey.get(f.variant),
      file: join(roundDir, f.file),
      shown: f.file,
    }))
  )
}

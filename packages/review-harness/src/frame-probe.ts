import { planes, type FrameResult } from './contrast-check.ts'
import { luminance, over, toHex, withAlpha, type Rgba } from './contrast.ts'
import type { CollectedFrame, RawBox, RawMark, RawMarkHit } from './contrast-collect.ts'

/** A painted colour as the frame checks judge it: its hex, CIE L* and whether it is a grey. */
export interface Tone {
  hex: string
  lstar: number
  neutral: boolean
}

/** What one measured frame showed, reduced to what the frame checks read (TD-962). */
export interface FrameProbe {
  box: RawBox
  /** The story root's effective plane; null when the story rendered no root. */
  plane: Tone | null
  faces: (Tone & { selector: string })[]
  /** How many text and mark samples the frame painted; none is a blank frame. */
  painted: number
  marks: MarkProbe[]
}

/** One named mark: how many elements it matched, and which have no box or paint too faintly. */
export interface MarkProbe {
  name: string
  selector: string
  invalid: boolean
  count: number
  zero: string[]
  /** Each faint hit's selector with its best ΔL* against its plane. */
  faint: { selector: string; deltaL: number }[]
}

/**
 * The TD-490 track floor: ΔL* 12 against the plane. TD-490 drew the light Progress track as
 * `bg-hairline` (packages/ui/src/components/ui/progress/Progress.tsx), and the non-text pairs
 * hold that token, `hairline-default`, to the DEFAULT separator floor of ΔL* 12
 * (packages/ui/src/theme/nontext-contrast/pairs.ts, `separator.hairline-default`). A named mark
 * that paints fainter than the track it sits beside does not show.
 */
export const TRACK_FLOOR_DELTA_L = 12

/** A face whose channels spread by at most this much (10% of 0-255) is a grey, such as charcoal. */
const NEUTRAL_SPREAD = 26

const WHITE: Rgba = [255, 255, 255, 1]

/** CIE L* (0 black to 100 white) of an sRGB colour, through WCAG relative luminance. */
export function lstar(color: Rgba): number {
  const y = luminance(color)
  const f = y > 216 / 24389 ? Math.cbrt(y) : ((24389 / 27) * y + 16) / 116
  return 116 * f - 16
}

export function toneOf(color: Rgba): Tone {
  const opaque = color[3] < 1 ? over(color, WHITE) : color
  const channels = opaque.slice(0, 3)
  return {
    hex: toHex(opaque),
    lstar: Math.round(lstar(opaque) * 10) / 10,
    neutral: Math.max(...channels) - Math.min(...channels) <= NEUTRAL_SPREAD,
  }
}

type Planes = ReturnType<typeof planes>

/** The most visible paint of a hit, as |ΔL*| over its plane; 0 when it paints nothing. */
function bestDeltaL(hit: RawMarkHit, all: Planes): number {
  const plane = all[hit.plane].color
  const base = lstar(plane)
  const deltas = hit.paints.map(({ node, color }) => {
    const shown = over(withAlpha(color, all[node].opacity), plane)
    return Math.abs(lstar(shown) - base)
  })
  return Math.max(0, ...deltas)
}

function markProbe(mark: RawMark, all: Planes): MarkProbe {
  const faint = mark.hits
    .filter((hit) => !hit.zero)
    .map((hit) => ({ selector: hit.selector, deltaL: Math.round(bestDeltaL(hit, all) * 10) / 10 }))
    .filter((hit) => hit.deltaL < TRACK_FLOOR_DELTA_L)
  return {
    name: mark.name,
    selector: mark.selector,
    invalid: mark.invalid,
    count: mark.hits.length,
    zero: mark.hits.filter((hit) => hit.zero).map((hit) => hit.selector),
    faint,
  }
}

export function evaluateProbe(frame: CollectedFrame, result: FrameResult): FrameProbe {
  const all = planes(frame)
  const { root, box, faces, marks } = frame.probe
  return {
    box,
    plane: root === null ? null : toneOf(all[root].color),
    faces: faces.map((face) => ({ selector: face.selector, ...toneOf(all[face.node].color) })),
    painted: result.checks.length + result.indeterminate.length,
    marks: marks.map((mark) => markProbe(mark, all)),
  }
}

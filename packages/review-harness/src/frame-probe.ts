import { planes } from './contrast-check.ts'
import { luminance, over, toHex, type Rgba } from './contrast.ts'
import type { CollectedFrame, RawBox } from './contrast-collect.ts'

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
}

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

export function evaluateProbe(frame: CollectedFrame): FrameProbe {
  const all = planes(frame)
  const { root, box, faces } = frame.probe
  return {
    box,
    plane: root === null ? null : toneOf(all[root].color),
    faces: faces.map((face) => ({ selector: face.selector, ...toneOf(all[face.node].color) })),
  }
}
